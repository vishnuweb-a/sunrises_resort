# Taj-inspired refinement (pass 3)

**Reference:** tajhotels.com, inspected live on 20 Nov 2026 at 1040 px and 1440 px.

## What was observed on Taj, and how Sunriver uses it

| Taj pattern [Observed] | Sunriver adaptation |
|---|---|
| A white header with gold uppercase nav, a solid gold "BOOK A STAY" box and no radius | The header is transparent over the hero and turns white on scroll. Nav links turn gold-ink when the header is solid. "Check rates" is a solid gold button, square-cornered. |
| Large light display serif in uppercase, flanked by thin rules ("— EXPLORE INDIA —") | `SectionHead`: Cormorant Garamond 300, uppercase, with gold 1 px rules. Left-aligned heads take a rule that bleeds from the margin; centred heads take rules on both sides. |
| Heading on the left, intro paragraph on the right | `SectionHead` has the same two-column variant |
| Gold text links with an underline and a chevron ("READ MORE ›") | `.link-gold` and `.link-under` |
| Round outlined gold chevron buttons on carousels | Every carousel, the calendar and the lightbox use them |
| A dark "Exclusively for You" band with a white centre card and outlined neighbours | The Featured Rooms slider keeps this pattern |
| White and ivory grounds; gold kept for accents | Ivory `#F8F6F1` and white grounds, with deep forest `#283B32` for Sunriver's own dark bands |

Not reproduced: Taj's logo, imagery, copy, offers, the floating chat bubble, and their video hero.

## Fonts

The site uses three families and eight files, all self-hosted.

- **Files:** WOFF2 in `public/assets/fonts/`, Latin subset plus ₹, under the SIL OFL. The licence files sit alongside them.
- **Declarations:** `@font-face` rules inline in `index.html`, with `font-display: swap`.
- **Preloaded:** only Cormorant Garamond 300 (the hero) and Inter 400.

| Family | Weights |
|---|---|
| Cormorant Garamond | 300, 400 |
| EB Garamond | 400, 400 italic |
| Inter | 300, 400, **500 (now included)**, 600 |

**Font check in a browser:** `document.fonts.load()` confirmed all eight faces load. No external requests were made: no Google Fonts, no CDN.

## Gold contrast

| Colour | Value | Use |
|---|---|---|
| `--gold` | `#B49868` | Rules and accents only. Measures 2.6:1 on ivory, so it is never used for small text on light grounds. |
| `--gold-ink` | `#86683D` | Small gold text and filled buttons. 4.8:1 on ivory; white text on it measures 5.2:1. |
| `--gold-soft` | `#CDB78E` | Gold text on forest and night grounds |

## The Resort: layered parallax (`src/components/Resort.tsx`)

Three full-screen panels showing real Sunriver photos: the river balcony, the pool among the hills, and the gardens.

**Desktop and tablet (≥ 768 px, motion allowed).** The section pins, and one scrubbed GSAP timeline (`scrub: 1`) drives everything. Pin length is 1.15 viewports per transition plus a short hold. For each transition:

- **Next panel:** rises from `yPercent: 100` to `0`, in front of the previous one. Stacking is explicit (`zIndex` 1–3).
- **Next panel's image:** counter-drifts from `yPercent: 18` to `0` and settles in scale from 1.06 to 1.
- **Previous panel's image:** moves `yPercent: −16`, slower than the incoming panel. This creates the depth.
- **Previous panel:** dims behind a black veil, up to 55% opacity. Its text yields: y −80, opacity 0.25.
- **Next panel's text:** reveals at 55% of the rise, moving y 40 → 0 and opacity 0 → 1 with a 0.06 stagger.

After the last panel settles, the pin releases into normal scrolling.

**Mobile (< 768 px).** Three normal full-height sections:

- No pin and no scroll trapping.
- Images travel ±5%.
- Text gets a short reveal.

**Reduced motion.** Everything is static and fully readable.

## Motion

- **Central configuration:** `MOTION` in `src/motion.ts`. Durations are longer and calmer than before.
  - Reveals: 1.1 s
  - Heading lines: 1.25 s, with a 0.12 stagger
  - Images: clip-path mask plus scale 1.10 → 1 over 1.4–2.0 s
- **Hero entrance,** in order:
  1. Image fades in
  2. Masked heading
  3. Gold rule draws
  4. Subtitle
  5. Buttons
  6. Navigation settles
  7. Booking dock
- **Buttons:** a sliding fill on hover (0.6 s), arrow nudge, and animated underlines.
- **Page transition:** an ivory fade.

The site still uses native scrolling. Lenis was not added: one scroll controller only.
