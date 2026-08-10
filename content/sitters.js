/* ============================================================================
   sitters.js — YOUR ROSTER

   This is the product. Every sitter is one block between { and }.

   ── WHAT WE PUBLISH, AND WHAT WE NEVER PUBLISH ───────────────────────────
   PUBLISHED:  first name, an illustrated avatar, years of experience,
               certifications, the areas they work, languages, what they will
               and will not do, general availability, their rate, and a bio
               they wrote and approved themselves.

   NEVER PUBLISHED:  photographs, surnames or last initials, exact age, home
               neighbourhood or address, phone number, email, employer names,
               school names, or anything else that would let a stranger find
               this person offline.

   This is not squeamishness. Publishing a young woman's photograph next to her
   neighbourhood and her free evenings creates a real safety risk for her, and it
   is the single most common thing we could get badly wrong. The family gets the
   sitter's full details — name, photo, verifiable references — privately, once a
   booking is being confirmed. Read legal/README.md before changing this.

   If a bio mentions a specific school, employer, street or landmark near where
   the sitter lives, edit it out. Two harmless details combine into an address.
   ─────────────────────────────────────────────────────────────────────────

   TO ADD A SITTER:
     1. Copy the TEMPLATE below in full, including the braces and trailing comma
     2. Paste it just after the "window.SITTERS = [" line
     3. Fill in every field
     4. Run  node check.js
     5. Save, open index.html to check, then push

   TO REMOVE A SITTER:
     Delete their whole block, or set  listed: false  to hide them temporarily
     without losing their details. A sitter who asks to be unlisted must be
     unlisted the same day — you promised that in the listing agreement.

   FIELD RULES:
     - Text goes in "quotes". Numbers do not.
     - slug must be unique, lowercase, hyphens only, no spaces or accents.
       It becomes their web address: yoursite.com/#/sitters/maria
       Use the first name alone. Do not put a surname in the slug.
     - avatar: one of heron, pelican, manatee, turtle, dolphin, flamingo,
       crab, owl. See assets/avatars.js. Give everyone their own where you can.
     - ages / langs / serves are lists. Keep the square brackets and commas.
     - caps values are 1 for yes and 0 for no. Every one must be answered.
     - avail is a grid: 4 rows (Morning, Afternoon, Evening, Overnight),
       7 numbers per row (Mon Tue Wed Thu Fri Sat Sun). 1 = available.
     - tint is 0-3 and just picks the avatar's background colour.

   ── TEMPLATE ─────────────────────────────────────────────────────────────
   {
     listed: true,
     slug: "firstname",
     first: "Firstname", years: 0, rate: 0, min: 3, tint: 0,
     avatar: "heron",
     serves: ["Area one", "Area two"],
     ages: ["Infant", "Toddler", "Preschool", "School-age", "Tween"],
     langs: ["English"],
     hook: "One sentence in their own voice. This is what families read first.",
     bio: "Two or three paragraphs, first person, in their actual voice.\n\nSeparate paragraphs with \\n\\n exactly as written here.\n\nLet personality through — with no photograph, the writing is doing all the work. Check it names no school, employer or street.",
     certs: [
       { n: "CPR & First Aid", e: "Expires 00/0000" }
     ],
     caps: { drives:0, transport:0, pets:0, water:0, meals:0, homework:0, overnight:0, multiples:0, specialNeeds:0 },
     avail: [
       [0,0,0,0,0,0,0],
       [0,0,0,0,0,0,0],
       [0,0,0,0,0,0,0],
       [0,0,0,0,0,0,0]
     ],
     screening: [
       { n: "In-person interview",         v: "Completed Month Year" },
       { n: "Reference checks",            v: "0 references called, Month Year" },
       { n: "Criminal background check",   v: "Multi-state and county, Month Year" },
       { n: "Sex offender registry",       v: "National search, Month Year" },
       { n: "Identity verification",       v: "Photo ID and SSN, Month Year" },
       { n: "Driving record",              v: "Clean, Month Year" },
       { n: "CPR & first aid certificate", v: "Seen, expires 00/0000" }
     ]
   },
   ─────────────────────────────────────────────────────────────────────────

   IF A CHECK DOES NOT APPLY, say so openly instead of deleting the line.
   Use na instead of v, and give the reason:

       { n: "Driving record", na: "Not applicable — she does not drive and will not transport children" },

   That honesty is your competitive advantage. Do not quietly drop lines.

   THE EIGHT SITTERS BELOW ARE FICTIONAL EXAMPLES. Delete them all before you
   go live, or you will be advertising people who do not exist.
   ========================================================================== */

