import { Hono, type Context } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { audit, currentUser, nextCode, rateLimit } from "./data";
import { canTransitionBooking, canTransitionSitter, hasRole, type BookingStatus, type Role, type SitterStatus } from "./domain";
import { findMatches } from "./matching";
import {
  clearSessionCookies, hashPassword, newId, randomToken, requestIp, sessionExpiry,
  setSessionCookies, sha256, timingSafeEqual, verifyPassword, type AppContext, type AppVariables, type SessionUser
} from "./security";

type App = { Bindings: Env; Variables: AppVariables };
const app = new Hono<App>();
const now = () => new Date().toISOString();
const publicAuthPaths = new Set(["/api/auth/register", "/api/auth/login", "/api/auth/verify", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/bootstrap-admin", "/api/public/contact"]);

app.onError((error, c) => {
  console.error(JSON.stringify({ event: "request_error", message: error.message, path: c.req.path }));
  if (error.message.includes("SITTER_DOUBLE_BOOKING")) return c.json({ error: "This sitter is no longer available for that time." }, 409);
  return c.json({ error: "The request could not be completed." }, 500);
});

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (c.req.path.startsWith("/api/")) {
    c.header("Cache-Control", "no-store");
    if (Number(c.req.header("Content-Length") || 0) > 64 * 1024) return c.json({ error: "Request body is too large." }, 413);
  }
  await next();
});

app.use("/api/*", async (c, next) => {
  const user = await currentUser(c as AppContext);
  c.set("user", user ?? undefined);
  await next();
});

app.use("/api/*", async (c, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(c.req.method) || publicAuthPaths.has(c.req.path)) return next();
  const user = c.get("user");
  if (!user) return c.json({ error: "Authentication required." }, 401);
  const csrf = c.req.header("X-CSRF-Token") || "";
  const cookie = getCookie(c, "ss_csrf") || "";
  if (!csrf || csrf !== cookie || await sha256(csrf) !== user.csrfHash) return c.json({ error: "Invalid CSRF token." }, 403);
  return next();
});

app.get("/api/health", (c) => c.json({ ok: true, service: "suncoast-sitters", time: now() }));

app.post("/api/public/contact",async(c)=>{
  if(!await rateLimit(c as AppContext,"public-contact",requestIp(c as AppContext),5,3600))return c.json({error:"Too many messages. Try again later."},429);
  const parsed=z.object({name:z.string().trim().min(2).max(100),email:z.email().max(254),message:z.string().trim().min(5).max(3000)}).safeParse(await safeJson(c));
  if(!parsed.success)return c.json({error:"Please check the contact form."},400);
  const id=newId("inq"),timestamp=now();await c.env.DB.prepare("INSERT INTO public_inquiries(id,kind,name,email,message,created_at,updated_at) VALUES (?,'contact',?,?,?,?,?)").bind(id,parsed.data.name,parsed.data.email.toLowerCase(),parsed.data.message,timestamp,timestamp).run();
  return c.json({message:"Message received."},201);
});

const authSchema = z.object({ email: z.email().max(254), password: z.string().min(12).max(128) });
const registerSchema = authSchema.extend({
  role: z.enum(["family", "sitter"]),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(30),
  avatar: z.enum(["heron","pelican","manatee","turtle","dolphin","flamingo","crab","owl"]).optional()
});

app.post("/api/auth/register", async (c) => {
  const parsed = registerSchema.safeParse(await safeJson(c));
  if (!parsed.success) return c.json({ error: "Please check the registration fields.", fields: z.flattenError(parsed.error).fieldErrors }, 400);
  const email = parsed.data.email.trim().toLowerCase();
  if (!await rateLimit(c as AppContext, "register", requestIp(c as AppContext), 8, 3600)) return c.json({ error: "Too many attempts. Try again later." }, 429);
  const exists = await c.env.DB.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first();
  if (exists) return c.json({ message: "If the address can be registered, verification instructions will be sent." }, 202);
  const userId = newId("usr");
  const rawToken = randomToken();
  const timestamp = now();
  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;
  const publicCode = await nextCode(c.env.DB, parsed.data.role);
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`INSERT INTO users(id,email,password_hash,role,status,created_at,updated_at) VALUES (?,?,?,?,'pending_email',?,?)`)
      .bind(userId, email, await hashPassword(parsed.data.password), parsed.data.role, timestamp, timestamp),
    c.env.DB.prepare(`INSERT INTO auth_tokens(id,user_id,purpose,token_hash,expires_at,created_at) VALUES (?,?,'verify_email',?,?,?)`)
      .bind(newId("tok"), userId, await sha256(rawToken), new Date(Date.now() + 24 * 3600_000).toISOString(), timestamp)
  ];
  if (parsed.data.role === "family") {
    statements.push(c.env.DB.prepare(`INSERT INTO family_profiles(user_id,public_code,household_name,first_name,last_name,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(userId, publicCode, fullName, parsed.data.firstName, parsed.data.lastName, parsed.data.phone, timestamp, timestamp));
  } else {
    statements.push(c.env.DB.prepare(`INSERT INTO sitter_profiles(user_id,public_code,avatar,display_name,first_name,last_name,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(userId, publicCode, parsed.data.avatar || "heron", fullName, parsed.data.firstName, parsed.data.lastName, parsed.data.phone, timestamp, timestamp));
  }
  statements.push(c.env.DB.prepare(`INSERT INTO notification_outbox(id,user_id,channel,template,recipient,payload_json,available_at,created_at)
    VALUES (?,?,'email','verify_email',?,?,?,?)`).bind(newId("not"), userId, email, JSON.stringify({ verificationUrl: `${c.env.APP_ORIGIN}/portal/#verify=${rawToken}` }), timestamp, timestamp));
  await c.env.DB.batch(statements);
  return c.json({
    message: "Account created. Email delivery is not configured yet; Suncoast Sitters will contact you before access is activated.",
    verificationPending: true
  }, 201);
});

