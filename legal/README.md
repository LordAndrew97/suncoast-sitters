# Legal — drafts, and what to do with them

**Everything in this folder is a draft written to be reviewed, not to be used as
is.** I am not a lawyer and this is not legal advice. These documents exist so
that when you sit down with a Florida attorney you are paying them to review and
correct real text, which takes an hour, rather than to draft from nothing, which
takes several and costs accordingly.

Do not put any of these in front of a sitter or a family until a licensed Florida
attorney has read them.

---

## What is in here

| File | Who signs it | Why it exists |
|---|---|---|
| `sitter-listing-agreement.md` | Each sitter, before listing | Independent-contractor status, what you publish, right to be unlisted |
| `background-check-disclosure.md` | Each sitter, before screening | **Federally required.** Must be a standalone document |
| `adverse-action-letters.md` | You send these | Required process if a check disqualifies someone |
| `family-terms.md` | Families, by using the site | The Terms of Service page, in editable form |
| `privacy-policy.md` | Nobody | The Privacy Policy page, in editable form |
| `data-handling-policy.md` | Internal, for the two of you | How you store and destroy sensitive records |
| `sitter-photo-release.md` | Only if a sitter opts in | Consent to share a photo privately with booked families |

The website's Privacy and Terms pages are inside `index.html`. If you change
`privacy-policy.md` or `family-terms.md`, you must copy the changes into
`index.html` as well — they are not linked automatically. Keeping the editable
copies here means your attorney can mark up a document instead of HTML.

---

## The five questions to actually ask your attorney

Walk in with these. They are the areas where a childcare referral service in
Florida gets into genuine trouble, and a general "please review my website"
brief will not surface them.

**1. FCRA compliance on background checks.**
If you obtain background checks through any screening company, that company is a
consumer reporting agency and you are subject to the federal Fair Credit
Reporting Act. In outline: the disclosure must be a **standalone document
containing nothing else** — no liability waiver, no other terms, which is the
single most litigated mistake in this area — you need written authorisation, and
if a report causes you to reject someone you must follow a two-step adverse
action process with a copy of the report and the CFPB's Summary of Rights.
Ask: is my disclosure form compliant, is my adverse action process compliant, and
does it matter that these are independent contractors rather than employees?

**2. Worker classification.**
You are treating sitters as independent contractors. That is normal for a
referral model, but it depends on facts, not labels: who sets the rate, who
controls how the work is done, whether you can discipline them, whether you
require exclusivity. Ask which of your actual practices put that classification
at risk, and what to change. Getting this wrong means back taxes and penalties.

**3. Licensing and registration.**
Ask whether a childcare referral or placement service in Sarasota County needs
any state or county registration, and confirm you are **not** inadvertently
operating as a "child care facility" or "family day care home" under Florida
Statutes chapter 402, which would trigger licensing and mandatory Level 2
screening through the state clearinghouse. Your model — introductions, care in
the family's own home, no facility — should sit outside that, but get it
confirmed in writing rather than assumed.

**4. Liability and insurance.**
Ask what your realistic exposure is if something happens during a sit, whether
your limitation-of-liability clause is enforceable in Florida, and what insurance
you need — general liability at minimum, and ask specifically about professional
liability and abuse/molestation coverage, which is a separate rider and is the
one that matters in this industry. Also ask how Florida Statute §768.096, which
gives a presumption against negligent-hiring liability where a thorough
background investigation was performed and revealed nothing disqualifying,
applies to you, and what you must document to rely on it.

**5. Your screening claims.**
Show them the "Our screening" page and the per-sitter checklists. Ask whether
anything there could be read as a warranty or guarantee of safety, and whether
your disclaimers are adequate and sufficiently prominent. The site deliberately
avoids "100% safe", "fully vetted", "risk-free" and "guaranteed" — `check.js`
enforces that — but a lawyer should confirm the overall impression is honest.

---

## What changed when you dropped photographs

Your decision to publish illustrated avatars, first names only, and no
neighbourhoods **materially reduces** some risk:

- No right-of-publicity exposure from commercial use of someone's image
  (Florida Statute §540.08 requires written consent for that)
- A much smaller volume of published personal data
- A real reduction in the safety risk you create for your sitters, which is both
  the right thing and one fewer way to be negligent

But be clear about what it does **not** do. **The risk moved, it did not
disappear.** You still collect and hold Social Security numbers, background check
reports, driving records, and reference contact details. That material is more
sensitive than anything you were going to publish, and it is now the largest
legal exposure in the business. If it leaks, is left in an unsecured Google
Drive, or is simply never deleted, that is the incident that hurts you. Read
`data-handling-policy.md` and actually follow it.

Separately: the FTC Disposal Rule requires reasonable measures to destroy
consumer report information. "We still have everyone's background checks in
Gmail from three years ago" is not that. Ask your attorney about retention.

---

## Two things I would add that you have not asked about

**A mandatory-reporter policy.** In Florida, everyone is a mandatory reporter of
suspected child abuse or neglect. Your sitters will occasionally see things in
other people's homes. Write a one-page policy telling them what to do and who to
call, train them on it, and have them acknowledge it. It protects children, it
protects the sitter, and it demonstrates you take the duty seriously.

**An incident policy.** Decide now, in writing and while calm, what happens if a
child is injured during a sit, if a sitter does not turn up, if a family reports
a serious concern, or if a parent is drunk at handover. Include who calls whom,
what gets written down, and when you remove someone from the roster pending
review. You will make far better decisions about this today than at 9pm on a
Saturday.
