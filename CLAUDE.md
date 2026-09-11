# treehouse. events — site notes

Static site. No build step, no framework. `index.html` is ~72KB of hand-edited
HTML with inline CSS and JS at the bottom. Vercel auto-deploys `main`.
Live at treehouseevents.cliffeliz.ai.

## Read this before editing index.html

**Never disable a block by wrapping it in an HTML comment.** It has broken this
site twice. HTML comments do not nest: if the block you wrap already contains a
`<!-- ... -->`, that inner `-->` closes your wrapper and everything after it
goes live. A cancelled July 15 Hamptons event stayed on the homepage for four
months this way, with a countdown sitting at zero, and a second instance in the
Tribeca gallery was printing a literal `-->` on the page.

To hide something: delete it (git remembers), or move it behind the
`TH_NEXT_EVENT` config, or add `hidden` to the element.

## The next event lives in one place

`TH_NEXT_EVENT`, near the bottom of `index.html`. It drives the hero label, the
countdown, the full-bleed `#events` section, both scarcity lines and the signup
copy.

- To change the date: edit `iso`, `label`, `short`, `joinLine`, `dateBig`,
  `doors`, `venueN`, `venueL`, `meta`.
- To un-announce: `announced: false`. Everything falls back to an undated state.
- If `iso` is in the past, the countdown and `#events` hide themselves. A stale
  countdown should never ship again. Do not add a second hardcoded date anywhere.

Current event: Friday 17 October 2026, 75 Varick Street, Tribeca, doors 4pm,
400 guests, invite only.

## Claims on this site must be true

Sponsors read these pages and some have signed contracts against them.

- **Email list is 1,500.** Not 3,000. The Pernod Ricard agreement was written
  against a 73.8% age-21-or-older threshold on that list.
- **Capacity is 400.** April 2026 drew 390 guests from 567 replies.
- **Never offer category exclusivity, non-competes, or right of first refusal.**
  No Treehouse agreement has ever contained one. `sponsor.html` used to promise
  all three; they were removed on 11 September 2026. Do not reintroduce them.
- Do not invent reach, impression or follower figures. If a number cannot be
  sourced to an event record or a signed agreement, leave it out.

## Sponsorship packages (keep these in sync)

Presenting $15,000 (one per event) / Signature $7,500 / Bar $5,000.
Single elements: DJ $3,000, photobooth $1,700, bar team $1,500.
Product partner is in kind and available *alongside* a cash package, never
instead of one. These appear in `sponsor.html` and in the sponsorship deck;
change both together.

## Brand

Forest green `#2D4A1E` and warm cream `#E8E6DF`. Lowercase wordmark,
`treehouse.` with the full stop. No em dashes in copy. No promoter urgency
language ("last chance", "don't miss out").

## Working habits

- Branch off `main`, never commit straight to it. Vercel deploys `main` on push.
- After any change to `index.html`, open it and check: the countdown shows real
  numbers, no stray `-->` is visible, and no cancelled event is named.
- `grep -n "july\|hamptons\|2026-0" index.html` before you push.
