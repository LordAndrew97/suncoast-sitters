/* ============================================================================
   app.js — how the site works.

   YOU SHOULD NOT NEED TO EDIT THIS FILE.
   Everything you want to change lives in content/config.js, content/sitters.js
   and content/faqs.js. If you find yourself editing this file to change a name,
   a rate or a phone number, stop — that value belongs in config.js.
   ========================================================================== */
(function () {
  "use strict";

  var C = window.CONFIG || {};
  var ALL = (window.SITTERS || []).filter(function (s) { return s.listed !== false; });
  var FAQS = window.FAQS || [];

  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var SLOTS = ["Morning", "Afternoon", "Evening", "Overnight"];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------------------------------------------------------------
     Token table — maps {{token}} in the HTML to a value from config.js
     --------------------------------------------------------------------- */
  var b = C.brand || {}, ct = C.contact || {}, r = C.rates || {},
      p = C.policies || {}, sc = C.screening || {}, st = C.site || {};

  var TOKENS = {
    brand: b.name, legalName: b.legalName, tagline: b.tagline,
    shortDescription: b.shortDescription, city: b.city, region: b.region,
    state: b.state, stateAbbr: b.stateAbbr,
    email: ct.email, phone: ct.phone, phoneLink: ct.phoneLink,
    hours: ct.hours, address: ct.address,
    responseTime: ct.responseTime, responseTimeOvernight: ct.responseTimeOvernight,
    rateLow: r.low, rateHigh: r.high, extraChild: r.extraChild,
    minimumHours: r.minimumHours, vacationMinimumHours: r.vacationMinimumHours,
    holidayPolicy: r.holidayPolicy, businessModel: r.businessModel,
    noticeWanted: p.noticeWanted,
    noticeWanted2: (p.noticeWanted || "").toLowerCase(),
    cancelFreeWindow: p.cancelFreeWindow, cancelChargeText: p.cancelChargeText,
    screeningProvider: sc.provider, interviewLength: sc.interviewLength,
    minReferences: sc.minReferences, minExperience: sc.minExperience,
    siteUrl: st.url
  };

  function fill(str) {
    return String(str).replace(/\{\{(\w+)\}\}/g, function (m, k) {
      return TOKENS[k] !== undefined && TOKENS[k] !== null ? TOKENS[k] : m;
    });
  }

  /* Walk the document once, replacing tokens in text and in href/title/content. */
  function fillDocument(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) { if (n.nodeValue.indexOf("{{") > -1) nodes.push(n); }
    nodes.forEach(function (node) { node.nodeValue = fill(node.nodeValue); });
    $$("[href],[title],[content],[placeholder],[aria-label]", root).forEach(function (el) {
      ["href", "title", "content", "placeholder", "aria-label"].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && v.indexOf("{{") > -1) el.setAttribute(a, fill(v));
      });
    });
  }

  /* ---------------------------------------------------------------------
     Rendering pieces
     --------------------------------------------------------------------- */
  function portrait(s, extraStyle) {
    var A = window.AVATARS || {};
    var art = A[s.avatar];
    var style = extraStyle ? ' style="' + extraStyle + '"' : "";
    if (!art) {
      // Unknown avatar name — show the initial rather than an empty box, and say so
      // in the console so you can fix content/sitters.js.
      console.warn('Sitter "' + s.first + '" has avatar "' + s.avatar +
        '", which is not in assets/avatars.js. Valid names: ' + Object.keys(A).join(", "));
      return '<div class="portrait t' + (s.tint || 0) + '"' + style +
        '><span class="initial" aria-hidden="true">' + esc(s.first.charAt(0)) + "</span></div>";
    }
    return '<div class="portrait portrait--av t' + (s.tint || 0) + '"' + style + ">" +
      '<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Illustrated ' + esc(art.label.toLowerCase()) + ' avatar representing ' +
      esc(s.first) + '">' + art.svg + "</svg></div>";
  }

  function topBadges(s) {
    var out = [];
    if (s.certs[0]) out.push(s.certs[0].n);
    if (s.certs[1]) out.push(s.certs[1].n);
    if (s.caps.overnight) out.push("Overnights");
    if (s.langs.length > 1) out.push(s.langs.slice(1).join(" · "));
    return out.slice(0, 3).map(function (x) {
      return '<span class="badge badge--gulf">' + esc(x) + "</span>";
    }).join("");
  }

  function faceLink(s) {
    return '<a class="face" href="#/sitters/' + s.slug + '">' + portrait(s) +
      '<p class="nm">' + esc(s.first) + "</p>" +
      '<p class="mt">' + s.years + " yrs experience</p></a>";
  }

  function card(s) {
    return '<a class="card" href="#/sitters/' + s.slug + '">' + portrait(s) +
      '<div class="body"><div>' +
      '<h3 class="d4" style="margin-bottom:.22rem">' + esc(s.first) + "</h3>" +
      '<p class="util mb0" style="color:var(--slate)">' + s.years +
      " yrs experience \u00b7 " + esc(s.serves.slice(0, 2).join(", ")) +
      (s.serves.length > 2 ? " +" + (s.serves.length - 2) : "") + "</p></div>" +
      '<p class="hook mb0">\u201c' + esc(s.hook) + '\u201d</p>' +
      '<div class="badges">' + topBadges(s) + "</div>" +
      '<p class="mb0" style="font-size:.9rem;color:var(--slate)">' + esc(s.ages.join(", ")) + "</p>" +
      '<div class="foot"><span class="rate">$' + s.rate + "<small> / hour</small></span>" +
      '<span class="util" style="color:var(--gulf-deep)">View profile \u2192</span>' +
      "</div></div></a>";
  }

  /* ---------------------------------------------------------------------
     Static content driven by config
     --------------------------------------------------------------------- */
  function areaChips(list) {
    return (list || []).map(function (a) { return "<span>" + esc(a) + "</span>"; }).join("");
  }

  var BASE_TITLE = document.title;

  function boot() {
    fillDocument(document.body);

    var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();

    $("#homeFaces").innerHTML = ALL.map(faceLink).join("");
    $("#homeAreas").innerHTML = areaChips(C.areas);
    $("#contactAreas").innerHTML = areaChips(C.areas);

    // Vacation page: sitters who serve any of the vacation areas
    var va = C.vacationAreas || [];
    $("#vacationGrid").innerHTML = ALL.filter(function (s) {
      return s.serves.some(function (x) { return va.indexOf(x) > -1; });
    }).map(card).join("") ||
      '<p class="dim">No sitters are currently listed for the keys. <a href="#/contact">Ask us</a> and we will check.</p>';

    // Founders
    var f = $("#founders");
    if (f) {
      f.innerHTML = (C.founders || []).map(function (p, i) {
        // The two of you may show your own faces — that is your own business and your
        // strongest trust signal. It is a different decision from publishing a sitter's photo.
        var A = window.AVATARS || {};
        var pic;
        if (p.photo) {
          pic = '<div class="portrait t' + (i + 1) + '" style="max-width:19rem;box-shadow:var(--overhang)"><img src="' +
            esc(p.photo) + '" alt="' + esc(p.name) + '" loading="lazy" width="400" height="500" style="width:100%;height:100%;object-fit:cover"></div>';
        } else if (p.avatar && A[p.avatar]) {
          pic = '<div class="portrait portrait--av t' + (i + 1) + '" style="max-width:19rem;box-shadow:var(--overhang)">' +
            '<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustrated avatar for ' +
            esc(p.name) + '">' + A[p.avatar].svg + '</svg></div>';
        } else {
          pic = '<div class="portrait t' + (i + 1) + '" style="max-width:19rem;box-shadow:var(--overhang)"><span class="initial" aria-hidden="true">' +
            esc(p.name.charAt(0)) + '</span><span class="pending">Photo pending</span></div>';
        }
        return "<div>" + pic +
          '<h2 class="d3" style="margin-top:1.2rem">' + esc(p.name) + "</h2>" +
          '<p class="util" style="color:var(--slate);margin:.4rem 0 1rem">' + esc(p.role) + "</p>" +
          "<p>" + esc(p.bio) + "</p></div>";
      }).join("");
    }

    var os = $("#originStory");
    if (os) os.innerHTML = (C.originStory || []).map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");

    // FAQ — tokens allowed inside answers
    $("#faqList").innerHTML = FAQS.map(function (pair, i) {
      return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(fill(pair[0])) +
        '</summary><div class="a"><p>' + esc(fill(pair[1])) + "</p></div></details>";
    }).join("");

    // Filter dropdowns
    (C.areas || []).forEach(function (a) {
      $("#f-area").insertAdjacentHTML("beforeend", "<option>" + esc(a) + "</option>");
    });
    var langs = [];
    ALL.forEach(function (s) {
      s.langs.forEach(function (l) { if (langs.indexOf(l) < 0) langs.push(l); });
    });
    langs.sort().forEach(function (l) {
      $("#f-lang").insertAdjacentHTML("beforeend", "<option>" + esc(l) + "</option>");
    });
    ALL.forEach(function (s) {
      $("#r-sitter").insertAdjacentHTML("beforeend",
        '<option value="' + s.slug + '">' + esc(s.first) +
        " \u2014 " + esc(s.serves[0]) + ", $" + s.rate + "/hr</option>");
    });

    // Social links in the footer, only if filled in
    var soc = C.social || {}, socHtml = [];
    if (soc.instagram) socHtml.push('<li><a href="' + esc(soc.instagram) + '">Instagram</a></li>');
    if (soc.facebook) socHtml.push('<li><a href="' + esc(soc.facebook) + '">Facebook</a></li>');
    if (soc.googleBusiness) socHtml.push('<li><a href="' + esc(soc.googleBusiness) + '">Reviews on Google</a></li>');
    if (socHtml.length) {
      var list = $("#footerBrandLinks");
      if (list) list.insertAdjacentHTML("beforeend", socHtml.join(""));
    }

    // Cookieless analytics, if configured
    if (st.plausibleDomain) {
      var sTag = document.createElement("script");
      sTag.defer = true;
      sTag.setAttribute("data-domain", st.plausibleDomain);
      sTag.src = "https://plausible.io/js/script.js";
      document.head.appendChild(sTag);
    }

    // Structured data for local search
    var ld = {
      "@context": "https://schema.org", "@type": "LocalBusiness",
      name: b.name, description: b.shortDescription,
      email: ct.email, telephone: ct.phone, url: st.url,
      address: { "@type": "PostalAddress", addressLocality: b.city, addressRegion: b.stateAbbr, addressCountry: "US" },
      areaServed: (C.areas || []).map(function (a) { return { "@type": "Place", name: a }; }),
      priceRange: "$" + r.low + "-$" + r.high + " per hour"
    };
    var ldTag = document.createElement("script");
    ldTag.type = "application/ld+json";
    ldTag.textContent = JSON.stringify(ld);
    document.head.appendChild(ldTag);

    renderRoster();
    route();
  }

  /* ---------------------------------------------------------------------
     Roster filtering
     --------------------------------------------------------------------- */
  function readFilters() {
    return {
      age: $("#f-age").value, day: $("#f-day").value, slot: $("#f-slot").value,
      area: $("#f-area").value, lang: $("#f-lang").value, rate: $("#f-rate").value,
      caps: $$("#filters [data-cap]").filter(function (c) { return c.checked; })
              .map(function (c) { return c.dataset.cap; }),
      sort: $("#f-sort").value
    };
  }
  function matches(s, f) {
    if (f.age && s.ages.indexOf(f.age) < 0) return false;
    if (f.area && s.serves.indexOf(f.area) < 0) return false;
    if (f.lang && s.langs.indexOf(f.lang) < 0) return false;
    if (f.rate && s.rate > +f.rate) return false;
    if (f.caps.some(function (c) { return !s.caps[c]; })) return false;
    var di = f.day ? DAYS.indexOf(f.day) : -1, si = f.slot ? SLOTS.indexOf(f.slot) : -1;
    if (si > -1 && di > -1) { if (!s.avail[si][di]) return false; }
    else if (si > -1) { if (!s.avail[si].some(function (v) { return v; })) return false; }
    else if (di > -1) { if (!s.avail.some(function (row) { return row[di]; })) return false; }
    return true;
  }
  function renderRoster() {
    var f = readFilters();
    var list = ALL.filter(function (s) { return matches(s, f); });
    var sorts = {
      exp: function (a, c) { return c.years - a.years; },
      "rate-asc": function (a, c) { return a.rate - c.rate; },
      "rate-desc": function (a, c) { return c.rate - a.rate; },
      name: function (a, c) { return a.first.localeCompare(c.first); }
    };
    list.sort(sorts[f.sort]);
    var active = !!(f.age || f.day || f.slot || f.area || f.lang || f.rate || f.caps.length);
    $("#clearFilters").hidden = !active;
    $("#resultCount").textContent = list.length === ALL.length
      ? list.length + " sitter" + (list.length === 1 ? "" : "s")
      : list.length + " of " + ALL.length + " sitters";
    $("#rosterGrid").innerHTML = list.map(card).join("");
    $("#rosterGrid").hidden = list.length === 0;
    $("#rosterEmpty").hidden = list.length > 0;
  }

  /* ---------------------------------------------------------------------
     Profile page
     --------------------------------------------------------------------- */
  function ynRow(caps) {
    var map = [["transport", "Drives your children"], ["water", "Confident near water"],
      ["pets", "Fine with pets"], ["meals", "Light meal prep"], ["homework", "Homework help"],
      ["overnight", "Overnight care"], ["multiples", "Twins or multiples"],
      ["specialNeeds", "Special-needs experience"]];
    return map.map(function (m) {
      return '<span class="yn ' + (caps[m[0]] ? "y" : "n") + '"><i aria-hidden="true">' +
        (caps[m[0]] ? "\u2713" : "\u2014") + "</i>" + esc(m[1]) + "</span>";
    }).join("");
  }
  function availTable(s) {
    var head = "<tr><th></th>" + DAYS.map(function (d) { return '<th scope="col">' + d + "</th>"; }).join("") + "</tr>";
    var rows = SLOTS.map(function (sl, i) {
      return '<tr><th scope="row">' + sl + "</th>" + s.avail[i].map(function (v, j) {
        return '<td><span class="cell' + (v ? " on" : "") + '"><span class="visually-hidden">' +
          sl + " " + DAYS[j] + ": " + (v ? "available" : "not available") + "</span></span></td>";
      }).join("") + "</tr>";
    }).join("");
    return '<table class="avail"><caption>General availability, kept up to date by us. Not a live calendar \u2014 send a request and we will confirm with ' +
      esc(s.first) + " directly.</caption><thead>" + head + "</thead><tbody>" + rows + "</tbody></table>";
  }
  function renderSitter(slug) {
    var s = ALL.filter(function (x) { return x.slug === slug; })[0];
    var el = $("#sitterBody");
    if (!s) {
      el.innerHTML = '<p class="crumb"><a href="#/sitters">Sitters</a></p>' +
        '<h1 class="d2">We could not find that sitter.</h1>' +
        '<p class="lede" style="margin-top:1rem">They may have come off the roster. ' +
        '<a href="#/sitters">Browse everyone who is currently listed \u2192</a></p>';
      return;
    }
    var similar = ALL.filter(function (x) {
      return x.slug !== s.slug && x.ages.some(function (a) { return s.ages.indexOf(a) > -1; });
    }).slice(0, 3);

    el.innerHTML =
      '<p class="crumb"><a href="#/sitters">Sitters</a> &nbsp;/&nbsp; ' + esc(s.first) + "</p>" +
      '<div class="profile"><div class="sticky">' + portrait(s) +
      '<div style="margin-top:1.3rem"><span class="rate" style="font-size:1.5rem">$' + s.rate +
      "<small> / hour</small></span>" +
      '<p class="util" style="color:var(--slate);margin:.45rem 0 0">' + s.min +
      "-hour minimum \u00b7 +" + esc(TOKENS.extraChild || "") + "</p></div>" +
      '<p style="margin-top:1.4rem"><a class="btn" href="#/request?sitter=' + s.slug +
      '">Request ' + esc(s.first) + "</a></p>" +
      '<p class="dim" style="font-size:.88rem;margin-top:.8rem">Free to ask. We reply ' +
      esc(TOKENS.responseTime || "") + " on weekdays.</p></div><div>" +
      '<h1 class="d1" style="font-size:clamp(2.1rem,5vw,3.4rem)">' + esc(s.first) + "</h1>" +
      '<p class="lede" style="margin-top:.9rem;font-style:italic">\u201c' + esc(s.hook) + '\u201d</p>' +
      '<div class="badges" style="margin-top:1.4rem">' +
      s.certs.map(function (c) { return '<span class="badge badge--gulf">' + esc(c.n) + "</span>"; }).join("") +
      s.langs.map(function (l) { return '<span class="badge">' + esc(l) + "</span>"; }).join("") + "</div>" +
      '<div class="stack" style="margin-top:2rem">' +
      s.bio.split("\n\n").map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</div>" +
      '<h2 class="d3" style="margin-top:2.8rem">Details</h2><dl class="specs">' +
      '<div class="spec"><dt>Experience</dt><dd><span class="num">' + s.years + "</span> years, paid childcare</dd></div>" +
      '<div class="spec"><dt>Ages taken</dt><dd>' + esc(s.ages.join(" \u00b7 ")) + "</dd></div>" +
      '<div class="spec"><dt>Languages</dt><dd>' + esc(s.langs.join(" \u00b7 ")) + "</dd></div>" +
      '<div class="spec"><dt>Certifications</dt><dd>' + s.certs.map(function (c) {
        return esc(c.n) + ' <span class="util" style="color:var(--slate)">' + esc(c.e) + "</span>";
      }).join("<br>") + "</dd></div>" +
      '<div class="spec"><dt>Areas served</dt><dd>' + esc(s.serves.join(" \u00b7 ")) + "</dd></div>" +
      '<div class="spec"><dt>Will and won\'t</dt><dd><div class="yesno">' + ynRow(s.caps) + "</div></dd></div>" +
      "</dl>" +
      '<h2 class="d3" style="margin-top:2.8rem">Availability</h2>' +
      '<div style="margin-top:1rem;overflow-x:auto">' + availTable(s) + "</div>" +
      '<h2 class="d3" style="margin-top:2.8rem">What we checked for ' + esc(s.first) + "</h2>" +
      '<p style="margin-top:.7rem">Every item, with the month it was completed. Where something does not apply, it says so.</p>' +
      '<ul class="checklist" style="margin-top:1.2rem">' +
      s.screening.map(function (i) {
        return i.na
          ? '<li><span class="tick na" aria-hidden="true">\u2014</span><span>' + esc(i.n) +
            '<span class="when">' + esc(i.na) + "</span></span></li>"
          : '<li><span class="tick" aria-hidden="true">\u2713</span><span>' + esc(i.n) +
            '<span class="when">' + esc(i.v) + "</span></span></li>";
      }).join("") + "</ul>" +
      '<div class="disclaim" style="margin-top:1.6rem"><strong>What this does and does not mean.</strong> ' +
      "These checks were completed on the dates shown and showed nothing disqualifying. Screening reduces risk; it cannot eliminate it, and we will not tell you " +
      esc(s.first) + " is guaranteed safe. We recommend a short call or meeting before a first booking \u2014 we will arrange it at no charge \u2014 and the hiring decision remains yours. " +
      '<a href="#/our-screening">More on how we screen \u2192</a></div>' +
      '<div class="disclaim" style="margin-top:1rem;border-left:3px solid var(--gulf)">' +
      '<strong>Why a drawing and not a photograph.</strong> We do not publish our sitters\' ' +
      'photographs, surnames or neighbourhoods, because that information in a public place ' +
      'creates a real safety risk for them. When we confirm a booking we send you ' +
      esc(s.first) + '\'s full name, a photograph and references you can call yourself, and we ' +
      'will arrange a call or a meeting before the first sit at no charge. ' +
      'You will know exactly who is coming. ' +
      '<a href="#/our-screening">How this works \u2192</a></div>' +
      '<h2 class="d3" style="margin-top:2.8rem">Other sitters who take these ages</h2>' +
      '<div class="faces" style="margin-top:1.2rem;grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr))">' +
      similar.map(faceLink).join("") + "</div>" +
      '<p style="margin-top:1.8rem"><a class="btn btn--ghost btn--sm" href="#/sitters">Back to the full roster</a></p>' +
      "</div></div>";
  }

  /* ---------------------------------------------------------------------
     Forms
     --------------------------------------------------------------------- */
  function validate(form) {
    var ok = true;
    $$("[required]", form).forEach(function (inp) {
      var field = inp.closest(".field");
      var bad = inp.type === "checkbox" ? !inp.checked : !inp.value.trim();
      if (!bad && inp.type === "email") bad = !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(inp.value);
      if (field) field.classList.toggle("bad", bad);
      if (bad) { inp.setAttribute("aria-invalid", "true"); if (ok) inp.focus(); ok = false; }
      else inp.removeAttribute("aria-invalid");
    });
    return ok;
  }

  /* Collects every labelled field in a form into a plain object. */
  function collect(form, subject) {
    var data = { _subject: subject, _site: b.name };
    $$("input,select,textarea", form).forEach(function (el) {
      if (!el.id && !el.name) return;
      var key = el.id || el.name;
      var lab = form.querySelector('label[for="' + el.id + '"]');
      var label = lab ? lab.textContent.replace("*", "").trim() : key;
      if (el.type === "checkbox") {
        if (el.checked) data[label] = (data[label] ? data[label] + ", " : "") + (el.nextElementSibling ? el.nextElementSibling.textContent.trim() : "yes");
      } else if (el.value) {
        data[label] = el.value;
      }
    });
    return data;
  }

  /* Sends to whichever provider is configured. Resolves true if it went out. */
  function send(data) {
    var cfg = C.forms || {};
    if (cfg.provider === "platform") {
      if (data._subject === "New message from the website") {
        return fetch("/api/public/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: data["Your name"], email: data.Email, message: data.Message })
        }).then(function (r) { return r.ok; }).catch(function () { return false; });
      }
      window.location.href = "portal/";
      return Promise.resolve(false);
    }
    if (cfg.provider === "web3forms" && cfg.accessKey) {
      data.access_key = cfg.accessKey;
      return fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
    }
    if (cfg.provider === "formspree" && cfg.endpoint) {
      return fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
    }
    // Not configured yet — warn in the console so you notice during testing.
    console.warn("[" + (b.name || "site") + "] No form provider configured in content/config.js. " +
      "Nothing was sent. See section 8 of config.js.");
    return Promise.resolve(false);
  }

  function wireForm(formSel, subject, onDone) {
    var form = $(formSel);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var btn = $('button[type="submit"]', form);
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending\u2026"; }
      send(collect(form, subject)).then(function (sent) {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (sent) onDone(form);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Routing
     --------------------------------------------------------------------- */
  var PAGES = ["home", "sitters", "sitter", "request", "how-it-works", "our-screening",
    "vacation-sitting", "for-sitters", "about", "faq", "contact", "privacy", "terms"];
  var TITLES = {
    home: null, sitters: "Every sitter we work with", sitter: "Sitter profile",
    request: "Request a sitter", "how-it-works": "How it works",
    "our-screening": "Our screening", "vacation-sitting": "Vacation & hotel sitting",
    "for-sitters": "For sitters", about: "About us", faq: "Frequently asked questions",
    contact: "Contact", privacy: "Privacy policy", terms: "Terms of service"
  };

  function route() {
    var raw = (location.hash || "#/").slice(2);
    var bits = raw.split("?"), path = bits[0], query = bits[1];
    var parts = path.split("/").filter(Boolean);
    var page = "home";
    if (parts.length === 0) page = "home";
    else if (parts[0] === "sitters" && parts[1]) { page = "sitter"; renderSitter(parts[1]); }
    else if (PAGES.indexOf(parts[0]) > -1) page = parts[0];

    if (page === "request") {
      $("#requestWrap").hidden = false;
      $("#requestDone").hidden = true;
      var slug = query ? new URLSearchParams(query).get("sitter") : null;
      var found = slug && ALL.some(function (s) { return s.slug === slug; });
      $("#r-sitter").value = found ? slug : "";
    }

    $$(".page").forEach(function (p) { p.classList.remove("active"); });
    ($("#p-" + page) || $("#p-home")).classList.add("active");

    var key = page === "sitter" ? "sitters" : page;
    $$(".navlinks a").forEach(function (a) {
      var target = a.getAttribute("href").slice(2);
      if (target === key) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    $("#navlinks").classList.remove("open");
    $("#navtoggle").setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    $("#main").focus({ preventScroll: true });
    // The homepage title is the hand-edited one in index.html; sub-pages get a
    // page-specific title so browser tabs and history are readable.
    if (page !== "home") {
      document.title = TITLES[page] + " \u2014 " + (b.name || "") +
        ", " + (b.city || "") + " " + (b.stateAbbr || "");
    } else {
      document.title = BASE_TITLE;
    }
  }

  /* ---------------------------------------------------------------------
     Go
     --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    boot();

    $("#filters").addEventListener("input", renderRoster);
    $("#f-sort").addEventListener("change", renderRoster);
    function clearAll() {
      $("#filters").reset();
      $("#f-sort").value = "exp";
      renderRoster();
      $("#p-sitters").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $("#clearFilters").addEventListener("click", clearAll);
    $("#clearFilters2").addEventListener("click", clearAll);

    wireForm("#requestForm", "New booking request", function () {
      var slug = $("#r-sitter").value;
      var s = ALL.filter(function (x) { return x.slug === slug; })[0];
      $("#doneSitter").textContent = s ? s.first : "a sitter who fits what you need";
      $("#requestWrap").hidden = true;
      $("#requestDone").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    wireForm("#sitterForm", "New sitter application", function () {
      $("#sitterAppWrap").hidden = true;
      $("#sitterAppDone").hidden = false;
      $("#sitterAppDone").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    wireForm("#contactForm", "New message from the website", function () {
      $("#contactWrap").hidden = true;
      $("#contactDone").hidden = false;
    });

    window.addEventListener("hashchange", route);
    $("#navtoggle").addEventListener("click", function (e) {
      var open = $("#navlinks").classList.toggle("open");
      e.currentTarget.setAttribute("aria-expanded", String(open));
    });
  });
})();
