# Suncoast Sitters

The website. Plain HTML, CSS and JavaScript — no build step, no framework, no
`npm install`. Edit a file, save, push, done.

---

## Where everything lives

```
index.html              The pages. Only edit the marked block at the top.
check.js                Run this before publishing. Catches mistakes.
content/
  config.js             ← ALL your business details. Start here.
  sitters.js            ← Your roster. The product.
  faqs.js               ← The FAQ page.
assets/
  styles.css            Design. Colours and type are the variables at the top.
  avatars.js            The eight illustrated animal avatars.
  app.js                How it works. You should not need to touch this.
legal/                  Draft agreements and policies. READ legal/README.md.
photos/                 Favicon, social preview, and your own photos only.
robots.txt              Tells search engines to index the site.
sitemap.xml             Lists your pages for search engines.
CNAME.example           Instructions for a custom domain. Rename to use.
```

**The rule:** if you want to change a name, a rate, a phone number or a
paragraph of your story, it is in `content/`. If you are editing `app.js` to
change wording, stop and look in `content/config.js` instead.

---

## Get it online in about ten minutes

### 1. Create the repository

Sign in to github.com, click **+** top right → **New repository**, then fill the
form exactly like this:

| Field on the form | What to put | Why |
|---|---|---|
| **Owner** | Your username | |
| **Repository name** | `suncoast-sitters` | Lowercase, hyphens. It becomes part of your web address |
| **Description** | `Website for Suncoast Sitters — vetted babysitters in Sarasota, FL` | Optional, but it shows on your GitHub profile |
| **Public / Private** | **Public** | GitHub Pages is free only for public repos. See the warning below |
| **Add a README file** | **Leave unticked** | You already have a better one. Ticking it creates a conflict on your first upload |
| **Add .gitignore** | **None** | One is already included, tuned to keep sensitive files out |
| **Choose a license** | **None** | See below — do not pick one |

Then **Create repository**.

**On the licence.** GitHub's options — MIT, Apache, GPL — are all open source
licences. They grant everyone permission to copy, modify and reuse your work,
including a competitor. That is not what you want for your business's website.
Leave it as **None**: your copyright exists automatically without a licence, and a
`COPYRIGHT` file is included that states it plainly.

**On being public.** Public means anyone can read every file, and Git keeps
history forever — a file you delete in a later commit is still retrievable. So
never commit a sitter's photograph, a background report, a signed form, an ID
scan, or a spreadsheet of contact details. The `.gitignore` blocks the obvious
patterns, but it cannot stop a determined mistake. If this worries you more than
$4 a month, a private repo with Cloudflare Pages is a reasonable alternative and
works the same way.

### 2. Upload the files

Easiest, no command line:

1. On the new empty repo page click **uploading an existing file**
2. Drag in **the contents** of this folder — `index.html`, `check.js`,
   `README.md`, and the `assets`, `content` and `photos` folders. Not the
   folder itself; its contents.
3. Write "First upload" in the message box, click **Commit changes**

> The `.nojekyll` file matters and is easy to lose because it starts with a dot.
> If your file manager hides it, that is fine — create it in GitHub instead:
> **Add file → Create new file**, name it `.nojekyll`, leave it empty, commit.
> Without it GitHub ignores folders beginning with an underscore. You have none
> today, but it costs nothing to be safe.

If you prefer the command line:

```bash
cd path/to/this/folder
git init
git add .
git commit -m "First upload"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/suncoast-sitters.git
git push -u origin main
```

### 3. Turn on GitHub Pages

1. In your repo: **Settings** → **Pages** (left sidebar)
2. Under **Source** choose **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. Wait two or three minutes, then reload. GitHub shows your address:
   `https://YOUR-USERNAME.github.io/suncoast-sitters/`

That is a live website. Every push updates it within a minute or two.

### 4. Your own domain (optional, do it when ready)

Buy the domain first — Namecheap, Cloudflare and Porkbun are all fine and
roughly $12 a year. Then follow `CNAME.example`.

---

## The complete field checklist

Work down this list. Nothing here is optional except where marked.

