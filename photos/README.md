# Photos

## We do not put sitter photographs here

Sitters are shown on the site as illustrated avatars with a first name only. No
photographs, no surnames, no home neighbourhoods. That is a deliberate privacy
decision — it is written into the sitter listing agreement, and `check.js` will
fail if you add a `photo` field to a sitter.

A sitter's photograph goes **privately to the family, by email, once a booking is
confirmed**, and only if that sitter has signed the separate photo release. It is
stored with your other sensitive records, never in this folder and never in this
repository. See `legal/sitter-photo-release.md` and
`legal/data-handling-policy.md`.

**This folder is public.** Everything in it is visible to anyone on the internet,
permanently, including after you delete it — Git keeps history. Treat it that way.

## What does go here

| File | What it is | Size |
|---|---|---|
| `favicon.png` | The little icon in the browser tab | 512 × 512 |
| `social-preview.jpg` | Shown when someone shares your link on Facebook, WhatsApp or iMessage | 1200 × 630 |
| `elena.jpg`, `marcus.jpg` | Your own photos, if you choose to show your faces | 800 × 1000 |

Your own photographs are a different matter from your sitters'. It is your
business, your decision, and on a trust site your faces do real work. If you would
rather not, set an `avatar` in `content/config.js` instead.

`social-preview.jpg` matters more than people expect. Without it your link shares
as a bare grey box, which reads as abandoned. A photo of the two of you, or a clean
image with your name over it, is enough. Never use a photo of children.

## Rules for any file in here

- Lowercase names with hyphens, no spaces or accents: `elena.jpg` not `Elena 2.JPG`
- Compress before uploading — squoosh.app takes a 4MB phone photo to about 150KB
- Never a photograph of a child, yours or a client's
- Never a scan of an ID, a certificate, a background report or a reference sheet
