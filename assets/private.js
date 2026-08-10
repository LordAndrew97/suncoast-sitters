(() => {
  "use strict";
  const mode = document.body.dataset.app;
  let me = null;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const cookie = (name) => document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (!(["GET", "HEAD"].includes(options.method || "GET"))) headers["X-CSRF-Token"] = decodeURIComponent(cookie("ss_csrf"));
    const response = await fetch(path, { credentials: "same-origin", ...options, headers });
    let body = {};
    try { body = await response.json(); } catch { body = { error: "Unexpected server response." }; }
    if (!response.ok) throw new Error(body.error || "Request failed.");
    return body;
  }

  function message(target, text, error = false) {
    const host = typeof target === "string" ? $(target) : target;
    if (!host) return;
    host.textContent = text || "";
    host.className = text ? `notice${error ? " error" : ""}` : "";
  }

  function showAuthenticated(value) {
    $("#authView")?.classList.toggle("hidden", value);
    $("#appView")?.classList.toggle("hidden", !value);
    $("#logoutBtn")?.classList.toggle("hidden", !value);
  }

  async function initialize() {
    wireAuth();
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.has("verify")) {
      try { await api("/api/auth/verify", { method: "POST", body: JSON.stringify({ token: hash.get("verify") }) }); message("#authMessage", "Email verified. You can now sign in."); history.replaceState(null, "", location.pathname); }
      catch (error) { message("#authMessage", error.message, true); }
    }
    if (hash.has("reset")) await handleReset(hash.get("reset"));
    try {
      me = await api("/api/auth/me");
      if (mode === "admin" && !["operations", "admin"].includes(me.user.role)) throw new Error("Staff access required.");
      if (mode === "portal" && ["operations", "admin"].includes(me.user.role)) { location.href = "/admin/"; return; }
      startApp();
    } catch { showAuthenticated(false); }
  }

  function wireAuth() {
    $$("[data-auth-tab]").forEach((button) => button.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach((item) => item.classList.toggle("active", item === button));
      $("#loginForm")?.classList.toggle("hidden", button.dataset.authTab !== "login");
      $("#registerForm")?.classList.toggle("hidden", button.dataset.authTab !== "register");
      if ($("#authTitle")) $("#authTitle").textContent = button.dataset.authTab === "login" ? "Welcome back" : "Join Suncoast Sitters";
    }));
    $("#regRole")?.addEventListener("change", (event) => {
      const sitter = event.target.value === "sitter";
      $("#avatarField")?.classList.toggle("hidden", !sitter);
      $("#sitterDisclaimer")?.classList.toggle("hidden", !sitter);
    });
    $("#loginForm")?.addEventListener("submit", async (event) => {
      event.preventDefault(); message("#authMessage", "");
      try {
        const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: $("#loginEmail").value, password: $("#loginPassword").value }) });
        if (mode === "admin" && !["operations", "admin"].includes(result.user.role)) { await api("/api/auth/logout", { method: "POST" }); throw new Error("Staff access required."); }
        location.reload();
      } catch (error) { message("#authMessage", error.message, true); }
    });
    $("#registerForm")?.addEventListener("submit", async (event) => {
      event.preventDefault(); message("#authMessage", "");
      try {
        const result = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ role: $("#regRole").value, firstName: $("#regFirstName").value, lastName: $("#regLastName").value, phone: $("#regPhone").value, email: $("#regEmail").value, password: $("#regPassword").value, avatar: $("#regAvatar").value }) });
        message("#authMessage", result.message); event.target.reset();
        $("#avatarField")?.classList.add("hidden");
        $("#sitterDisclaimer")?.classList.add("hidden");
      } catch (error) { message("#authMessage", error.message, true); }
    });
    $("#forgotBtn")?.addEventListener("click", async () => {
      const email = window.prompt("Enter your account email:", $("#loginEmail")?.value || "");
      if (!email) return;
      try { const result = await api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); message("#authMessage", result.message); }
      catch (error) { message("#authMessage", error.message, true); }
    });
    $("#logoutBtn")?.addEventListener("click", async () => { try { await api("/api/auth/logout", { method: "POST" }); } finally { location.reload(); } });
  }

  async function handleReset(token) {
    const password = window.prompt("Choose a new passphrase (at least 12 characters):");
    if (!password) return;
    try { const result = await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }); message("#authMessage", result.message); history.replaceState(null, "", location.pathname); }
    catch (error) { message("#authMessage", error.message, true); }
  }

  function startApp() {
    showAuthenticated(true); $("#userEmail").textContent = me.user.email;
    if (mode === "admin") startAdmin(); else startPortal();
  }

  function buildNav(items) {
    const side = $("#sideNav"), mobile = $("#mobileNav");
    items.forEach(([id, label]) => {
      [side, mobile].forEach((host) => { const button = el("button", label); button.dataset.target = id; if (id === items[0][0]) button.classList.add("active"); button.addEventListener("click", () => activateScreen(id)); host.append(button); });
    });
  }

  function activateScreen(id) {
    $$(".screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === id));
    $$(`[data-target]`).forEach((button) => button.classList.toggle("active", button.dataset.target === id));
    if (mode === "admin") loadAdminScreen(id);
  }

  function startPortal() {
    const family = me.user.role === "family";
    buildNav(family ? [["overview","Overview"],["profile","Profile"],["children","Children"],["bookings","Bookings"],["privacy","Privacy"]] : [["overview","Overview"],["profile","Profile"],["availability","Availability"],["bookings","Bookings"],["privacy","Privacy"]]);
    $("#welcomeTitle").textContent = `Welcome, ${family ? me.profile?.household_name || "family" : me.profile?.display_name || "sitter"}`;
    renderOverview(family); renderProfile(family); wirePortalForms(family);
    if (family) loadChildren(); loadBookings(family);
  }

  function renderOverview(family) {
    const cards = $("#overviewCards"); cards.replaceChildren();
    const content = family
      ? [["Create a care request","Add dates, children and essential details, then submit it for matching."],["Track every step","Draft, requested, matching, offered and confirmed statuses stay visible."],["Privacy by design","Only necessary care information is collected; no sitter photos or sensitive uploads."]]
      : [["Complete your profile",`Screening status: ${me.profile?.screening_status || "draft"}.`],["Set availability","Matching only considers approved sitters available for the complete interval."],["Respond to offers","Accepted bookings are protected against overlapping assignments."]];
    content.forEach(([title, text]) => { const card=el("article",undefined,"card third");card.append(el("h2",title),el("p",text,"muted"));cards.append(card); });
  }

  function inputField(label, name, value = "", type = "text") {
    const wrap=el("div",undefined,"field"), lab=el("label",label); const input=el("input");input.name=name;input.type=type;input.value=value??"";lab.htmlFor=`profile-${name}`;input.id=lab.htmlFor;wrap.append(lab,input);return wrap;
  }

  function renderProfile(family) {
    const form=$("#profileForm");form.replaceChildren(); const p=me.profile||{};
    if(family){form.append(inputField("First name","firstName",p.first_name||""),inputField("Last name","lastName",p.last_name||""),inputField("Phone","phone",p.phone,"tel"),inputField("Default area","defaultArea",p.default_area),inputField("Emergency contact","emergencyContactName",p.emergency_contact_name),inputField("Emergency contact phone","emergencyContactPhone",p.emergency_contact_phone,"tel"));}
    else{
      form.append(inputField("First name","firstName",p.first_name||p.display_name||""),inputField("Last name","lastName",p.last_name||""),inputField("Phone","phone",p.phone,"tel"),inputField("Home area","homeArea",p.home_area));
      const avatarWrap=el("div",undefined,"field"),label=el("label","Wildlife avatar"),select=el("select");select.name="avatar";["heron","pelican","manatee","turtle","dolphin","flamingo","crab","owl"].forEach(v=>{const o=el("option",v);o.value=v;o.selected=v===(p.avatar||"heron");select.append(o)});avatarWrap.append(label,select);form.append(avatarWrap);
      [["Service areas (comma separated)","serviceAreas",safeArray(p.service_areas_json).join(", ")],["Age groups (comma separated)","ageGroups",safeArray(p.age_groups_json).join(", ")],["Languages (comma separated)","languages",safeArray(p.languages_json).join(", ")]].forEach(([l,n,v])=>form.append(inputField(l,n,v)));
      const bioWrap=el("div",undefined,"field full"),bioLabel=el("label","Short bio"),bio=el("textarea");bio.name="bio";bio.value=p.bio||"";bioWrap.append(bioLabel,bio);form.append(bioWrap);
      [["hasVehicle","I have a vehicle",p.has_vehicle],["canTransportChildren","I can transport children",p.can_transport_children]].forEach(([name,labelText,checked])=>{const row=el("label",undefined,"check-row");const check=el("input");check.type="checkbox";check.name=name;check.checked=Boolean(checked);row.append(check,document.createTextNode(labelText));form.append(row)});
    }
    const save=el("button","Save profile","btn");save.type="submit";form.append(save);
  }

  function wirePortalForms(family) {
    $("#profileForm").addEventListener("submit",async(event)=>{event.preventDefault();const data=new FormData(event.target);const body=family?{firstName:data.get("firstName"),lastName:data.get("lastName"),phone:empty(data.get("phone")),defaultArea:empty(data.get("defaultArea")),emergencyContactName:empty(data.get("emergencyContactName")),emergencyContactPhone:empty(data.get("emergencyContactPhone"))}:{firstName:data.get("firstName"),lastName:data.get("lastName"),avatar:data.get("avatar"),phone:empty(data.get("phone")),bio:empty(data.get("bio")),homeArea:empty(data.get("homeArea")),serviceAreas:csv(data.get("serviceAreas")),ageGroups:csv(data.get("ageGroups")),languages:csv(data.get("languages")),hasVehicle:data.has("hasVehicle"),canTransportChildren:data.has("canTransportChildren")};try{const result=await api("/api/profile",{method:"PUT",body:JSON.stringify(body)});message("#profileMessage",result.message)}catch(error){message("#profileMessage",error.message,true)}});
    $("#childForm")?.addEventListener("submit",async(event)=>{event.preventDefault();try{await api("/api/children",{method:"POST",body:JSON.stringify({nickname:$("#childName").value,birthYear:Number($("#childYear").value),careNotes:empty($("#childNotes").value)})});event.target.reset();loadChildren()}catch(error){window.alert(error.message)}});
    $("#availabilityForm")?.addEventListener("submit",async(event)=>{event.preventDefault();const start=minutes($("#startTime").value),end=minutes($("#endTime").value),days=[...$("#availableDays").selectedOptions].map(o=>Number(o.value));try{const result=await api("/api/availability",{method:"PUT",body:JSON.stringify({weekly:days.map(weekday=>({weekday,startMinute:start,endMinute:end})),exceptions:[]})});message("#availabilityMessage",result.message)}catch(error){message("#availabilityMessage",error.message,true)}});
    $("#bookingForm")?.addEventListener("submit",async(event)=>{event.preventDefault();const childIds=[...$("#bookingChildren").selectedOptions].map(o=>o.value);try{const result=await api("/api/bookings",{method:"POST",body:JSON.stringify({area:$("#bookingArea").value,startsAt:floridaWallTimeToUtc($("#bookingStart").value),endsAt:floridaWallTimeToUtc($("#bookingEnd").value),timezone:"America/New_York",transportRequired:$("#bookingTransport").checked,notes:empty($("#bookingNotes").value),childIds})});window.alert(`Draft ${result.code} created.`);event.target.reset();loadBookings(family)}catch(error){window.alert(error.message)}});
    $("#deletionBtn").addEventListener("click",async()=>{if(!confirm("Submit an account deletion request for staff review?"))return;const password=prompt("Confirm your current password:");if(!password)return;try{const result=await api("/api/account/deletion-request",{method:"POST",body:JSON.stringify({password})});message("#deletionMessage",result.message)}catch(error){message("#deletionMessage",error.message,true)}});
  }

  async function loadChildren() {
    try{const result=await api("/api/children"),list=$("#childrenList"),select=$("#bookingChildren");list.replaceChildren();select.replaceChildren();if(!result.children.length)list.append(el("div","No children added yet.","empty"));result.children.filter(c=>c.active).forEach(child=>{const row=el("div",undefined,"card");row.append(el("strong",child.nickname),el("p",`Born ${child.birth_year}${child.care_notes?` · ${child.care_notes}`:""}`,"muted"));const archive=el("button","Archive","btn danger");archive.addEventListener("click",async()=>{await api(`/api/children/${encodeURIComponent(child.id)}`,{method:"DELETE"});loadChildren()});row.append(archive);list.append(row);const option=el("option",`${child.nickname} (${child.birth_year})`);option.value=child.id;select.append(option)});}catch(error){message("#childrenList",error.message,true)}
  }

  async function loadBookings(family) {
    try{const result=await api("/api/bookings"),host=$("#bookingsList");host.replaceChildren();if(!result.bookings.length){host.append(el("div","No bookings yet.","empty"));return;}result.bookings.forEach(booking=>{const row=el("article",undefined,"card");row.append(el("h3",`${booking.public_code} · ${booking.area}`),el("p",`${formatDate(booking.starts_at)} – ${formatDate(booking.ends_at)}`,"muted"),el("span",booking.status.replaceAll("_"," "),"status"));const actions=el("div",undefined,"actions");if(family&&booking.status==="draft"){const submit=el("button","Submit request","btn");submit.addEventListener("click",()=>transitionBooking(booking.id,"requested",family));actions.append(submit)}if(family&&!(["completed","cancelled","expired"].includes(booking.status))){const cancel=el("button","Cancel","btn danger");cancel.addEventListener("click",()=>transitionBooking(booking.id,"cancelled",family));actions.append(cancel)}if(!family&&booking.proposal_id){const accept=el("button","Accept offer","btn"),decline=el("button","Decline","btn danger");accept.addEventListener("click",()=>respondProposal(booking.proposal_id,"accepted",family));decline.addEventListener("click",()=>respondProposal(booking.proposal_id,"declined",family));actions.append(accept,decline)}row.append(actions);host.append(row)});}catch(error){message("#bookingsList",error.message,true)}
  }

  async function transitionBooking(id,to,family){try{await api(`/api/bookings/${encodeURIComponent(id)}/transition`,{method:"POST",body:JSON.stringify({to,reason:to==="cancelled"?"Cancelled by family":undefined})});loadBookings(family)}catch(error){window.alert(error.message)}}
  async function respondProposal(id,response,family){try{await api(`/api/proposals/${encodeURIComponent(id)}/respond`,{method:"POST",body:JSON.stringify({response})});loadBookings(family)}catch(error){window.alert(error.message)}}

  function startAdmin(){buildNav([["dashboard","Dashboard"],["calendar","Calendar"],["sitters","Sitters"],["bookings","Bookings"],["incidents","Incidents"]]);loadAdminScreen("dashboard")}

  async function loadAdminScreen(id){try{if(id==="dashboard")await loadDashboard();if(id==="calendar")await loadCalendar();if(id==="sitters")await loadSitters();if(id==="bookings")await loadAdminBookings();if(id==="incidents")await loadIncidents()}catch(error){window.alert(error.message)}}

  async function loadDashboard(){const data=await api("/api/admin/dashboard"),host=$("#dashboardStats");host.replaceChildren();[["Accounts",sum(data.users)],["Bookings",sum(data.bookings)],["Open incidents",data.incidents.filter(x=>!["resolved","closed"].includes(x.status)).reduce((a,x)=>a+Number(x.count),0)],["Approved sitters",data.sitters.filter(x=>x.screening_status==="approved").reduce((a,x)=>a+Number(x.count),0)]].forEach(([label,value])=>{const card=el("article",undefined,"card third stat");card.append(el("strong",String(value)),el("span",label,"muted"));host.append(card)})}
  async function loadCalendar(){const data=await api("/api/admin/calendar"),body=$("#calendarBody");body.replaceChildren();data.events.forEach(item=>tableRow(body,[item.public_code,formatDate(item.starts_at),item.area,item.household_name,item.sitter_name||"Unassigned",item.status]))}
  async function loadSitters(){const data=await api("/api/admin/sitters"),body=$("#sittersBody");body.replaceChildren();data.sitters.forEach(item=>tableRow(body,[item.public_code,item.display_name,item.home_area||"—",item.status,item.screening_status]))}
  async function loadAdminBookings(){const data=await api("/api/bookings"),body=$("#adminBookingsBody");body.replaceChildren();data.bookings.forEach(item=>{const tr=tableRow(body,[item.public_code,formatDate(item.starts_at),item.area,item.status]);const td=el("td");if(["requested","matching","offered"].includes(item.status)){const button=el("button","Run matching","btn");button.addEventListener("click",async()=>{try{const result=await api(`/api/admin/bookings/${encodeURIComponent(item.id)}/match`,{method:"POST",body:"{}"});window.alert(`${result.matches.length} eligible sitter(s) ranked.`);loadAdminBookings()}catch(error){window.alert(error.message)}});td.append(button)}tr.append(td)})}
  async function loadIncidents(){const data=await api("/api/admin/incidents"),body=$("#incidentsBody");body.replaceChildren();data.incidents.forEach(item=>tableRow(body,[item.public_code,item.severity,item.summary,item.status,formatDate(item.created_at)]))}

  function tableRow(body,values){const tr=el("tr");values.forEach(value=>tr.append(el("td",String(value??"—"))));body.append(tr);return tr}
  function sum(rows){return rows.reduce((total,row)=>total+Number(row.count||0),0)}
  function safeArray(value){try{const parsed=JSON.parse(value||"[]");return Array.isArray(parsed)?parsed:[]}catch{return[]}}
  function csv(value){return String(value||"").split(",").map(v=>v.trim()).filter(Boolean)}
  function empty(value){const clean=String(value||"").trim();return clean||null}
  function minutes(value){const [h,m]=value.split(":").map(Number);return h*60+m}
  function formatDate(value){return new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}
  function floridaWallTimeToUtc(value){
    const [date,time]=value.split("T"),[year,month,day]=date.split("-").map(Number),[hour,minute]=time.split(":").map(Number);let guess=Date.UTC(year,month-1,day,hour,minute);
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(guess));const get=t=>Number(parts.find(p=>p.type===t)?.value);const represented=Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"));guess+=Date.UTC(year,month-1,day,hour,minute)-represented;return new Date(guess).toISOString();
  }

  initialize();
})();
