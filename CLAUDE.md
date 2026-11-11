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
  `doors`, `venueN`, `venueL`, `meta`, and set `rsvp` to the RSVP or ticket link.
- Every ticket and invite button carries the class `js-rsvp`. They point at the
  waitlist form (`#join`) unless an event is live and `rsvp` is set.
- To un-announce: `announced: false`. Everything falls back to an undated state.
- If `iso` is in the past, the countdown and `#events` hide themselves. A stale
  countdown should never ship again. Do not add a second hardcoded date anywhere.

The December party is announced (`announced: true`): Friday 4 December 2026,
Chelsea, 9pm, "A Very Sexy Christmas". Eliz confirmed the date, area and start
time on 11 November 2026. The street address is not public; the site says it
goes out to the list. The `#events` background carousel uses photos from the
December 2025 party, not venue photos, so swap them if a venue shoot arrives.
The nav link keeps the wording "get on the list" when an event is live.

Last event: Saturday 17 October 2026, Tribeca Rooftop. 415 tickets sold from
797 invite requests. Its section is `#tribeca-oct-2026`
(first in past events), with photos and one video in
`img/gallery/tribeca-oct-2026/`. New parties go in above it, newest first.

## Claims on this site must be true

Sponsors read these pages and some have signed contracts against them.

- **Email list is 1,500.** Not 3,000. The Pernod Ricard agreement was written
  against a 73.8% age-21-or-older threshold on that list.
- **Do not print a capacity figure.** Use sourced ticket and request counts
  instead. April 2026 drew 390 guests from 567 replies.
- **Never offer category exclusivity, non-competes, or right of first refusal.**
  No Treehouse agreement has ever contained one. `sponsor.html` used to promise
  all three; they were removed on 11 September 2026. Do not reintroduce them.
- Do not invent reach, impression or follower figures. If a number cannot be
  sourced to an event record or a signed agreement, leave it out.

## Sponsorship packages (keep these in sync)

Presenting $15,000 (one per event) / Featured $7,500 (two) / Community $5,000.
Custom packages on request. These appear in `sponsor.html` and in the December
sponsorship deck; change both together. Sponsor inquiries from the form go to
treehouse@tigertracks.ai (see `api/contact.js`).

## Past partners on sponsor.html

The brand count ("27 brands", in the stats block and under the Past Partners
heading) equals what the section shows: 17 logos plus 10 names in the
October 17 2026 row. Add or remove a brand and change both numbers with it.

The October 17 row is type, not logos, because there are no logo files for
those brands. It lists the brands that sponsored with cash or product (Sponsor
Tracker, "Oct 17 Results" tab, groups 1 and 2). Saint James Iced Tea is first
and labelled Premium Partner: that listing is owed under their agreement, so
do not remove it. Guest-perk brands (Vivrelle, Rent the Runway) are not
partners and stay off.

Any element with `data-until="<ISO date>"` hides itself once that time has
passed. The "Packages confirm by Friday, November 20" line uses it. Give every
dated line on this page a `data-until`.

## Brand

Forest green `#2D4A1E` and warm cream `#E8E6DF`. Lowercase wordmark,
`treehouse.` with the full stop. No em dashes in copy. No promoter urgency
language ("last chance", "don't miss out").

## Working habits

- Branch off `main`, never commit straight to it. Vercel deploys `main` on push.
- After any change to `index.html`, open it and check: the countdown shows real
  numbers when an event is announced (and no next-event block shows when none
  is), no stray `-->` is visible, and no cancelled event is named.
- `grep -n "july\|hamptons\|2026-0" index.html` before you push.
- `.vercelignore` keeps internal notes and scripts (this file included) off the
  public site. Add new internal files to it.
