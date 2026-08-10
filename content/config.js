/* ============================================================================
   config.js — EVERY BUSINESS DETAIL ON THE SITE LIVES HERE

   This is the only file you need to touch to launch. Change a value between
   the quotes and it updates everywhere on the site automatically.

   RULES:
   - Keep the quotes. "Sarasota" is right, Sarasota is wrong.
   - Keep the commas at the end of each line.
   - Anything marked  ← FILL THIS IN  is currently placeholder text.
   - After editing, open index.html in your browser to check it before pushing.
   ========================================================================== */

/* ── ON PRIVACY ─────────────────────────────────────────────────────────────
   This site publishes NO sitter photographs, surnames, exact ages or home
   neighbourhoods. Sitters are shown with an illustrated avatar and a first name.
   Full details go to the family privately once a booking is confirmed.

   That is a deliberate decision, it is written into the sitter agreement in
   legal/, and check.js enforces it. Please do not undo it to make the site look
   more conventional — read legal/README.md first.
   ────────────────────────────────────────────────────────────────────────── */

window.CONFIG = {

  /* ---------------------------------------------------------------------
     1. THE BRAND
     --------------------------------------------------------------------- */
  brand: {
    // Appears in the header, the footer, and every page title.
    name: "Suncoast Sitters",

    // Your registered company name. Appears in the footer copyright line only.
    legalName: "Suncoast Sitters LLC",                       // ← FILL THIS IN

    // The line under the faces on the homepage. This is your single most
    // important sentence. Keep it short and keep it a promise.
    tagline: "Meet your sitter before they meet your kids.",

    // Used in the footer and in the search-engine description.
    shortDescription: "Hand-selected, screened babysitters in Sarasota and across the Suncoast. You see who is coming.",

    // The city or region name used in headings and search text.
    city: "Sarasota",
    region: "the Suncoast",
    state: "Florida",
    stateAbbr: "FL"
  },


  /* ---------------------------------------------------------------------
     2. HOW FAMILIES REACH YOU
     --------------------------------------------------------------------- */
  contact: {
    email: "hello@suncoastsitters.com",                      // ← FILL THIS IN

    // Written out as families should read it.
    phone: "(941) 555-0142",                                 // ← FILL THIS IN

    // The same number in dialling format: +1 then 10 digits, no spaces.
    phoneLink: "+19415550142",                               // ← FILL THIS IN

    // When you answer the phone.
    hours: "8am to 8pm, seven days",                         // ← FILL THIS IN

    // How fast you promise to reply. Promise something you can actually keep —
    // this appears on the request form, the success screen and three pages.
    responseTime: "within four hours",                       // ← FILL THIS IN
    responseTimeOvernight: "by 10am the next day",            // ← FILL THIS IN

    // Your public address, or leave "" to hide it. A city is enough; you do not
    // need to publish a home address.
    address: "Sarasota, Florida"                             // ← FILL THIS IN
  },


  /* ---------------------------------------------------------------------
     3. THE TWO OF YOU
     Shown on the About page. Photos go in the /photos folder.
     --------------------------------------------------------------------- */
  founders: [
    {
      name: "Elena",                                         // ← FILL THIS IN
      role: "Co-founder · Screening & interviews",           // ← FILL THIS IN
      // 2–3 sentences. Say what you actually did before this. Specifics build
      // trust; "passionate about childcare" does not.
      bio: "Fifteen years in paediatric nursing at Sarasota Memorial, and the one who asks the uncomfortable questions in an interview. She runs every reference call and every background check personally.",
      // Your own photo. This is YOUR business and your face is your strongest trust
      // signal — a very different decision from publishing a sitter's photograph.
      // Put the file at photos/elena.jpg and write "photos/elena.jpg" here.
      photo: "",                                             // ← FILL THIS IN
      // If you would rather not show your face, name an avatar instead:
      // heron, pelican, manatee, turtle, dolphin, flamingo, crab, owl
      avatar: ""                                             // ← optional
    },
    {
      name: "Marcus",                                        // ← FILL THIS IN
      role: "Co-founder · Scheduling & families",            // ← FILL THIS IN
      bio: "Answers the phone, matches the requests, and remembers that your youngest will not go to sleep without the blue rabbit. Spent eight years managing operations for a local hospitality group before this.",
      photo: "",                                             // ← FILL THIS IN
      avatar: ""                                             // ← optional
    }
  ],

  // The "Why we started this" story on the About page. One string per paragraph.
  // This is the highest-converting copy on a trust site. Write it yourselves,
  // in your own words, about what actually happened to you.
  originStory: [                                             // ← FILL THIS IN
    "We moved to Sarasota with a two-year-old and no family within a thousand miles. The first time we needed a sitter, we called three agencies. All three asked for our details, our dates and our credit card, and none of them would tell us anything about the person who would be coming.",
    "One of them said, cheerfully, that we would meet the sitter on the night. We cancelled and stayed in.",
    "It is a strange thing to ask of a parent — trust us completely, and do not look. So we built the opposite: a small roster, every person visible, every check written down, and the choice left with you. If that means we grow slowly, we will grow slowly."
  ],


  /* ---------------------------------------------------------------------
     4. WHERE YOU WORK
     Add or remove areas freely. These populate the roster filter dropdown,
     so they must match the "serves" values in content/sitters.js exactly.
     --------------------------------------------------------------------- */
  areas: [                                                   // ← FILL THIS IN
    "Sarasota", "Gulf Gate", "Palmer Ranch", "Siesta Key", "Longboat Key",
    "Lido Key", "Bird Key", "Bradenton", "Lakewood Ranch", "Venice",
    "Osprey", "Nokomis", "Anna Maria Island"
  ],

  // The subset used on the Vacation & hotel sitting page.
  vacationAreas: [                                           // ← FILL THIS IN
    "Siesta Key", "Longboat Key", "Lido Key", "St. Armands Circle",
    "Anna Maria Island", "Casey Key", "Bird Key",
    "Downtown Sarasota hotels", "Vacation rentals across Sarasota County"
  ],


  /* ---------------------------------------------------------------------
     5. MONEY
     Written as text so you can phrase it however you like.
     --------------------------------------------------------------------- */
  rates: {
    // The range shown on the How it works page. Must match the actual rates
    // in content/sitters.js or families will notice.
    low: "22",                                               // ← FILL THIS IN
    high: "34",                                              // ← FILL THIS IN

    extraChild: "$2 an hour per additional child",           // ← FILL THIS IN
    minimumHours: "three-hour",                              // ← FILL THIS IN
    vacationMinimumHours: "Four-hour",                       // ← FILL THIS IN
    holidayPolicy: "Holidays and after midnight are time and a half.", // ← FILL THIS IN

    // How you make money. Be honest about this — it is on the FAQ page and
    // families respect a straight answer.
    businessModel: "We make our money from a small flat fee sitters pay to be listed, which is why their rate is theirs to keep." // ← FILL THIS IN
  },


  /* ---------------------------------------------------------------------
     6. YOUR POLICIES
     --------------------------------------------------------------------- */
  policies: {
    noticeWanted: "Forty-eight hours",                       // ← FILL THIS IN
    cancelFreeWindow: "more than 24 hours ahead",            // ← FILL THIS IN
    cancelChargeText: "please pay your sitter for two hours" // ← FILL THIS IN
  },


  /* ---------------------------------------------------------------------
     7. SCREENING
     CRITICAL: only list what you genuinely do for EVERY sitter. Each item here
     must also appear in each sitter's own checklist in content/sitters.js.
     Removing an item you do not actually perform is not a weakness — an honest
     short list beats an impressive one you cannot back up, legally and morally.
     --------------------------------------------------------------------- */
  screening: {
    // The company that runs your checks. Named on the screening page.
    provider: "a licensed background screening provider",    // ← FILL THIS IN

    // How long the interview runs.
    interviewLength: "around an hour",                       // ← FILL THIS IN

    // Minimum references you call.
    minReferences: "two",                                    // ← FILL THIS IN

    // Minimum experience to be listed.
    minExperience: "two years"                               // ← FILL THIS IN
  },


  /* ---------------------------------------------------------------------
     8. FORMS — READ THIS, THE SITE CANNOT RECEIVE ENQUIRIES WITHOUT IT
     GitHub Pages cannot send email by itself. You need a free form service.

     EASIEST OPTION — Web3Forms (free, unlimited, no account dashboard needed):
       1. Go to web3forms.com
       2. Type the email address where you want enquiries to arrive
       3. They email you an Access Key. Paste it below.
       4. Set provider to "web3forms"

     ALTERNATIVE — Formspree (free tier is 50 submissions a month):
       1. Sign up at formspree.io, create a form
       2. Copy the endpoint URL (looks like https://formspree.io/f/xxxxxxx)
       3. Paste it into endpoint below, set provider to "formspree"

     NOTE: this key sits in a public repository and is visible to anyone. That is
     normal and by design for these services — it only allows sending a form to
     YOUR address, it does not give access to anything. But it does mean bots may
     find it, so turn on the spam filtering your provider offers.

     Until you fill this in, forms will show the success screen without sending
     anything. Test it properly before you announce the site.
     --------------------------------------------------------------------- */
  forms: {
    provider: "platform",                                    // Built-in Worker/D1 contact handling
    accessKey: "",                                           // ← FILL THIS IN if using web3forms
    endpoint: ""                                             // ← FILL THIS IN if using formspree
  },


  /* ---------------------------------------------------------------------
     9. DOMAIN & ANALYTICS
     --------------------------------------------------------------------- */
  site: {
    // Full address of the live site, no trailing slash. Used for social sharing
    // previews and the sitemap.
    url: "https://suncoastsitters.com",                      // ← FILL THIS IN

    // Optional: Plausible analytics is cookieless, so the site stays free of
    // consent banners. Sign up at plausible.io, then put your domain here.
    // Leave "" for no analytics at all. Do NOT put Google Analytics here — it
    // sets cookies and you would then legally need a consent banner.
    plausibleDomain: ""                                      // ← FILL THIS IN (optional)
  },


  /* ---------------------------------------------------------------------
     10. SOCIAL — leave "" to hide the link
     --------------------------------------------------------------------- */
  social: {
    instagram: "",                                           // ← FILL THIS IN e.g. "https://instagram.com/suncoastsitters"
    facebook: "",                                            // ← FILL THIS IN
    googleBusiness: ""                                       // ← FILL THIS IN — your Google Business Profile link
  }
};
