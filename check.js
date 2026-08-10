/* ============================================================================
   check.js — run this every time you edit content/sitters.js or config.js.

   HOW TO RUN:
     Install Node.js once from nodejs.org, then in a terminal, in this folder:

       node check.js

   It reads your content files and tells you about mistakes before families see
   them. ERRORS will visibly break the site. WARNINGS are things worth a look.

   You do not have to use this. But a mismatched area name silently makes a
   sitter unfindable in the filter, and you would not notice for weeks.
   ========================================================================== */

global.window = {};
require("./content/config.js");
require("./content/sitters.js");
require("./content/faqs.js");
require("./assets/avatars.js");

var C = global.window.CONFIG,
    S = global.window.SITTERS,
    F = global.window.FAQS,
    AVATARS = global.window.AVATARS || {};

var AREAS = C.areas || [];
var CAPS = ["drives", "transport", "pets", "water", "meals", "homework", "overnight", "multiples", "specialNeeds"];
var AGES = ["Infant", "Toddler", "Preschool", "School-age", "Tween"];

var errs = [], warns = [];
function err(m) { errs.push(m); }
function warn(m) { warns.push(m); }

/* ---- config ---- */
["brand.name", "brand.tagline", "contact.email", "contact.phone", "contact.phoneLink",
 "rates.low", "rates.high", "site.url"].forEach(function (path) {
  var v = path.split(".").reduce(function (o, k) { return o && o[k]; }, C);
  if (!v) err('config.js: "' + path + '" is empty and is required');
});

if (C.contact && C.contact.phoneLink && !/^\+\d{10,15}$/.test(C.contact.phoneLink)) {
  err('config.js: contact.phoneLink must look like "+19415550142" — plus sign, country code, digits only, no spaces or brackets');
}
if (C.contact && C.contact.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(C.contact.email)) {
  err("config.js: contact.email does not look like a valid address");
}
if (C.site && C.site.url && /\/$/.test(C.site.url)) {
  warn("config.js: site.url ends in a slash. Remove it.");
}
if (!C.forms || !C.forms.provider) {
  err("config.js: forms.provider is empty, so NOTHING SUBMITTED THROUGH THE SITE WILL REACH YOU. See section 8 of config.js.");
} else if (C.forms.provider === "web3forms" && !C.forms.accessKey) {
  err("config.js: forms.provider is web3forms but forms.accessKey is empty. Enquiries will be lost.");
} else if (C.forms.provider === "formspree" && !C.forms.endpoint) {
  err("config.js: forms.provider is formspree but forms.endpoint is empty. Enquiries will be lost.");
}
(C.founders || []).forEach(function (f, i) {
  if (!f.name) err("config.js: founders[" + i + "] has no name");
  if (!f.photo && !f.avatar) warn("config.js: founders[" + i + "] (" + f.name + ") has neither a photo nor an avatar. Your own faces are your strongest trust signal, and showing yours is a different decision from publishing a sitter's.");
});
(C.vacationAreas || []).forEach(function (a) {
  // vacationAreas is display-only prose, so a mismatch is a warning not an error
  if (AREAS.indexOf(a) < 0) warn('config.js: vacationAreas has "' + a + '", which is not in areas. Fine for display, but no sitter can be filtered to it.');
});

/* ---- overclaiming language, anywhere in the content files ---- */
var BANNED = ["100% safe", "fully vetted", "completely verified", "risk-free",
  "risk free", "guaranteed safe", "we guarantee", "totally safe", "absolutely safe"];
var fs = require("fs");
["content/config.js", "content/sitters.js", "content/faqs.js", "index.html"].forEach(function (file) {
  var text = fs.readFileSync(file, "utf8");
  // Some passages quote these phrases in order to reject them. Those are wrapped
  // in LANGUAGE-CHECK-EXEMPT markers and skipped here.
  text = text.replace(/LANGUAGE-CHECK-EXEMPT-START[\s\S]*?LANGUAGE-CHECK-EXEMPT-END/g, "");
  text = text.toLowerCase();
  BANNED.forEach(function (phrase) {
    if (text.indexOf(phrase) > -1) {
      err('LANGUAGE: "' + phrase + '" appears in ' + file +
          ". Remove it. Absolute safety claims are the exact wording that creates legal exposure, and they are the promise you cannot keep.");
    }
  });
});