app.post("/api/auth/verify", async (c) => {
  const token = z.object({ token: z.string().min(32).max(200) }).safeParse(await safeJson(c));
  if (!token.success) return c.json({ error: "Invalid or expired verification link." }, 400);
  const row = await c.env.DB.prepare(`SELECT id,user_id FROM auth_tokens WHERE token_hash=? AND purpose='verify_email' AND used_at IS NULL AND expires_at>?`)
    .bind(await sha256(token.data.token), now()).first<{ id: string; user_id: string }>();
  if (!row) return c.json({ error: "Invalid or expired verification link." }, 400);
  const timestamp = now();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE auth_tokens SET used_at=? WHERE id=?").bind(timestamp, row.id),
    c.env.DB.prepare("UPDATE users SET status='active',email_verified_at=?,updated_at=? WHERE id=? AND status='pending_email'").bind(timestamp, timestamp, row.user_id)
  ]);
  return c.json({ message: "Email verified. You can now sign in." });
});

app.post("/api/auth/login", async (c) => {
  const parsed = authSchema.safeParse(await safeJson(c));
  if (!parsed.success) return c.json({ error: "Invalid email or password." }, 401);
  const email = parsed.data.email.trim().toLowerCase();
  const identifier = `${requestIp(c as AppContext)}:${email}`;
  if (!await rateLimit(c as AppContext, "login", identifier, 10, 15 * 60)) return c.json({ error: "Too many attempts. Try again later." }, 429);
  const user = await c.env.DB.prepare(`SELECT id,email,password_hash,role,status,session_version,locked_until FROM users WHERE email=?`)
    .bind(email).first<{ id:string; email:string; password_hash:string; role:Role; status:string; session_version:number; locked_until:string|null }>();
  const valid = user && (!user.locked_until || user.locked_until < now()) && user.status === "active" && await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid || !user) {
    if (user) await c.env.DB.prepare("UPDATE users SET failed_login_count=failed_login_count+1, locked_until=CASE WHEN failed_login_count>=4 THEN datetime('now','+15 minutes') ELSE locked_until END WHERE id=?").bind(user.id).run();
    return c.json({ error: "Invalid email or password." }, 401);
  }
  const sessionToken = randomToken();
  const csrfToken = randomToken(24);
  const timestamp = now();
  await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO sessions(id,user_id,token_hash,csrf_hash,session_version,ip_hash,user_agent,expires_at,created_at,last_seen_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(newId("ses"), user.id, await sha256(sessionToken), await sha256(csrfToken), user.session_version,
        await sha256(requestIp(c as AppContext)), (c.req.header("User-Agent") || "").slice(0, 300), sessionExpiry(), timestamp, timestamp),
    c.env.DB.prepare("UPDATE users SET failed_login_count=0,locked_until=NULL,last_login_at=?,updated_at=? WHERE id=?").bind(timestamp, timestamp, user.id)
  ]);
  setSessionCookies(c as AppContext, sessionToken, csrfToken);
  return c.json({ user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/api/auth/logout", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  await c.env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(user.sessionId).run();
  clearSessionCookies(c as AppContext);
  return c.json({ message: "Signed out." });
});

app.get("/api/auth/me", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  const profile = user.role === "family"
    ? await c.env.DB.prepare("SELECT public_code,household_name,first_name,last_name,phone,default_area,emergency_contact_name,emergency_contact_phone FROM family_profiles WHERE user_id=?").bind(user.id).first()
    : user.role === "sitter"
      ? await c.env.DB.prepare("SELECT public_code,avatar,display_name,first_name,last_name,phone,bio,home_area,service_areas_json,age_groups_json,languages_json,has_vehicle,can_transport_children,screening_status FROM sitter_profiles WHERE user_id=?").bind(user.id).first()
      : null;
  return c.json({ user: { id:user.id,email:user.email,role:user.role,status:user.status }, profile });
});

app.post("/api/auth/forgot-password", async (c) => {
  const parsed = z.object({ email:z.email().max(254) }).safeParse(await safeJson(c));
  const generic = { message:"If an active account exists, reset instructions will be sent." };
  if (!parsed.success) return c.json(generic, 202);
  const email = parsed.data.email.toLowerCase();
  if (!await rateLimit(c as AppContext,"forgot",`${requestIp(c as AppContext)}:${email}`,5,3600)) return c.json(generic,202);
  const user = await c.env.DB.prepare("SELECT id FROM users WHERE email=? AND status='active'").bind(email).first<{id:string}>();
  if (user) {
    const rawToken=randomToken(); const timestamp=now();
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE auth_tokens SET used_at=? WHERE user_id=? AND purpose='reset_password' AND used_at IS NULL").bind(timestamp,user.id),
      c.env.DB.prepare("INSERT INTO auth_tokens(id,user_id,purpose,token_hash,expires_at,created_at) VALUES (?,?,'reset_password',?,?,?)").bind(newId("tok"),user.id,await sha256(rawToken),new Date(Date.now()+3600_000).toISOString(),timestamp),
      c.env.DB.prepare(`INSERT INTO notification_outbox(id,user_id,channel,template,recipient,payload_json,available_at,created_at) VALUES (?,?,'email','reset_password',?,?,?,?)`)
        .bind(newId("not"),user.id,email,JSON.stringify({resetUrl:`${c.env.APP_ORIGIN}/portal/#reset=${rawToken}`}),timestamp,timestamp)
    ]);
  }
  return c.json(generic,202);
});

