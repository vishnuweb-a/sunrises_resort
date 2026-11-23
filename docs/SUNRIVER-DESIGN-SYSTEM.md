# Sunriver design system

This system is derived from the Four Seasons reference (see `FOUR-SEASONS-REFERENCE-AUDIT.md`). It carries Sunriver's own identity, photography and content. Every token lives in `src/styles.css`.

## Colour

| Token | Value | Role |
|---|---|---|
| `--bg` | `#ffffff` | Editorial sections (Explore, Dining, Gallery, inner pages) |
| `--fg` | `#000000` | All text on white |
| `--bg-inv` / `--fg-inv` | `#000000` / `#ffffff` | Header (solid), intro banner, Featured Rooms, booking band, Story, footer |
| `--warm` | `#f4f2ef` | "Other accommodations" band, image placeholders |
| `--muted-surface` | `#e7e4df` | Calendar range fill, white-button hover |
| `--border` | `#c9c6c1` | Hairlines, cards, form fields |
| `--field` | `#efefef` | Booking field fill (light bar) |
| `--muted` | `#6b6b6b` | Secondary text. 5.3:1 on white, passes AA |
| `--overlay` | `rgba(0,0,0,.42)` | Cinematic image veil |

There are no accent colours. Green, river blue and stone come only from Sunriver's photographs. There are no gradients except legibility scrims over photos, no shadows, no rounded cards and no glass effects.

## Typography

| Role | Reference (unlicensed) | Used (SIL OFL, self-hosted) | Spec |
|---|---|---|---|
| Display: hero, inner-page titles, cinematic | Saol Display | **Cormorant Garamond 300** | uppercase, `clamp(46px → 76px)` hero / `clamp(40 → 84px)` XL, tracking .02–.03em, lh .96–.98 |
| Editorial: body, intros, eyebrows, footer column titles | Monotype Garamond | **EB Garamond 400 / italic** | body 18/1.6; intro 19–23/1.55 centred; eyebrow italic 18–20 |
| UI: nav, buttons, labels, specs, section H2 | Neue Helvetica | **Inter 300 / 400 / 600** | nav 12px 600 .16em caps; buttons 11.5px 600 .16em caps; caps title 13px 600 .18em; light section H2 300 26–38px .08em caps |

The scale comes from the brief (hero 70–90 → 76 max after comparison; editorial 48–64; section 36–48; room 24–32; body 15–18; labels 10–13). It was then pulled toward the reference, whose hero measured about 58 px.

All fonts are Latin-subset WOFF2 files bundled through `@fontsource`, so there are no third-party requests. `font-display: swap` comes from fontsource. Headline lines use fixed, art-directed breaks (`<Lines>`), so a late font load cannot re-wrap them.

## Layout and spacing

- **Gutter:** `clamp(20px, 4.6vw, 67px)`. The 67 px value matches the reference's left edge at 1440.
- **Content width:** 1200 px. The footer and booking summary are 900 px.
- **Section rhythm:** `clamp(72px, 9vw, 128px)`. Consecutive white sections drop the top padding.
- **Breakpoints:**
  - 1180: the nav collapses to MENU.
  - 1023: single-column editorial layouts, the swipe room carousel, and side cards hidden in Featured.
  - 767: mobile, with the sticky CHECK RATES bar, the hero "Choose your dates" field and bottom-sheet popovers.
  - 400: single-column footer.

## Components

| Component | File | Reference pattern |
|---|---|---|
| Header (utility row, emblem divider, property name + caps nav, CHECK RATES) | `Chrome.tsx` | Property-page header |
| Docked rates panel ("Hide") | `Chrome.tsx` | Property-page booking bar |
| Mobile menu (right white sheet, caps list) + sticky CHECK RATES bar | `Chrome.tsx` | Mobile header and menu |
| Booking bar: date-range calendar and room & guests popover | `Forms.tsx` | Hero booking form |
| Featured Rooms (photo background, white active card, outline ghosts, tabs, 1 / 3) | `Rooms.tsx` | Featured Properties |
| Explore carousel (centred image, peeking neighbour, caption, LEARN MORE) | `Rooms.tsx` | Explore More |
| Room card (1 px border, inline photo slider, caps title →, spec rows) | `Rooms.tsx` | Accommodations grid |
| Horizontal pinned showcase | `Rooms.tsx` | **Sunriver enhancement** |
| Gallery grid (3:2 crops, caps filter tabs) + lightbox | `Gallery.tsx` | Image-presentation principles |
| Footer (centred logo, italic column heads, caps links, rule, bullet legal row) | `Chrome.tsx` | Footer |

## Buttons and links

- **Solid buttons:** 44 px tall (40 small), 2 px radius, caps 11.5 px with .16em tracking. Black on white, white on black.
- **Hover:** a background tone shift over 300 ms. There is no movement.
- **`.link-caps`:** caps with an arrow that slides 4 px on hover.
- **`.link-under`:** caps with a 1 px underline; it dims to 60% on hover.
- **Focus:** a 2 px `currentColor` outline offset by 3 px, on every interactive element.

## Brand assets

- `sunriver-logo.png` is the original full-colour Sun River Resort Pvt. Ltd. logo. It is used in the footer.
- `sunriver-emblem-white.png` and `-black.png` are **single-colour adaptations made for this redesign**. They take the sun, river and trees from the original logo and drop the script text; the river is cut out as negative space. They let the header follow the reference's monochrome logo treatment. **The resort should approve these before launch** (see the asset inventory).