/* ---- sitters ---- */
var slugs = {};
(S || []).forEach(function (s) {
  var id = s.slug || "(sitter with no slug)";
  if (!s.slug || !/^[a-z0-9-]+$/.test(s.slug)) err(id + ": slug must be lowercase letters, numbers and hyphens only — no spaces, capitals or accents");
  if (slugs[s.slug]) err(id + ": duplicate slug. Every sitter needs a unique one.");
  slugs[s.slug] = 1;

  if (!s.first) err(id + ": no first name");

  /* ---- privacy rules: these exist to protect your sitters ---- */
  if (s.initial) err(id + ': has an "initial" field. Last initials are no longer published — delete it.');
  if (s.age) err(id + ': has an "age" field. Exact age is no longer published — delete it. Years of experience is the useful number.');
  if (s.photo) err(id + ': has a "photo" field. Sitter photographs are never published. Use an avatar instead, and share the photo privately on booking. See legal/sitter-photo-release.md.');
  if (s.area) err(id + ': has an "area" field (home neighbourhood). That is not published — use "serves" for the areas they will work in.');
  if (s.slug && s.slug.indexOf("-") > -1 && s.slug.split("-").length > 1 && s.slug.split("-")[1].length <= 2) {
    warn(id + ': slug looks like it contains a last initial ("' + s.slug + '"). Use the first name alone.');
  }
  if (!s.avatar) err(id + ': no avatar. Pick one of: ' + Object.keys(AVATARS).join(", "));
  else if (!AVATARS[s.avatar]) err(id + ': avatar "' + s.avatar + '" does not exist in assets/avatars.js. Valid: ' + Object.keys(AVATARS).join(", "));

  /* Bios that name a school, employer or street can identify someone even
     without a surname. Two harmless details combine into an address. */
  if (s.bio) {
    var LEAKY = [
      [/\b(?:USF|University of|College of|[A-Z][a-z]+ (?:University|College|Academy|High School|Elementary))\b/, "names a school or university"],
      [/\b(?:Memorial|Hospital|Clinic|Sarasota Memorial)\b/, "names a hospital or employer"],
      [/\b(?:Street|Avenue|Boulevard|Road|Drive|Lane)\b/, "names a street"],
      [/\bI (?:live|grew up) (?:in|on) [A-Z]/, "says where she lives"],
      [/\b(?:my|our) (?:apartment|condo|house) (?:in|on|at) [A-Z]/, "locates her home"]
    ];
    LEAKY.forEach(function (pair) {
      if (pair[0].test(s.bio)) {
        warn(id + ": bio " + pair[1] + ". Two small details combine into an address — consider editing it out.");
      }
    });
  }

  if (!Array.isArray(s.avail) || s.avail.length !== 4) {
    err(id + ": avail must have exactly 4 rows (Morning, Afternoon, Evening, Overnight)");
  } else {
    s.avail.forEach(function (row, i) {
      if (row.length !== 7) err(id + ": avail row " + (i + 1) + " has " + row.length + " values, needs 7 (Mon to Sun)");
    });
    if (!s.avail.some(function (r) { return r.some(function (v) { return v; }); })) {
      warn(id + ": marked available at no time at all, so no filter will ever return them. Set some slots to 1, or set listed: false.");
    }
  }

  CAPS.forEach(function (c) {
    if (!s.caps || s.caps[c] === undefined) err(id + ": caps." + c + " is missing. Every capability must be answered 1 or 0.");
  });
  (s.ages || []).forEach(function (a) {
    if (AGES.indexOf(a) < 0) err(id + ': age group "' + a + '" is not one of ' + AGES.join(" / "));
  });
  if (!s.ages || !s.ages.length) err(id + ": no age groups listed");
  (s.serves || []).forEach(function (a) {
    if (AREAS.indexOf(a) < 0) err(id + ': serves "' + a + '" but that area is not in config.js areas. The filter will never find them. Spelling must match exactly.');
  });
  if (!s.serves || !s.serves.length) err(id + ": no areas served");

  if (!s.certs || !s.certs.length) warn(id + ": no certifications listed");
  if (s.caps && s.caps.transport && !s.caps.drives) warn(id + ": transports children but drives is 0. One of those is wrong.");

  var sc = s.screening || [];
  function has(word) {
    return sc.some(function (x) { return x.n.toLowerCase().indexOf(word) > -1; });
  }
  if (!has("criminal")) err(id + ": no criminal background check line in screening");
  if (!has("interview")) err(id + ": no interview line in screening");
  if (!has("reference")) err(id + ": no reference check line in screening");
  if (!has("registry")) err(id + ": no sex offender registry line in screening");
  if (s.caps && s.caps.transport && !has("driving")) {
    err(id + ": transports children but has no driving record line in screening. That is the one check that must be there.");
  }
  sc.forEach(function (x) {
    if (!x.v && !x.na) err(id + ': screening item "' + x.n + '" has neither a date (v) nor a reason it does not apply (na)');
    if (x.v && /Month Year|00\/0000/.test(x.v)) err(id + ': screening item "' + x.n + '" still has template text: "' + x.v + '"');
  });
  (s.certs || []).forEach(function (c) {
    if (/00\/0000/.test(c.e)) err(id + ': certification "' + c.n + '" still has template text for its expiry');
  });

  if (s.rate < +C.rates.low || s.rate > +C.rates.high) {
    warn(id + ": rate $" + s.rate + " sits outside the $" + C.rates.low + "–$" + C.rates.high +
         " range you advertise on the How it works page. Families will notice.");
  }
});