app.post("/api/auth/reset-password", async (c) => {
  const parsed=z.object({token:z.string().min(32).max(200),password:z.string().min(12).max(128)}).safeParse(await safeJson(c));
  if(!parsed.success) return c.json({error:"Invalid or expired reset link."},400);
  const token=await c.env.DB.prepare(`SELECT id,user_id FROM auth_tokens WHERE token_hash=? AND purpose='reset_password' AND used_at IS NULL AND expires_at>?`)
    .bind(await sha256(parsed.data.token),now()).first<{id:string;user_id:string}>();
  if(!token) return c.json({error:"Invalid or expired reset link."},400);
  const timestamp=now();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE auth_tokens SET used_at=? WHERE id=?").bind(timestamp,token.id),
    c.env.DB.prepare("UPDATE users SET password_hash=?,session_version=session_version+1,updated_at=? WHERE id=?").bind(await hashPassword(parsed.data.password),timestamp,token.user_id),
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(token.user_id)
  ]);
  return c.json({message:"Password updated. Sign in again."});
});

app.post("/api/auth/bootstrap-admin", async (c) => {
  const secret=(c.env as Env & {BOOTSTRAP_SECRET?:string}).BOOTSTRAP_SECRET;
  const provided=c.req.header("X-Bootstrap-Secret")||"";
  if(!secret || !await timingSafeEqual(provided,secret)) return c.json({error:"Not found."},404);
  if(await c.env.DB.prepare("SELECT 1 FROM users WHERE role='admin'").first()) return c.json({error:"An administrator already exists."},409);
  const parsed=authSchema.extend({name:z.string().min(2).max(80)}).safeParse(await safeJson(c));
  if(!parsed.success) return c.json({error:"Invalid administrator details."},400);
  const id=newId("usr"), timestamp=now();
  await c.env.DB.prepare(`INSERT INTO users(id,email,password_hash,role,status,email_verified_at,created_at,updated_at) VALUES (?,?,?,'admin','active',?,?,?)`)
    .bind(id,parsed.data.email.toLowerCase(),await hashPassword(parsed.data.password),timestamp,timestamp,timestamp).run();
  return c.json({message:"Administrator created."},201);
});

app.put("/api/profile", async (c) => {
  const user=requireUser(c); if(user instanceof Response)return user;
  const timestamp=now();
  if(user.role==="family"){
    const parsed=z.object({firstName:z.string().trim().min(1).max(60),lastName:z.string().trim().min(1).max(80),phone:z.string().max(30).nullable().optional(),defaultArea:z.string().max(80).nullable().optional(),emergencyContactName:z.string().max(80).nullable().optional(),emergencyContactPhone:z.string().max(30).nullable().optional()}).safeParse(await safeJson(c));
    if(!parsed.success)return c.json({error:"Invalid profile fields."},400);
    await c.env.DB.prepare(`UPDATE family_profiles SET household_name=?,first_name=?,last_name=?,phone=?,default_area=?,emergency_contact_name=?,emergency_contact_phone=?,updated_at=? WHERE user_id=?`)
      .bind(`${parsed.data.firstName} ${parsed.data.lastName}`,parsed.data.firstName,parsed.data.lastName,parsed.data.phone??null,parsed.data.defaultArea??null,parsed.data.emergencyContactName??null,parsed.data.emergencyContactPhone??null,timestamp,user.id).run();
  }else if(user.role==="sitter"){
    const parsed=z.object({firstName:z.string().trim().min(1).max(60),lastName:z.string().trim().min(1).max(80),avatar:z.enum(["heron","pelican","manatee","turtle","dolphin","flamingo","crab","owl"]),phone:z.string().max(30).nullable().optional(),bio:z.string().max(1200).nullable().optional(),homeArea:z.string().max(80).nullable().optional(),serviceAreas:z.array(z.string().max(80)).max(20),ageGroups:z.array(z.string().max(40)).max(10),languages:z.array(z.string().max(40)).max(10),hasVehicle:z.boolean(),canTransportChildren:z.boolean()}).safeParse(await safeJson(c));
    if(!parsed.success)return c.json({error:"Invalid profile fields."},400);
    await c.env.DB.prepare(`UPDATE sitter_profiles SET display_name=?,first_name=?,last_name=?,avatar=?,phone=?,bio=?,home_area=?,service_areas_json=?,age_groups_json=?,languages_json=?,has_vehicle=?,can_transport_children=?,updated_at=? WHERE user_id=?`)
      .bind(`${parsed.data.firstName} ${parsed.data.lastName}`,parsed.data.firstName,parsed.data.lastName,parsed.data.avatar,parsed.data.phone??null,parsed.data.bio??null,parsed.data.homeArea??null,JSON.stringify(parsed.data.serviceAreas),JSON.stringify(parsed.data.ageGroups),JSON.stringify(parsed.data.languages),Number(parsed.data.hasVehicle),Number(parsed.data.canTransportChildren),timestamp,user.id).run();
  }else return c.json({error:"This role has no public profile."},400);
  await audit(c as AppContext,"profile.update","user",user.id);
  return c.json({message:"Profile updated."});
});

app.get("/api/children", async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  const rows=await c.env.DB.prepare("SELECT id,nickname,birth_year,care_notes,active FROM children WHERE family_user_id=? ORDER BY created_at").bind(user.id).all();
  return c.json({children:rows.results});
});

app.post("/api/children",async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  const parsed=z.object({nickname:z.string().trim().max(60).optional(),birthYear:z.number().int().min(2005).max(new Date().getUTCFullYear()),careNotes:z.string().max(1500).nullable().optional()}).safeParse(await safeJson(c));
  if(!parsed.success)return c.json({error:"Invalid child details."},400);
  const count=await c.env.DB.prepare("SELECT COUNT(*) AS count FROM children WHERE family_user_id=?").bind(user.id).first<{count:number}>();
  const nickname=parsed.data.nickname||`Child ${Number(count?.count??0)+1}`;
  const id=newId("chd"),timestamp=now();
  await c.env.DB.prepare("INSERT INTO children(id,family_user_id,nickname,birth_year,care_notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
    .bind(id,user.id,nickname,parsed.data.birthYear,parsed.data.careNotes??null,timestamp,timestamp).run();
  await audit(c as AppContext,"child.create","child",id);
  return c.json({id},201);
});

