# Visual QA report

**Date:** 20 Nov 2026.

**Reference:** fourseasons.com, inspected interactively on 20 Nov 2026 (see the audit).

**Build under test:** `npm run build`, served by `vite preview`. Tests ran in headless Chrome through Playwright.

## Automated checks

| Check | Result |
|---|---|
| `tsc -b` (TypeScript) | Passes, no errors |
| `oxlint src` | 0 errors. 12 warnings: fast-refresh export style and the `Date` "purity" rule in calendar code that intentionally reads the current date. Accepted. |
| `vite build` | Passes. JS 407 kB (134 kB gzip), CSS 33 kB (7.6 kB gzip). 7 WOFF2 Latin font files. |
| Horizontal overflow, all 12 routes, at 1920 / 1440 / 1024 / 768 / 390 / 375 | 0 px at every width |
| Broken images, all routes and widths | 0 |
| Content left invisible after a full scroll (`[data-reveal]` still at opacity 0) | 0 |
| Console errors and page errors | 0. The only network failures were the test sandbox blocking external hosts. |
| axe-core WCAG 2 A/AA: home, rooms, family suite, booking, contact, gallery, policies | 0 violations |
| Reduced motion (`prefers-reduced-motion: reduce`) | Nothing pinned, no hidden content, slideshow paused |
| Pinning | One pin on Rooms at ≥ 1024 px. None at 768, 390 or 375. |
| Links on the home page | 23 unique hrefs. Every internal `#route` resolves. `tel:`, `mailto:`, the Google Maps link, the socials and the policy links are all the real Sunriver addresses. |

## User journeys (Playwright)

1. **Home → Featured Rooms → room page → booking.**
   1. "Next room" moves the slider to 2 / 3.
   2. "Explore room" opens `#room-executive-river-view`.
   3. "Check rates" opens `#booking` with *River View* preselected.
   4. Calendar: picking two dates closes the picker and shows "2 nights".
   5. "Check rates" links to `sunriverresort.in/search-results/?mphb_check_in_date=…&mphb_check_out_date=…&mphb_adults=2&mphb_children=0`. This is the live MotoPress search, verified earlier to return real availability.
2. **Header CHECK RATES** opens the docked rates panel, and "Hide" closes it.
3. **Rooms page:**
   - The pinned showcase scrolls horizontally and releases at its end.
   - The filter tabs work.
   - The card mini-slider shows 2 / 4.
4. **Gallery:** the "Bathrooms" filter leaves 2 photos. The lightbox opens; ArrowRight moves to 2 / 2 and Esc closes it.
5. **Mobile, 375:**
   - MENU opens the right sheet, and "Accommodations" navigates to `#rooms`.
   - Booking opens the calendar as a bottom sheet.
   - The sticky CHECK RATES bar stays visible.
6. **Contact:** an empty submit shows 3 inline errors. A valid submit builds a `mailto:` and offers "Copy message". It never claims the message was sent.

## Side-by-side comparison with the reference (1440 × 900)

| Aspect | Reference | Sunriver before fix | Correction |
|---|---|---|---|
| Hero H1 size | about 58 px caps serif | 88 px | Capped at 76 px to stay within the brief's 70–90 px range while moving toward the reference |
| Booking dock position | top of fields at about 60% of the viewport | about 82% | Bottom padding set to `clamp(40px, 9vh, 96px)`; fields now sit at about 74% |
| Header | Black solid state, 1 px light rule, white CHECK RATES box | Matched | — |
| Nav type | Bold caps, about 13 px, .16em | 12 px, 600, .16em (Inter) | Accepted. Inter's 600 renders heavier than Helvetica's bold. |
| Section H2 | Light caps sans, about 28 px | Inter 300, 26–38 px | — |
| Featured slider | White active card, outlined ghosts, 1 / N | Matched (1 / 3) | — |
| Footer | Centred logo, italic column heads, caps links, bullet legal row | Matched | — |
| Home-hero nav | Hidden until scroll | Visible | Kept visible on purpose; Sunriver has seven pages, not product lines |

## Known differences and limits

- **Fonts:** Saol Display and Neue Helvetica are replaced by licensed open fonts. Cormorant Garamond 300 is narrower than Saol, so hero headings set slightly lighter.
- **Hero media:** a three-photo slideshow stands in for video. The two Sunriver video files exist in the media library but could not be fetched.
- **Measurements:** the reference was measured from screenshots. Computed styles were not available in the inspection browser. Durations are estimates and are labelled as such in the audit and the animation specification.
- **Mobile widths:** the reference's mobile layout was inspected at 500 px, the inspection browser's minimum width. Sunriver itself was tested at 390 and 375.
- **Photo resolution:** photos are about 1344 px captures. Swap in the 2560 px originals before launch.
