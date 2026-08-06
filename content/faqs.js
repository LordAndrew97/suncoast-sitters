/* ============================================================================
   faqs.js — THE FAQ PAGE

   Each entry is [ "The question", "The answer" ].
   Add, remove or reorder freely. Keep the square brackets and the comma.

   Two things worth knowing:
   - Google shows FAQ answers directly in search results, so answering the
     questions people actually type ("how much does a babysitter cost in
     Sarasota") wins traffic that no amount of homepage copy will.
   - Write the awkward answers honestly. "What if the sitter and my child do not
     click" is the question every parent has and nobody's website answers.

   You can use {{phone}}, {{email}} and {{brand}} inside answers and the site
   will fill in the real values from config.js.
   ========================================================================== */

window.FAQS = [

  ["What does it cost me to use {{brand}}?",
   "Nothing. There is no membership, no subscription and no placement fee for families. You pay your sitter their hourly rate directly and we take none of it. {{businessModel}}"],

  ["How much notice do you need?",
   "{{noticeWanted}} is comfortable. We manage same-day more often than you would think, so call us if you are stuck — but Friday and Saturday evenings in high season do book out, and the roster is deliberately small."],

  ["How old are your sitters?",
   "Every sitter is eighteen or over with at least {{minExperience}} of paid childcare experience. Each profile shows their age and years of experience so you can decide what suits your family."],

  ["Will you look after a newborn?",
   "Yes. Filter the roster to Infant and you will see everyone who takes babies under one, including our sitters with specific newborn training."],

  ["What about a child with additional needs?",
   "Some of our sitters have specific training and experience, and we mark it on their profile rather than claiming it across the board. Filter for special-needs experience, then tell us the details in your request so we can be honest with you about fit. If nobody on the roster is right, we will say so."],

  ["Can a sitter drive my children?",
   "Only if their profile says they drive and transport children, and only with your written consent for each arrangement. Their driving record is checked as part of screening. Sitters who do not drive have that stated plainly on their profile."],

  ["Can my children swim while the sitter is there?",
   "With a sitter whose profile says they are confident near water, and with your written consent. Several of ours are water safety certified or lifeguards. Given how much of life here happens near a pool or the Gulf, we treat this as its own qualification rather than assuming it."],

  ["Do you do overnight care?",
   "Some sitters do. It is a yes-or-no line on every profile, and you can filter for it. Overnight rates are agreed with the sitter directly."],

  ["What if the sitter and my child do not click?",
   "Tell us. It happens and it is nobody's fault. We will suggest someone else and we do not make it awkward. The point of a small roster is that we know these people well enough to make a better second guess."],

  ["What happens if my sitter cancels?",
   "Call us on {{phone}} rather than the sitter. We will look for a replacement across the whole roster straight away. If we truly cannot cover it, you will hear that from us quickly and clearly rather than an hour before you were due to go out."],

  ["Are your sitters your employees?",
   "No. They are independent caregivers and you engage them directly. We recruit, screen, list and introduce. It is worth knowing because it means you are hiring a person, not booking a service, and the relationship is yours."],

  /* LANGUAGE-CHECK-EXEMPT-START — "guaranteed safe" below is quoted to be rejected */
  ["Do you background check every sitter?",
   "Yes, before they are listed — criminal records, sex offender registry, identity, and driving record where relevant, all run through {{screeningProvider}} with the sitter's written authorisation. Each profile shows exactly which checks were completed and in which month. We will not tell you a sitter is guaranteed safe, because no screening can promise that."]
  /* LANGUAGE-CHECK-EXEMPT-END */

];