### `content/config.js`

| Field | What to put | Notes |
|---|---|---|
| `brand.name` | Your business name | Appears everywhere |
| `brand.legalName` | Registered company name | Footer only, e.g. "Suncoast Sitters LLC" |
| `brand.tagline` | Your one promise | Most important sentence on the site |
| `brand.shortDescription` | One sentence for search results and the footer | Under 160 characters |
| `brand.city` / `region` / `state` / `stateAbbr` | Sarasota / the Suncoast / Florida / FL | Used in headings |
| `contact.email` | Where enquiries go | Use a real monitored address |
| `contact.phone` | As families should read it | e.g. "(941) 555-0142" |
| `contact.phoneLink` | Same number, dialling format | `+1` then 10 digits, nothing else |
| `contact.hours` | When you answer | e.g. "8am to 8pm, seven days" |
| `contact.responseTime` | How fast you reply | **Promise what you can keep.** Appears in four places |
| `contact.responseTimeOvernight` | Reply time for overnight enquiries | |
| `contact.address` | City is enough | Do not publish a home address |
| `founders[].name` | Both your names | |
| `founders[].role` | What each of you does | |
| `founders[].bio` | 2–3 sentences each | Say what you did before. Specifics build trust |
| `founders[].photo` | `photos/yourname.jpg` | Optional but strongly recommended |
| `originStory` | Why you started this | **Write this yourselves.** The placeholder is my invention |
| `areas` | Every area you serve | Must match `serves` in sitters.js **exactly** |
| `vacationAreas` | Keys and hotel areas | Display only, can be prose |
| `rates.low` / `rates.high` | Your actual range | Numbers only, no `$` |
| `rates.extraChild` | Extra-child policy | |
| `rates.minimumHours` | e.g. "three-hour" | |
| `rates.vacationMinimumHours` | e.g. "Four-hour" | Capitalised, starts a sentence |
| `rates.holidayPolicy` | Full sentence | |
| `rates.businessModel` | How you actually make money | Be honest. It is on the FAQ |
| `policies.noticeWanted` | e.g. "Forty-eight hours" | |
| `policies.cancelFreeWindow` | e.g. "more than 24 hours ahead" | |
| `policies.cancelChargeText` | What families owe on late cancellation | |
| `screening.provider` | Your background check company | Named on the screening page |
| `screening.interviewLength` | e.g. "around an hour" | |
| `screening.minReferences` | e.g. "two" | |
| `screening.minExperience` | e.g. "two years" | |
| `forms.provider` | `"web3forms"` or `"formspree"` | **Without this the site cannot receive enquiries** |
| `forms.accessKey` | Your Web3Forms key | If using Web3Forms |
| `forms.endpoint` | Your Formspree URL | If using Formspree |
| `site.url` | Your live address, no trailing slash | |
| `site.plausibleDomain` | Your domain, or `""` | Optional. Do **not** use Google Analytics — see below |
| `social.*` | Profile links, or `""` | Hidden when empty |

### `index.html` — the hand-edited block at the top

Seven lines: the page title, description, canonical URL, and three Open Graph
tags. **These cannot come from config.js.** Facebook, WhatsApp, iMessage and
Google read the page without running JavaScript, so a placeholder here would
show up literally when someone shares your link. Replace `suncoastsitters.com`
with your real domain in all four places.

### `content/sitters.js`

Delete all eight fictional sitters. Add yours using the template at the top of
the file. Every field is documented there.

### `photos/`

See `photos/README.md`. You need each sitter's portrait, a `favicon.png`, and a
`social-preview.jpg`.

### `robots.txt` and `sitemap.xml`

Replace `REPLACE-WITH-YOUR-DOMAIN.com` in both.

---

## Before you publish

```bash
node check.js
```

Install Node.js once from nodejs.org if you have not. This reads your content
and reports problems: an area name that does not match, a sitter who transports
children but has no driving-record line, template text left in a date field, a
photo path pointing at a file that is not there.

