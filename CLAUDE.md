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
(first in past events, right below the `#past-events` heading), with photos and one video in
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

## Missed connections and couples (/connections)

`connections.html` is its own page and its own tab in the main nav. "share your
content" (`/drop`) is not on the main nav for now: it sits under "past events"
(a hover and keyboard-focus sub-menu on desktop, `.nav-sub` in `index.html`,
and an indented link in the phone menu, `.mob-sub`). Eliz asked for this on
11 November 2026; ask before moving it back up. The sponsor page carries the
same nav (missed connections top-level, share your content under past
events), with a copy of the sub-menu styles inline in `sponsor.html`. Change
the nav on both pages together. The `/drop` header keeps a
two-tab switch across to missed connections (`.mc-tabs`, styled in
`connections.css`). The singles card posts to
`api/drop.js` (`action: 'connect'`) and shows in `/review` under Missed
connections.

The page describes how intros work: cards go to the team only, an intro is
made only when both people named each other, and both are messaged to confirm
first. That copy is a promise to guests. Change the process and the copy
together.

Who's met here: the homepage strip (`#met-here`) carries the dating angle,
in Eliz's words that dating apps are dead and a room of friends of friends is
better. The wider list of what has come out of the parties (couples,
engagements, business partners, new jobs, tennis partners, run clubs, book
clubs, supper clubs, friend groups) is section 04 on `/connections`. Eliz
confirmed couples, engagements, business partners, tennis partners and book
clubs on 11 November 2026; the other four were added the same day at her
direction ("add whatever you think we should list") without individual
confirmation. Ask her before adding more. She finds "engaged" as the payoff of a
dating arc cringe, so keep it as one item among many, not the headline. No
counts and no names unless confirmed. Stories come in through the "met someone
here?" form (`action: 'story'`, stored under `stories/`, read in `/review`
under Met here). To publish one, confirm with the people in it, respect their
"can we share" answer, then add it to `TH_COUPLES` in `js/couples.js`. The
story cards stay hidden while that list is empty.

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

Design pass, 11 November 2026 (Eliz's review list), lives in `rhythm.css`,
loaded after `styles.css` on the homepage and sponsor page. Bump its `?v=`
on both pages when it changes.

- Type: Bebas Neue for headlines, Inter for everything else. Playfair italic
  is a rare accent, used only for the mission line. Do not bring it back for
  body copy, descriptions or buttons.
- Color: sections rotate through forest green, near-black (`#0c0f0b`) and
  cream. Cream is the deliberate break: the mission band, "Better than the
  apps." and the list. One hot accent, orange `#FF5A1F` (`--hot`), for primary
  buttons, countdown units, rules, ticker dots and key words. On cream, orange
  text uses `--hot-deep` (`#C2410C`) so it stays readable; keep it large
  (24px, or 19px bold), since small `#C2410C` on cream is under 4.5:1. Small
  orange text on forest green also fails contrast (4.05:1): use cream there.
  Orange text is fine at any size on near-black. No lime, no gold.
- Eyebrows (`.lbl`) are plain small caps with no `//`.
- The page H1 is the brand (the hero logo). The next event title is an H2.
- The nav "past events" link goes to `#past-events`, the heading above the
  newest party. "home" goes to the top.
- The ticker lists past party names only, no dates, spelled as on the site
  ("SoHo Soirée").
- The footer shows Instagram and treehouse@tigertracks.ai. Never put a
  personal phone number on the site.
- The gallery watermark stays as is (Eliz's call, 11 November 2026).

## Working habits

- Branch off `main`, never commit straight to it. Vercel deploys `main` on push.
- After any change to `index.html`, open it and check: the countdown shows real
  numbers when an event is announced (and no next-event block shows when none
  is), no stray `-->` is visible, and no cancelled event is named.
- `grep -n "july\|hamptons\|2026-0" index.html` before you push.
- `.vercelignore` keeps internal notes and scripts (this file included) off the
  public site. Add new internal files to it.