app.delete("/api/children/:id",async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  await c.env.DB.prepare("UPDATE children SET active=0,updated_at=? WHERE id=? AND family_user_id=?").bind(now(),c.req.param("id"),user.id).run();
  await audit(c as AppContext,"child.deactivate","child",c.req.param("id"));return c.json({message:"Child archived."});
});

app.put("/api/children/:id",async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  const parsed=z.object({nickname:z.string().trim().max(60).optional(),birthYear:z.number().int().min(2005).max(new Date().getUTCFullYear()),careNotes:z.string().max(1500).nullable().optional(),active:z.boolean().default(true)}).safeParse(await safeJson(c));
  if(!parsed.success)return c.json({error:"Invalid child details."},400);
  const result=await c.env.DB.prepare("UPDATE children SET nickname=COALESCE(NULLIF(?,''),nickname),birth_year=?,care_notes=?,active=?,updated_at=? WHERE id=? AND family_user_id=?").bind(parsed.data.nickname??"",parsed.data.birthYear,parsed.data.careNotes??null,Number(parsed.data.active),now(),c.req.param("id"),user.id).run();
  if(!result.meta.changes)return c.json({error:"Child not found."},404);
  await audit(c as AppContext,"child.update","child",c.req.param("id"));return c.json({message:"Child updated."});
});

app.get("/api/locations",async(c)=>{const user=requireRole(c,["family"]);if(user instanceof Response)return user;const rows=await c.env.DB.prepare("SELECT id,label,address_line,area,access_notes FROM saved_locations WHERE family_user_id=? ORDER BY label").bind(user.id).all();return c.json({locations:rows.results});});

app.post("/api/locations",async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  const parsed=locationSchema.safeParse(await safeJson(c));if(!parsed.success)return c.json({error:"Invalid location."},400);
  const id=newId("loc"),timestamp=now();await c.env.DB.prepare("INSERT INTO saved_locations(id,family_user_id,label,address_line,area,access_notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(id,user.id,parsed.data.label,parsed.data.addressLine,parsed.data.area,parsed.data.accessNotes??null,timestamp,timestamp).run();await audit(c as AppContext,"location.create","saved_location",id);return c.json({id},201);
});

app.put("/api/locations/:id",async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  const parsed=locationSchema.safeParse(await safeJson(c));if(!parsed.success)return c.json({error:"Invalid location."},400);
  const result=await c.env.DB.prepare("UPDATE saved_locations SET label=?,address_line=?,area=?,access_notes=?,updated_at=? WHERE id=? AND family_user_id=?").bind(parsed.data.label,parsed.data.addressLine,parsed.data.area,parsed.data.accessNotes??null,now(),c.req.param("id"),user.id).run();if(!result.meta.changes)return c.json({error:"Location not found."},404);await audit(c as AppContext,"location.update","saved_location",c.req.param("id"));return c.json({message:"Location updated."});
});

app.delete("/api/locations/:id",async(c)=>{const user=requireRole(c,["family"]);if(user instanceof Response)return user;const result=await c.env.DB.prepare("DELETE FROM saved_locations WHERE id=? AND family_user_id=?").bind(c.req.param("id"),user.id).run();if(!result.meta.changes)return c.json({error:"Location not found."},404);await audit(c as AppContext,"location.delete","saved_location",c.req.param("id"));return c.json({message:"Location deleted."});});

app.put("/api/availability",async(c)=>{
  const user=requireRole(c,["sitter"]);if(user instanceof Response)return user;
  const parsed=z.object({weekly:z.array(z.object({weekday:z.number().int().min(0).max(6),startMinute:z.number().int().min(0).max(1439),endMinute:z.number().int().min(1).max(1440)})).max(50),exceptions:z.array(z.object({startsAt:z.iso.datetime(),endsAt:z.iso.datetime(),available:z.boolean(),reason:z.string().max(200).optional()})).max(100)}).safeParse(await safeJson(c));
  if(!parsed.success||parsed.data.weekly.some(w=>w.startMinute>=w.endMinute)||parsed.data.exceptions.some(e=>e.startsAt>=e.endsAt))return c.json({error:"Invalid availability."},400);
  const statements:D1PreparedStatement[]=[c.env.DB.prepare("DELETE FROM weekly_availability WHERE sitter_user_id=?").bind(user.id),c.env.DB.prepare("DELETE FROM availability_exceptions WHERE sitter_user_id=?").bind(user.id)];
  for(const w of parsed.data.weekly)statements.push(c.env.DB.prepare("INSERT INTO weekly_availability(id,sitter_user_id,weekday,start_minute,end_minute) VALUES (?,?,?,?,?)").bind(newId("avl"),user.id,w.weekday,w.startMinute,w.endMinute));
  for(const e of parsed.data.exceptions)statements.push(c.env.DB.prepare("INSERT INTO availability_exceptions(id,sitter_user_id,starts_at,ends_at,available,reason,created_at) VALUES (?,?,?,?,?,?,?)").bind(newId("avx"),user.id,e.startsAt,e.endsAt,Number(e.available),e.reason??null,now()));
  await c.env.DB.batch(statements);await audit(c as AppContext,"availability.replace","sitter",user.id,{weekly:parsed.data.weekly.length,exceptions:parsed.data.exceptions.length});
  return c.json({message:"Availability updated."});
});

app.get("/api/availability",async(c)=>{
  const user=requireRole(c,["sitter"]);if(user instanceof Response)return user;
  const [weekly,exceptions]=await c.env.DB.batch([c.env.DB.prepare("SELECT id,weekday,start_minute,end_minute FROM weekly_availability WHERE sitter_user_id=? ORDER BY weekday,start_minute").bind(user.id),c.env.DB.prepare("SELECT id,starts_at,ends_at,available,reason FROM availability_exceptions WHERE sitter_user_id=? AND ends_at>? ORDER BY starts_at").bind(user.id,now())]);
  if(!weekly||!exceptions)throw new Error("AVAILABILITY_QUERY_FAILED");
  return c.json({weekly:weekly.results,exceptions:exceptions.results});
});