window.SITTERS = [
  {
    listed: true,
    slug: "maria",
    first: "Maria", years: 12, rate: 26, min: 3, tint: 0,
    avatar: "heron",
    serves: ["Gulf Gate", "Sarasota", "Palmer Ranch", "Siesta Key"],
    ages: ["Infant", "Toddler", "Preschool", "School-age"],
    langs: ["English", "Spanish"],
    hook: "I have three of my own, so very little surprises me anymore.",
    bio: "I have been looking after other people's children since before I had my own, and now I have three of my own. What that gives you is someone who has already seen the tantrum, the fever at 9pm, the refusal to eat anything that is not beige, and does not panic about any of it.\n\nI work mostly evenings and weekends around my own family. I am happiest with the little ones; I will happily sit on the floor for two hours building the same tower. I cook, so if you would like me to make dinner rather than reheat something, just ask.\n\nI am local, and my Spanish is native, so if you would like your children hearing it at home, that comes free.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 07/2027" },
      { n: "Water Safety", e: "Expires 04/2027" }
    ],
    caps: { drives:1, transport:1, pets:1, water:1, meals:1, homework:1, overnight:0, multiples:1, specialNeeds:0 },
    avail: [
      [0,0,1,0,0,1,1],
      [0,0,1,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed March 2026" },
      { n: "Reference checks",            v: "3 references called, March 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, March 2026" },
      { n: "Sex offender registry",       v: "National search, March 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, March 2026" },
      { n: "Driving record",              v: "Clean, March 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 07/2027" }
    ]
  },
  {
    listed: true,
    slug: "rosa",
    first: "Rosa", years: 20, rate: 34, min: 3, tint: 2,
    avatar: "pelican",
    serves: ["Longboat Key", "Lido Key", "Bird Key", "Sarasota", "Anna Maria Island"],
    ages: ["Infant", "Toddler", "Preschool", "School-age", "Tween"],
    langs: ["English", "Spanish"],
    hook: "Twenty years, four families, and I still get invited to the graduations.",
    bio: "I have been a nanny and a sitter in this area for twenty years. Four families in that time, the longest for nine years, and I am still on the guest list for birthdays and graduations — which is the only reference that really matters.\n\nI am comfortable with anything from a newborn to a fifteen-year-old who would rather I were not there. I do overnights and I do the difficult stretches: the week a parent is travelling, the first nights home with a new baby, the bad flu.\n\nI work a lot with visiting families staying on Longboat and Lido. I know which restaurants will take a toddler at seven o'clock and which beaches are calm enough for a child who cannot really swim.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 08/2027" },
      { n: "Water Safety", e: "Expires 02/2027" }
    ],
    caps: { drives:1, transport:1, pets:1, water:1, meals:1, homework:1, overnight:1, multiples:1, specialNeeds:1 },
    avail: [
      [1,1,1,1,1,0,0],
      [1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed January 2026" },
      { n: "Reference checks",            v: "4 references called, January 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, January 2026" },
      { n: "Sex offender registry",       v: "National search, January 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, January 2026" },
      { n: "Driving record",              v: "Clean, January 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 08/2027" }
    ]
  },
  {
    listed: true,
    slug: "aleksandra",
    first: "Aleksandra", years: 15, rate: 32, min: 4, tint: 1,
    avatar: "manatee",
    serves: ["Lakewood Ranch", "Bradenton", "Sarasota"],
    ages: ["Infant", "Toddler", "Preschool"],
    langs: ["English", "Polish"],
    hook: "Fifteen years with newborns. I sleep when they sleep, and I know when they will not.",
    bio: "I am a newborn care specialist, which in practice means I am the person families call in the first twelve weeks when nobody has slept and everything feels enormous.\n\nI do overnights, I help establish a routine without being rigid about it, and I support breastfeeding without having an opinion about how you feed your baby. I have done this for fifteen years and roughly forty families, including twins three times.\n\nI take on daytime toddler care too, but newborns are where I am genuinely good. If your baby is under six months and you are struggling, I am probably the right person on this list.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 11/2026" },
      { n: "Newborn Care Specialist", e: "Verified" },
      { n: "Infant sleep training", e: "Verified" }
    ],
    caps: { drives:1, transport:1, pets:0, water:0, meals:1, homework:0, overnight:1, multiples:1, specialNeeds:0 },
    avail: [
      [1,1,1,1,1,0,0],
      [1,1,1,1,1,0,0],
      [1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed February 2026" },
      { n: "Reference checks",            v: "3 references called, February 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, February 2026" },
      { n: "Sex offender registry",       v: "National search, February 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, February 2026" },
      { n: "Driving record",              v: "Clean, February 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 11/2026" }
    ]
  },
  {
    listed: true,
    slug: "nia",
    first: "Nia", years: 10, rate: 30, min: 3, tint: 3,
    avatar: "turtle",
    serves: ["Bradenton", "Lakewood Ranch", "Sarasota"],
    ages: ["School-age", "Tween"],
    langs: ["English"],
    hook: "I taught fourth grade for eight years. Homework gets done on my watch.",
    bio: "I taught elementary school for eight years and now I sit and tutor in the afternoons and evenings. If you have a child who fights homework, or who is behind in reading and it is starting to worry you, that is the specific thing I am good at.\n\nI have training in supporting children with ADHD and autism, and I have worked with a number of families where an afternoon needs more structure than a babysitter usually brings.\n\nI am not the right sitter for a newborn — I will be honest about that. Give me a seven-year-old and a maths worksheet and we will be fine.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 09/2026" },
      { n: "B.S. Elementary Education", e: "Verified" },
      { n: "Special needs support training", e: "Verified" }
    ],
    caps: { drives:1, transport:1, pets:1, water:0, meals:1, homework:1, overnight:0, multiples:1, specialNeeds:1 },
    avail: [
      [0,0,0,0,0,1,0],
      [1,1,1,1,1,1,0],
      [1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed April 2026" },
      { n: "Reference checks",            v: "2 references called, April 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, April 2026" },
      { n: "Sex offender registry",       v: "National search, April 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, April 2026" },
      { n: "Driving record",              v: "Clean, April 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 09/2026" }
    ]
  },
  {
    listed: true,
    slug: "devon",
    first: "Devon", years: 6, rate: 24, min: 3, tint: 1,
    avatar: "dolphin",
    serves: ["Sarasota", "Gulf Gate", "Bird Key", "Lido Key"],
    ages: ["Toddler", "Preschool", "School-age", "Tween"],
    langs: ["English"],
    hook: "Former camp counsellor. I will absolutely lose a board game on purpose.",
    bio: "Six years of summer camps and after-school programmes before I moved to Sarasota, which means I am very hard to tire out and I have an unreasonable number of games in my bag.\n\nI am best with the four-to-eleven range — the age where a sitter who will actually play makes the difference between a fine evening and a great one. I am a certified lifeguard, so pool and beach time is genuinely no problem if you are happy with it.\n\nI work weekday evenings and most weekends. I am up for the chaotic sits: three kids, two of them someone else's, everyone overtired.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 03/2027" },
      { n: "Lifeguard certification", e: "Expires 05/2027" }
    ],
    caps: { drives:1, transport:1, pets:1, water:1, meals:1, homework:1, overnight:0, multiples:1, specialNeeds:0 },
    avail: [
      [0,0,0,0,0,1,1],
      [0,0,0,0,1,1,1],
      [1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed March 2026" },
      { n: "Reference checks",            v: "2 references called, March 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, March 2026" },
      { n: "Sex offender registry",       v: "National search, March 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, March 2026" },
      { n: "Driving record",              v: "Clean, March 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 03/2027" }
    ]
  },
  {
    listed: true,
    slug: "tomas",
    first: "Tomás", years: 7, rate: 25, min: 3, tint: 0,
    avatar: "flamingo",
    serves: ["Venice", "Nokomis", "Osprey", "Sarasota"],
    ages: ["Toddler", "Preschool", "School-age", "Tween"],
    langs: ["English", "Spanish"],
    hook: "Two rescue dogs at home. Your pets and I will get along.",
    bio: "I have been sitting for families in the south of the county for seven years, mostly regulars — the same four families booking me most weeks, which I take as the compliment it is.\n\nI am practical rather than theatrical: dinner gets made, homework gets done, teeth get brushed, and the house is tidier when you get back than when you left. I have two rescue dogs, so a house with animals is my normal.\n\nWeekday afternoons and evenings, and Saturdays. I can pick up from school or activities with your written consent.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 01/2027" }
    ],
    caps: { drives:1, transport:1, pets:1, water:0, meals:1, homework:1, overnight:0, multiples:1, specialNeeds:0 },
    avail: [
      [0,0,0,0,0,1,0],
      [1,1,1,1,1,1,0],
      [1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed May 2026" },
      { n: "Reference checks",            v: "2 references called, May 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, May 2026" },
      { n: "Sex offender registry",       v: "National search, May 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, May 2026" },
      { n: "Driving record",              v: "Clean, May 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 01/2027" }
    ]
  },
  {
    listed: true,
    slug: "jasmine",
    first: "Jasmine", years: 4, rate: 22, min: 2, tint: 3,
    avatar: "crab",
    serves: ["Siesta Key", "Sarasota", "Lido Key"],
    ages: ["Preschool", "School-age"],
    langs: ["English", "French"],
    hook: "I grew up on Siesta and I know every shell on that beach.",
    bio: "I have been babysitting on the barrier islands for four years, mostly for visiting families and a handful of locals.\n\nI am a water safety instructor, so beach and pool afternoons are what families book me for. I know which stretches of Siesta and Crescent are calm, where the drop-off is, and how to keep four kids in sight at once.\n\nI do not drive, so I work the areas listed above and nowhere further. I take shorter sits than most — two hours is fine by me.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 05/2027" },
      { n: "Water Safety Instructor", e: "Expires 06/2027" }
    ],
    caps: { drives:0, transport:0, pets:1, water:1, meals:0, homework:1, overnight:0, multiples:1, specialNeeds:0 },
    avail: [
      [1,1,0,1,1,1,1],
      [1,1,0,1,1,1,1],
      [0,0,0,1,1,1,1],
      [0,0,0,0,0,0,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed April 2026" },
      { n: "Reference checks",            v: "2 references called, April 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, April 2026" },
      { n: "Sex offender registry",       v: "National search, April 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, April 2026" },
      { n: "Driving record",              na: "Not applicable — she does not drive and will not transport children" },
      { n: "CPR & first aid certificate", v: "Seen, expires 05/2027" }
    ]
  },
  {
    listed: true,
    slug: "grace",
    first: "Grace", years: 5, rate: 23, min: 3, tint: 2,
    avatar: "owl",
    serves: ["Palmer Ranch", "Gulf Gate", "Sarasota", "Osprey"],
    ages: ["Infant", "Toddler", "Preschool"],
    langs: ["English", "ASL (basic)"],
    hook: "Nursing student. Calm is my default setting.",
    bio: "I am a final-year nursing student and I sit around my clinical rotations, which are mostly mornings.\n\nFive years with babies and toddlers, including two families with a child who had significant medical needs. I am the sitter people book when they are anxious — I do not get flustered, I write everything down, and I will text you as much or as little as you want.\n\nAfternoons and evenings during term, more availability over the summer. I have basic ASL, which has been useful more often than I expected.",
    certs: [
      { n: "CPR & First Aid", e: "Expires 06/2027" },
      { n: "Basic Life Support (BLS)", e: "Expires 06/2027" }
    ],
    caps: { drives:1, transport:1, pets:1, water:0, meals:1, homework:1, overnight:0, multiples:0, specialNeeds:1 },
    avail: [
      [0,0,0,0,0,1,1],
      [1,0,1,0,1,1,1],
      [1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0]
    ],
    screening: [
      { n: "In-person interview",         v: "Completed May 2026" },
      { n: "Reference checks",            v: "2 references called, May 2026" },
      { n: "Criminal background check",   v: "Multi-state and county, May 2026" },
      { n: "Sex offender registry",       v: "National search, May 2026" },
      { n: "Identity verification",       v: "Photo ID and SSN, May 2026" },
      { n: "Driving record",              v: "Clean, May 2026" },
      { n: "CPR & first aid certificate", v: "Seen, expires 06/2027" }
    ]
  }
];
