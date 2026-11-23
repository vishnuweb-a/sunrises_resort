# Four Seasons reference audit

**Inspected:** 20 Nov 2026, in a live Chromium session.

**Pages and widths:**

- `fourseasons.com/` at 1440 × 900 and 500 × 900. 500 px is the browser's minimum window width, so 390 and 375 px were not inspected directly; the mobile layout seen at 500 px is the one Four Seasons serves below roughly 768 px.
- `fourseasons.com/borabora/accommodations/` at 1440 × 900.

**Method:**

- Viewport and full-page screenshots.
- The accessibility tree, for structure and labels.
- Keyboard scrolling (PageDown / End) to observe sticky and scroll states.
- Opening the mobile menu.
- Cookie preferences were saved without enabling optional cookies.

**Not captured:** computed CSS values. The inspection browser exposes no script console, so sizes are **measured from screenshots** (the screenshots were 0.96× CSS px; values below are corrected). Timings are **estimates** from observation. Every row says which kind of value it is.

**Legend**

- **[O] Observed:** seen directly in the reference.
- **[E] Estimated:** measured from screenshots, or timed by eye.
- **[P] Proposed:** a Sunriver adaptation or enhancement that is not present in the reference.

## Summary table

| Component | Observed behaviour | Typography | Duration/easing | Sunriver implementation |
|---|---|---|---|---|
| Header (top of page) | [O] Transparent over a full-bleed video hero. A utility row sits top-right in small caps (app, all hotels, sign in, language). The tree logo is top-left with no wordmark. The main nav is hidden on the home hero and appears in the sticky state. | [E] Utility row: sans, ~11 px, uppercase, tracking ~0.14 em, white. | [E] No entrance animation observed beyond the hero fade. | Transparent header over the hero. A utility row carries the phone, email and location, set in tracked caps. The monochrome Sunriver emblem stands in for the tree. The main nav is shown from the start on desktop, because Sunriver has few pages and visitors need it [P]. |
| Header (scrolled) | [O] Black bar about 92 px tall. Logo left. Nav links in bold tracked uppercase: Hotels & Resorts, Dining… A 1 px light rule under the bar. A white "CHECK RATES" box on the right with a ~3 px radius. Over light sections the bar turns translucent charcoal. | [E] Nav: ~13 px, weight 600–700, tracking ~0.16 em. CTA: ~11 px bold, tracking ~0.12 em, box 184 × 40. | [E] Instant swap at the hero boundary, no slide-in. | Same structure: black bar, 1 px rule, caps nav, white "CHECK RATES" box. Fades in over 300 ms [E-matched]. |
| Hero | [O] Full-viewport autoplay video with a dark overlay. The H1 "DISCOVER FOUR SEASONS" sits top-left under the logo in a high-contrast uppercase serif on two lines. Hero messages rotate, with a **thin white progress line** under the booking bar. A round pause button sits bottom-right. A docked booking form (Destination · Check in — Check out · Guests · CHECK RATES) has transparent fields with 1 px white borders. An icon menu sits below. Small caps "SCROLL TO DISCOVER MORE" at the bottom-left. | [E] H1: ~56 px, light, uppercase, tracking ~0.02 em, line-height ~1.0. Field labels: ~12 px bold caps. Field values: ~17 px sans. | [E] Video fades in about 0.6 s. Slides change every ~6–8 s, with the progress line filling linearly. | A still-photo slideshow of three real Sunriver photos (no authorized video was available) with the same linear progress line and a pause button. "SUNRIVER RESORT" in Cormorant Garamond 300, uppercase. A docked booking bar with outlined fields. The scroll text is copied in structure, not wording. The slow scale settle and masked heading lines are [P], kept subtle. |
| Navigation menu (mobile) | [O] A "MENU" label sits under the hamburger. The overlay is a **white panel sliding in from the right** to about 90% of the width, with a dark strip of page left visible. Sign-in and language sit in a top row with a thin X close. A rule, the tree logo, then a list of uppercase tracked links about 43 px apart. Links with sub-pages show "+". A **sticky black "CHECK RATES" bar** stays at the bottom of the screen. | [E] Links: ~13 px regular, tracking ~0.22 em. | [E] Slide about 300–400 ms, ease-out. | Matched: right-hand white panel, caps links, a thin X, the emblem, and a sticky "CHECK RATES" bar on mobile. |
| Content sections (home) | [O] The page is mostly **black**. A banner is an inset image (~1200 px wide) with left text: italic Garamond eyebrow ("Winter Travel"), bold tracked uppercase title, Garamond body, white rectangular button. "Featured Properties" has an italic eyebrow, tabs separated by bullets (the active one underlined), a centred Garamond paragraph and a "VIEW ALL … →" caps link. "Explore More" is a **white** section with a light uppercase sans H2. "The Four Seasons Story" is a black centred block with a light caps H2, Garamond body and a white button. | [E] Eyebrow: Garamond italic ~19 px. Caps title: ~16 px bold, tracking 0.2 em. Body: Garamond ~17–18 px, line-height ~1.55. Light H2: ~28 px weight 300, tracking 0.08 em. | [E] Content appears on scroll with a gentle opacity fade. No observable parallax. | Black and white rhythm: hero (black) → banner (black) → featured rooms (photo) → explore (white) → cinematic (photo) → dining (white) → gallery (white) → story (black) → footer (black). Same type roles. Opacity plus a short 24 px lift on enter [E-matched]. |
| Room/gallery interactions | [O] **Featured slider:** the active slide's photo fills the section background. The active card is white (title, photo, text, black "VIEW PROPERTY" button). Neighbouring slides are 1 px white-outlined boxes with only a caps title. Chevrons and a "1 / 9" counter sit below. **Explore carousel:** a large centred image with peeking neighbours, chevrons on the image edges, and a caption below (caps title, Garamond body, underlined "LEARN MORE"). **Accommodations page:** a two-column grid of 1 px grey-bordered cards. Each image has an inline mini-slider (a black box bottom-right with ‹ 1 / 4 ›). Titles are bold caps with →. Spec rows have small line icons. Filter links are caps with counts. A sticky booking bar has grey fields and a black "CHECK RATES" button. | [E] Card title: ~13 px bold, tracking 0.18 em. Specs: ~11 px. Counter: ~15 px bold. | [E] Slide transitions about 500–700 ms ease-in-out. The image swap is a cross-fade. | All three patterns are rebuilt for Sunriver's three rooms and its photos. A **pinned horizontal room showcase** is added on the Rooms page as a clearly labelled [P] enhancement. |
| Booking controls | [O] The date range is one field ("Check in — Check out") that opens a picker. Guests is one field ("1 Room - 2 Adults") that opens a popover. CHECK RATES stays disabled until a destination is chosen. On property pages the bar docks under the header and can be hidden ("Hide"). | [E] Labels: 12 px bold caps. Fields: 17 px. Field height ~40 px. | [E] Popover appears instantly or with a short fade. | A one-field date range with a custom two-month calendar (one month on mobile) and a guests popover with steppers and a room choice. CHECK RATES opens Sunriver's real availability search with the chosen dates. It is never faked. |
| Footer | [O] Black. A centred logo with wordmark. Four columns, each headed by a Garamond italic title with bold caps links underneath. A row of social icons and a language picker above a 1 px rule. Small legal links separated by bullets. Copyright in grey. | [E] Column titles: italic ~19 px. Links: ~11 px bold, tracking 0.16 em. | none | Same structure, with Sunriver's links, contact details, socials and policy links. |
| Route transitions | [O] Normal full page loads. There are no client-side transitions. | — | — | A short black fade between routes [P], restrained. |

## Things deliberately *not* reproduced

- Four Seasons' logo, wordmark, photography, video, copy, property names and fonts.
- **Saol Display and Neue Helvetica** are unlicensed for this project. They are replaced by Cormorant Garamond 300 (display), EB Garamond (editorial) and Inter (UI), all under the SIL Open Font License, self-hosted.
- The icon quick-menu under the hero. Sunriver has no product lines to route to, so the sub-nav is kept to its real pages.
- Destination selection. There is only one property.
- Four Seasons' horizontal overflow at 500 px: their page shows a horizontal scrollbar at that width. It is not reproduced.

## Responsive notes ([O] at 500 px)

- The hero heading is centred, two lines.
- Hero search becomes a single white field with an italic Garamond placeholder.
- The icon menu becomes a 4-column grid with hairline dividers.
- The header shows the logo, an "APP" pill and a hamburger labelled "MENU".
- A sticky bottom "CHECK RATES" bar on a white strip.