const bookingSchema=z.object({area:z.string().trim().min(2).max(80),startsAt:z.iso.datetime(),endsAt:z.iso.datetime(),timezone:z.string().max(80).default("America/New_York"),transportRequired:z.boolean().default(false),notes:z.string().max(2000).nullable().optional(),childIds:z.array(z.string()).min(1).max(10)});

app.post("/api/bookings",async(c)=>{
  const user=requireRole(c,["family"]);if(user instanceof Response)return user;
  const parsed=bookingSchema.safeParse(await safeJson(c));
  if(!parsed.success||parsed.data.startsAt>=parsed.data.endsAt||Date.parse(parsed.data.startsAt)<Date.now()-300000)return c.json({error:"Invalid booking details."},400);
  const owned=await c.env.DB.prepare(`SELECT COUNT(*) AS count FROM children WHERE family_user_id=? AND active=1 AND id IN (${parsed.data.childIds.map(()=>"?").join(",")})`).bind(user.id,...parsed.data.childIds).first<{count:number}>();
  if(Number(owned?.count)!==new Set(parsed.data.childIds).size)return c.json({error:"One or more child records are invalid."},400);
  const id=newId("bkg"),code=await nextCode(c.env.DB,"booking"),timestamp=now();
  const statements:D1PreparedStatement[]=[c.env.DB.prepare(`INSERT INTO bookings(id,public_code,family_user_id,area,starts_at,ends_at,timezone,status,transport_required,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?)`)
    .bind(id,code,user.id,parsed.data.area,parsed.data.startsAt,parsed.data.endsAt,parsed.data.timezone,Number(parsed.data.transportRequired),parsed.data.notes??null,timestamp,timestamp),
    c.env.DB.prepare("INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_user_id,created_at) VALUES (?,?,NULL,'draft',?,?)").bind(newId("bsh"),id,user.id,timestamp)];
  for(const childId of new Set(parsed.data.childIds))statements.push(c.env.DB.prepare("INSERT INTO booking_children(booking_id,child_id) VALUES (?,?)").bind(id,childId));
  await c.env.DB.batch(statements);await audit(c as AppContext,"booking.create","booking",id,{code});
  return c.json({id,code,status:"draft"},201);
});

app.get("/api/bookings",async(c)=>{
  const user=requireUser(c);if(user instanceof Response)return user;
  const where=user.role==="family"?"family_user_id=?":user.role==="sitter"?"(assigned_sitter_user_id=? OR id IN (SELECT booking_id FROM booking_proposals WHERE sitter_user_id=?))":"1=1";
  const proposal=user.role==="sitter"?",(SELECT id FROM booking_proposals p WHERE p.booking_id=bookings.id AND p.sitter_user_id=? AND p.status='offered' LIMIT 1) AS proposal_id":"";
  const params=user.role==="family"?[user.id]:user.role==="sitter"?[user.id,user.id,user.id]:[];
  const rows=await c.env.DB.prepare(`SELECT id,public_code,area,starts_at,ends_at,timezone,status,transport_required,assigned_sitter_user_id,created_at${proposal} FROM bookings WHERE ${where} ORDER BY starts_at DESC LIMIT 200`).bind(...params).all();
  return c.json({bookings:rows.results});
});

app.post("/api/bookings/:id/transition",async(c)=>{
  const user=requireUser(c);if(user instanceof Response)return user;
  const parsed=z.object({to:z.enum(["requested","matching","offered","confirmed","in_progress","completed","cancelled","expired"]),reason:z.string().max(500).optional()}).safeParse(await safeJson(c));
  if(!parsed.success)return c.json({error:"Invalid transition."},400);
  const booking=await c.env.DB.prepare("SELECT id,family_user_id,assigned_sitter_user_id,status FROM bookings WHERE id=?").bind(c.req.param("id")).first<{id:string;family_user_id:string;assigned_sitter_user_id:string|null;status:BookingStatus}>();
  if(!booking)return c.json({error:"Booking not found."},404);
  const owns=user.role==="family"&&booking.family_user_id===user.id;const assigned=user.role==="sitter"&&booking.assigned_sitter_user_id===user.id;const staff=hasRole(user.role,["operations","admin"]);
  if(!staff&&!owns&&!assigned)return c.json({error:"Forbidden."},403);
  if(owns&&!(["requested","cancelled"] as string[]).includes(parsed.data.to))return c.json({error:"Forbidden transition."},403);
  if(assigned&&!(["in_progress","completed"] as string[]).includes(parsed.data.to))return c.json({error:"Forbidden transition."},403);
  if(!canTransitionBooking(booking.status,parsed.data.to))return c.json({error:`Cannot move from ${booking.status} to ${parsed.data.to}.`},409);
  const timestamp=now();
  await c.env.DB.batch([c.env.DB.prepare("UPDATE bookings SET status=?,cancellation_reason=CASE WHEN ?='cancelled' THEN ? ELSE cancellation_reason END,updated_at=? WHERE id=? AND status=?").bind(parsed.data.to,parsed.data.to,parsed.data.reason??null,timestamp,booking.id,booking.status),c.env.DB.prepare("INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_user_id,reason,created_at) VALUES (?,?,?,?,?,?,?)").bind(newId("bsh"),booking.id,booking.status,parsed.data.to,user.id,parsed.data.reason??null,timestamp)]);
  await audit(c as AppContext,"booking.transition","booking",booking.id,{from:booking.status,to:parsed.data.to});return c.json({status:parsed.data.to});
});