if (!S || !S.length) err("content/sitters.js: the roster is empty. The roster IS the product.");
if (S && S.filter(function (s) { return s.listed !== false; }).length < 3) {
  warn("Fewer than 3 sitters are listed. A roster this thin undercuts the whole 'choose your own sitter' promise. Consider waiting to launch.");
}
if (S && S.some(function (s) {
  return ["maria", "rosa", "aleksandra", "nia", "devon", "tomas", "jasmine", "grace"].indexOf(s.slug) > -1;
})) {
  err("THE FICTIONAL EXAMPLE SITTERS ARE STILL IN content/sitters.js. Delete them before going live — otherwise you are advertising people who do not exist.");
}
if (!F || !F.length) warn("content/faqs.js is empty. The FAQ page earns real search traffic.");

/* ---- legal ---- */
["legal/sitter-listing-agreement.md", "legal/background-check-disclosure.md",
 "legal/data-handling-policy.md"].forEach(function (f) {
  if (!fs.existsSync(f)) { warn("Missing " + f + " — the legal drafts should stay with the project."); return; }
  if (fs.readFileSync(f, "utf8").indexOf("DRAFT") > -1) {
    warn(f + " is still marked DRAFT. It must be reviewed by a Florida attorney before anyone signs it. See legal/README.md.");
  }
});
if (fs.existsSync("legal/data-handling-policy.md") &&
    fs.readFileSync("legal/data-handling-policy.md", "utf8").indexOf("Sensitive records are stored in: ______") > -1) {
  warn("legal/data-handling-policy.md: you have not written down where sensitive records live. Decide it and fill it in — that blank is the whole point of the document.");
}

/* ---- report ---- */
console.log("");
console.log("  " + (C.brand && C.brand.name ? C.brand.name : "site") + " — content check");
console.log("  " + (S ? S.length : 0) + " sitters in file, " +
            (S ? S.filter(function (s) { return s.listed !== false; }).length : 0) + " listed, " +
            (F ? F.length : 0) + " FAQs, " + AREAS.length + " areas");
console.log("");
if (errs.length) {
  console.log("  ERRORS (" + errs.length + ") — fix these before publishing");
  errs.forEach(function (e) { console.log("    x  " + e); });
  console.log("");
}
if (warns.length) {
  console.log("  WARNINGS (" + warns.length + ") — worth a look");
  warns.forEach(function (w) { console.log("    !  " + w); });
  console.log("");
}
if (!errs.length && !warns.length) console.log("  All clear.\n");
process.exit(errs.length ? 1 : 0);