It also refuses to pass while the fictional example sitters are still in the
file, and it flags absolute safety language — `100% safe`, `fully vetted`,
`risk-free`, `guaranteed safe` — anywhere in your content. That last check is
not pedantry. Those exact phrases are what turns a screening process into a
legal promise you cannot keep, and they are the specific wording that has caused
trouble for other childcare platforms.

Then test by hand:

- Open `index.html` in your browser and click every page in the menu
- Filter the roster, open three profiles
- **Submit the request form and confirm the email actually arrives.** Do this
  before you tell a single person the site exists
- Check it on your phone
- Ask someone who has never seen it to find a sitter who works evenings on Siesta
  Key. Watch where they get stuck; do not help them

---

## How sitter privacy works on this site

This is a deliberate design decision, not an oversight, and `check.js` enforces it.

**Published:** first name, an illustrated animal avatar, years of experience,
certifications, areas worked, languages, capabilities, general availability, rate,
and a bio the sitter wrote and approved.

**Never published:** photographs, surnames or last initials, exact age, home
address or neighbourhood, phone, email, school or employer.

**Released privately to the family when a booking is confirmed:** full name, a
photograph if that sitter separately consented, references they can call, and
certificate copies. Plus a free call or coffee before the first sit.

The reason: most of your sitters will be women, and publishing a photograph beside
a first name, a neighbourhood and a list of free evenings creates a permanent,
searchable profile that a stranger could act on. That is the most careless thing a
service like this can do.

The trade-off is real and you should know it: a drawing is less immediately
reassuring than a face. The site handles that by explaining the policy openly on
the screening page and by promising the private release — which turns a apparent
evasion into evidence that you take care of the people who work for you. Do not
quietly remove that explanation, because without it the avatars just look shifty.

If you decide later to publish photographs after all, get a signed release from
every sitter first (`legal/sitter-photo-release.md` is written for private sharing
and would need rewriting), and talk to your attorney about Florida Statute
§540.08, which requires written consent for commercial use of a person's likeness.

## Two things you should know

### The SEO limitation

This site navigates with `#/` fragments — one HTML file showing different
pages. It is why there is no build step and why you can edit content without a
developer. The cost is that **Google will index your homepage but not individual
sitter profiles.**

For launch this is usually the right trade. Your first families will come from
your Google Business Profile, Instagram, local parent Facebook groups, schools
and pediatricians — not from organic search for "babysitter Sarasota", which
established agencies already own and which takes months to compete for.

When organic search does start to matter, that is the moment to move to the
Next.js version described in the project brief, where every sitter gets a real
indexable page. Do not do it before then.

### Cookies and consent

The site sets no cookies and includes no tracking. That is deliberate: no cookie
banner to annoy families, nothing to consent to, and a much simpler privacy
policy. **Adding Google Analytics, a Meta Pixel, or an embedded chat widget would
break that** and would legally oblige you to add a consent banner. If you want
visitor numbers, use Plausible — it is cookieless and there is a config field
for it.

---

## Still to do outside this repository

The site is not really launched without these.

1. **A Florida attorney reviews the drafts in `legal/`.** All of them are marked
   DRAFT and are written to be marked up, so this is an hour of review rather than
   hours of drafting. `legal/README.md` lists the five specific questions to ask —
   FCRA compliance, worker classification, licensing, insurance, and your screening
   claims. Do not skip this and do not put any of those documents in front of a
   sitter first.
2. **Decide where sensitive records live, and write it in
   `legal/data-handling-policy.md`.** Now that you publish almost nothing, the
   private data you hold — Social Security numbers, background reports, references
   — is your largest exposure. That blank line is the most important one in the
   project.
3. **A Google Business Profile.** For a local service business this is worth more
   than any on-site SEO. Free, twenty minutes.
4. **Set up the form provider and test it end to end.** Twice. Until
   `forms.provider` is filled in, nothing submitted through the site reaches you.
5. **Write your own origin story** in `content/config.js`. The placeholder is my
   invention and families can tell.
6. **A mandatory reporter briefing and an incident policy** for your sitters. Not
   glamorous, genuinely important. See the end of `legal/README.md`.