app.post("/api/admin/bookings/:id/match",async(c)=>{
  const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;
  const booking=await c.env.DB.prepare("SELECT id,family_user_id,area,starts_at,ends_at,timezone,transport_required,status FROM bookings WHERE id=?").bind(c.req.param("id")).first<{id:string;family_user_id:string;area:string;starts_at:string;ends_at:string;timezone:string;transport_required:number;status:BookingStatus}>();
  if(!booking)return c.json({error:"Booking not found."},404);
  if(!["requested","matching","offered"].includes(booking.status))return c.json({error:"Booking is not matchable."},409);
  const matches=await findMatches(c.env.DB,{bookingId:booking.id,familyUserId:booking.family_user_id,area:booking.area,startsAt:booking.starts_at,endsAt:booking.ends_at,transportRequired:Boolean(booking.transport_required),timeZone:booking.timezone});
  const timestamp=now();const statements:D1PreparedStatement[]=[c.env.DB.prepare("DELETE FROM booking_proposals WHERE booking_id=? AND status IN ('queued','offered')").bind(booking.id)];
  matches.slice(0,20).forEach((match,index)=>statements.push(c.env.DB.prepare(`INSERT INTO booking_proposals(id,booking_id,sitter_user_id,rank,score,reasons_json,status,offered_at,expires_at,created_at) VALUES (?,?,?,?,?,? ,?,?,?,?)
    ON CONFLICT(booking_id,sitter_user_id) DO UPDATE SET rank=excluded.rank,score=excluded.score,reasons_json=excluded.reasons_json,status=excluded.status,offered_at=excluded.offered_at,expires_at=excluded.expires_at,responded_at=NULL`).bind(newId("prp"),booking.id,match.userId,index+1,match.score,JSON.stringify(match.reasons),index===0?"offered":"queued",index===0?timestamp:null,index===0?new Date(Date.now()+12*3600_000).toISOString():null,timestamp)));
  const target=matches.length?"offered":"matching";
  statements.push(c.env.DB.prepare("UPDATE bookings SET status=?,updated_at=? WHERE id=?").bind(target,timestamp,booking.id));
  await c.env.DB.batch(statements);await audit(c as AppContext,"booking.match","booking",booking.id,{candidates:matches.length});
  return c.json({matches:matches.map((m,i)=>({rank:i+1,sitterUserId:m.userId,displayName:m.displayName,score:m.score,reasons:m.reasons})),status:target});
});

app.post("/api/proposals/:id/respond",async(c)=>{
  const user=requireRole(c,["sitter"]);if(user instanceof Response)return user;
  const parsed=z.object({response:z.enum(["accepted","declined"])}).safeParse(await safeJson(c));if(!parsed.success)return c.json({error:"Invalid response."},400);
  const proposal=await c.env.DB.prepare(`SELECT p.id,p.booking_id,p.status,p.expires_at,b.status AS booking_status FROM booking_proposals p JOIN bookings b ON b.id=p.booking_id WHERE p.id=? AND p.sitter_user_id=?`).bind(c.req.param("id"),user.id).first<{id:string;booking_id:string;status:string;expires_at:string|null;booking_status:BookingStatus}>();
  if(!proposal||proposal.status!=="offered")return c.json({error:"Proposal is no longer available."},409);
  const timestamp=now();
  if(!proposal.expires_at||proposal.expires_at<=timestamp){
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE booking_proposals SET status='expired',responded_at=? WHERE id=? AND status='offered'").bind(timestamp,proposal.id),
      c.env.DB.prepare("UPDATE bookings SET status='matching',updated_at=? WHERE id=? AND status='offered'").bind(timestamp,proposal.booking_id)
    ]);
    return c.json({error:"This proposal has expired."},409);
  }
  if(parsed.data.response==="declined"){
    await c.env.DB.prepare("UPDATE booking_proposals SET status='declined',responded_at=? WHERE id=? AND status='offered'").bind(timestamp,proposal.id).run();
    await c.env.DB.prepare("UPDATE bookings SET status='matching',updated_at=? WHERE id=? AND status='offered'").bind(timestamp,proposal.booking_id).run();
  }else{
    await c.env.DB.batch([c.env.DB.prepare("UPDATE booking_proposals SET status='accepted',responded_at=? WHERE id=? AND status='offered'").bind(timestamp,proposal.id),c.env.DB.prepare("UPDATE booking_proposals SET status='withdrawn',responded_at=? WHERE booking_id=? AND id<>? AND status IN ('queued','offered')").bind(timestamp,proposal.booking_id,proposal.id),c.env.DB.prepare("UPDATE bookings SET assigned_sitter_user_id=?,status='confirmed',updated_at=? WHERE id=? AND status='offered'").bind(user.id,timestamp,proposal.booking_id),c.env.DB.prepare("INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_user_id,created_at) VALUES (?,?,?,'confirmed',?,?)").bind(newId("bsh"),proposal.booking_id,proposal.booking_status,user.id,timestamp)]);
  }
  await audit(c as AppContext,`proposal.${parsed.data.response}`,"booking_proposal",proposal.id);return c.json({status:parsed.data.response});
});

app.get("/api/admin/dashboard",async(c)=>{
  const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;
  const [users,bookings,incidents,sitters]=await c.env.DB.batch([c.env.DB.prepare("SELECT role,status,COUNT(*) AS count FROM users GROUP BY role,status"),c.env.DB.prepare("SELECT status,COUNT(*) AS count FROM bookings GROUP BY status"),c.env.DB.prepare("SELECT severity,status,COUNT(*) AS count FROM incidents GROUP BY severity,status"),c.env.DB.prepare("SELECT screening_status,COUNT(*) AS count FROM sitter_profiles GROUP BY screening_status")]);
  if(!users||!bookings||!incidents||!sitters)throw new Error("DASHBOARD_QUERY_FAILED");
  return c.json({users:users.results,bookings:bookings.results,incidents:incidents.results,sitters:sitters.results});
});

app.get("/api/admin/calendar",async(c)=>{
  const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;
  const from=c.req.query("from")||new Date().toISOString().slice(0,10);const to=c.req.query("to")||new Date(Date.now()+31*86400_000).toISOString().slice(0,10);
  const rows=await c.env.DB.prepare(`SELECT b.id,b.public_code,b.area,b.starts_at,b.ends_at,b.status,b.assigned_sitter_user_id,s.display_name AS sitter_name,f.household_name FROM bookings b LEFT JOIN sitter_profiles s ON s.user_id=b.assigned_sitter_user_id JOIN family_profiles f ON f.user_id=b.family_user_id WHERE b.starts_at>=? AND b.starts_at<? ORDER BY b.starts_at`).bind(from,to).all();
  return c.json({events:rows.results});
});

app.get("/api/admin/sitters",async(c)=>{
  const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;
  const rows=await c.env.DB.prepare(`SELECT s.user_id,s.public_code,s.avatar,s.display_name,s.home_area,s.screening_status,s.updated_at,u.email,u.status FROM sitter_profiles s JOIN users u ON u.id=s.user_id ORDER BY s.updated_at DESC`).all();return c.json({sitters:rows.results});
});

app.put("/api/admin/sitters/:id/verification/:kind",async(c)=>{
  const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;
  const kind=z.enum(["identity","references","background","first_aid","interview","orientation"]).safeParse(c.req.param("kind"));
  const parsed=z.object({status:z.enum(["pending","verified","rejected","expired"]),expiresAt:z.iso.datetime().nullable().optional(),note:z.string().max(500).nullable().optional()}).safeParse(await safeJson(c));
  if(!kind.success||!parsed.success)return c.json({error:"Invalid verification item."},400);
  const id=newId("ver"),timestamp=now();await c.env.DB.prepare(`INSERT INTO verification_items(id,sitter_user_id,kind,status,expires_at,note,reviewed_by,reviewed_at,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(sitter_user_id,kind) DO UPDATE SET status=excluded.status,expires_at=excluded.expires_at,note=excluded.note,reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at`).bind(id,c.req.param("id"),kind.data,parsed.data.status,parsed.data.expiresAt??null,parsed.data.note??null,user.id,timestamp,timestamp).run();
  await audit(c as AppContext,"sitter.verification","sitter",c.req.param("id"),{kind:kind.data,status:parsed.data.status});return c.json({message:"Verification item updated."});
});

app.post("/api/admin/sitters/:id/status",async(c)=>{
  const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;
  const parsed=z.object({to:z.enum(["draft","submitted","under_review","approved","rejected","suspended"]),reason:z.string().trim().min(3).max(500)}).safeParse(await safeJson(c));if(!parsed.success)return c.json({error:"A valid status and reason are required."},400);
  const profile=await c.env.DB.prepare("SELECT screening_status FROM sitter_profiles WHERE user_id=?").bind(c.req.param("id")).first<{screening_status:SitterStatus}>();if(!profile)return c.json({error:"Sitter not found."},404);
  if(!canTransitionSitter(profile.screening_status,parsed.data.to))return c.json({error:`Cannot move from ${profile.screening_status} to ${parsed.data.to}.`},409);
  await c.env.DB.prepare("UPDATE sitter_profiles SET screening_status=?,updated_at=? WHERE user_id=?").bind(parsed.data.to,now(),c.req.param("id")).run();
  await c.env.DB.prepare("INSERT INTO sitter_notes(id,sitter_user_id,author_user_id,note,created_at) VALUES (?,?,?,?,?)").bind(newId("snt"),c.req.param("id"),user.id,`Status ${profile.screening_status} → ${parsed.data.to}: ${parsed.data.reason}`,now()).run();
  await audit(c as AppContext,"sitter.status","sitter",c.req.param("id"),{from:profile.screening_status,to:parsed.data.to});return c.json({status:parsed.data.to});
});

app.post("/api/admin/users/:id/suspend",async(c)=>{
  const user=requireRole(c,["admin"]);if(user instanceof Response)return user;
  if(c.req.param("id")===user.id)return c.json({error:"You cannot suspend your own account."},409);
  await c.env.DB.batch([c.env.DB.prepare("UPDATE users SET status='suspended',session_version=session_version+1,updated_at=? WHERE id=? AND role<>'admin'").bind(now(),c.req.param("id")),c.env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(c.req.param("id"))]);
  await audit(c as AppContext,"user.suspend","user",c.req.param("id"));return c.json({message:"Account suspended and sessions revoked."});
});

app.post("/api/admin/users/:id/reactivate",async(c)=>{const user=requireRole(c,["admin"]);if(user instanceof Response)return user;const result=await c.env.DB.prepare("UPDATE users SET status='active',session_version=session_version+1,updated_at=? WHERE id=? AND status='suspended'").bind(now(),c.req.param("id")).run();if(!result.meta.changes)return c.json({error:"Suspended account not found."},404);await audit(c as AppContext,"user.reactivate","user",c.req.param("id"));return c.json({message:"Account reactivated."});});

app.get("/api/admin/audit",async(c)=>{const user=requireRole(c,["admin"]);if(user instanceof Response)return user;const entityType=c.req.query("entityType"),entityId=c.req.query("entityId");let sql="SELECT id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at FROM audit_logs",params:string[]=[];if(entityType){sql+=" WHERE entity_type=?";params.push(entityType);if(entityId){sql+=" AND entity_id=?";params.push(entityId)}}sql+=" ORDER BY created_at DESC LIMIT 500";const rows=await c.env.DB.prepare(sql).bind(...params).all();return c.json({audit:rows.results});});

app.get("/api/admin/inquiries",async(c)=>{const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;const rows=await c.env.DB.prepare("SELECT id,kind,name,email,message,status,created_at FROM public_inquiries ORDER BY created_at DESC LIMIT 200").all();return c.json({inquiries:rows.results});});

app.post("/api/incidents",async(c)=>{
  const user=requireUser(c);if(user instanceof Response)return user;
  const parsed=z.object({bookingId:z.string().nullable().optional(),severity:z.enum(["low","medium","high","critical"]),summary:z.string().trim().min(5).max(200),details:z.string().trim().min(10).max(5000)}).safeParse(await safeJson(c));if(!parsed.success)return c.json({error:"Invalid incident details."},400);
  const id=newId("inc"),code=await nextCode(c.env.DB,"incident"),timestamp=now();await c.env.DB.prepare("INSERT INTO incidents(id,public_code,booking_id,reporter_user_id,severity,summary,details,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,code,parsed.data.bookingId??null,user.id,parsed.data.severity,parsed.data.summary,parsed.data.details,timestamp,timestamp).run();
  await audit(c as AppContext,"incident.create","incident",id,{severity:parsed.data.severity});return c.json({id,code,status:"open"},201);
});

app.get("/api/admin/incidents",async(c)=>{const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;const rows=await c.env.DB.prepare("SELECT id,public_code,booking_id,severity,status,summary,assigned_to,created_at,updated_at FROM incidents ORDER BY created_at DESC LIMIT 200").all();return c.json({incidents:rows.results});});

app.put("/api/admin/incidents/:id",async(c)=>{const user=requireRole(c,["operations","admin"]);if(user instanceof Response)return user;const parsed=z.object({status:z.enum(["open","investigating","resolved","closed"]),assignedTo:z.string().nullable().optional()}).safeParse(await safeJson(c));if(!parsed.success)return c.json({error:"Invalid incident status."},400);const timestamp=now();const assignedToProvided=parsed.data.assignedTo!==undefined;const result=await c.env.DB.prepare("UPDATE incidents SET status=?,assigned_to=CASE WHEN ? THEN ? ELSE assigned_to END,resolved_at=CASE WHEN ? IN ('resolved','closed') THEN ? ELSE NULL END,updated_at=? WHERE id=?").bind(parsed.data.status,assignedToProvided?1:0,parsed.data.assignedTo??null,parsed.data.status,timestamp,timestamp,c.req.param("id")).run();if(!result.meta.changes)return c.json({error:"Incident not found."},404);await audit(c as AppContext,"incident.status","incident",c.req.param("id"),{status:parsed.data.status});return c.json({status:parsed.data.status});});

app.post("/api/account/deletion-request",async(c)=>{
  const user=requireUser(c);if(user instanceof Response)return user;
  const parsed=authSchema.pick({password:true}).safeParse(await safeJson(c));
  if(!parsed.success)return c.json({error:"Password confirmation is required."},400);
  if(!await rateLimit(c as AppContext,"account-deletion",user.id,5,3600))return c.json({error:"Too many attempts. Try again later."},429);
  const credentials=await c.env.DB.prepare("SELECT password_hash FROM users WHERE id=? AND status='active'").bind(user.id).first<{password_hash:string}>();
  if(!credentials||!await verifyPassword(parsed.data.password,credentials.password_hash))return c.json({error:"Password confirmation failed."},403);
  const existing=await c.env.DB.prepare("SELECT id FROM account_deletion_requests WHERE user_id=? AND status IN ('requested','approved')").bind(user.id).first();
  if(existing)return c.json({message:"A deletion request is already pending."});
  const id=newId("del");
  await c.env.DB.prepare("INSERT INTO account_deletion_requests(id,user_id,requested_at) VALUES (?,?,?)").bind(id,user.id,now()).run();
  await audit(c as AppContext,"account.deletion_request","user",user.id);
  return c.json({id,message:"Deletion request submitted."},201);
});

app.post("/api/admin/deletions/:id/complete",async(c)=>{
  const admin=requireRole(c,["admin"]);if(admin instanceof Response)return admin;
  const request=await c.env.DB.prepare("SELECT id,user_id,status FROM account_deletion_requests WHERE id=?").bind(c.req.param("id")).first<{id:string;user_id:string;status:string}>();if(!request||!["requested","approved"].includes(request.status))return c.json({error:"Deletion request not found."},404);
  const timestamp=now(),anonEmail=`deleted+${request.user_id}@invalid.suncoast.local`;
  await c.env.DB.batch([c.env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(request.user_id),c.env.DB.prepare("DELETE FROM auth_tokens WHERE user_id=?").bind(request.user_id),c.env.DB.prepare("DELETE FROM children WHERE family_user_id=?").bind(request.user_id),c.env.DB.prepare("DELETE FROM saved_locations WHERE family_user_id=?").bind(request.user_id),c.env.DB.prepare("DELETE FROM family_profiles WHERE user_id=?").bind(request.user_id),c.env.DB.prepare("DELETE FROM sitter_profiles WHERE user_id=?").bind(request.user_id),c.env.DB.prepare("UPDATE bookings SET notes=NULL,cancellation_reason=NULL WHERE family_user_id=? OR assigned_sitter_user_id=?").bind(request.user_id,request.user_id),c.env.DB.prepare("UPDATE users SET email=?,password_hash='deleted',status='deleted',session_version=session_version+1,deleted_at=?,updated_at=? WHERE id=?").bind(anonEmail,timestamp,timestamp,request.user_id),c.env.DB.prepare("UPDATE account_deletion_requests SET status='completed',reviewed_by=?,reviewed_at=?,completed_at=? WHERE id=?").bind(admin.id,timestamp,timestamp,request.id)]);
  await audit(c as AppContext,"account.anonymize","user",request.user_id);return c.json({message:"Account data anonymized."});
});

app.all("/api/*",(c)=>c.json({error:"Not found."},404));
app.all("*",(c)=>c.env.ASSETS.fetch(c.req.raw));

function requireUser(c: HonoContext): SessionUser | Response {
  return c.get("user") || c.json({error:"Authentication required."},401);
}

function requireRole(c:HonoContext,roles:readonly Role[]):SessionUser|Response{
  const user=c.get("user");if(!user)return c.json({error:"Authentication required."},401);return hasRole(user.role,roles)?user:c.json({error:"Forbidden."},403);
}

type HonoContext=Context<App>;

async function safeJson(c:HonoContext):Promise<unknown>{
  try{return await c.req.json();}catch{return null;}
}

const locationSchema=z.object({label:z.string().trim().min(1).max(60),addressLine:z.string().trim().min(5).max(250),area:z.string().trim().min(2).max(80),accessNotes:z.string().max(1000).nullable().optional()});

export default app;
