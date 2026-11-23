# Sunriver Resort — Frontend Deployment Guide

Status date: 22 Nov 2026 · Verdict: **READY WITH WARNINGS** (see §23)

Every result in this document comes from commands run on this machine (Windows 11, Node 24.18.0) against the production build. Statuses: **PASS**, **FAIL**, **SKIPPED**, **NOT TESTED**.

---

## 1. Project overview and architecture

A static, client-rendered single-page site for Sunriver Resort (Dugadda, near Lansdowne). It has no backend, database, API layer or authentication.

```
index.html ─ fonts (@font-face, 2 preloads), hero image preload, meta/OG, Resort JSON-LD
  └ src/main.tsx ─ StrictMode, scrollRestoration = manual
     └ App.tsx ─ RouterProvider (router.tsx, React Context + location.hash)
        ├ Header / MobileBar / Footer (components/Chrome.tsx)
        ├ <main key={route}> ─ pages/Home.tsx, pages/Inner.tsx (11 inner routes)
        └ .curtain ─ page-transition overlay (GSAP)
  data.ts ─ all content, rooms, contact, photo metadata (single source of truth)
  motion.ts ─ GSAP + ScrollTrigger tokens and the useMotion() reveal hook
  components/Forms.tsx ─ date-range calendar, guest picker, MotoPress handoff, mailto enquiry
```

**Routing.** The 12 hash routes are `#` (home), `#rooms`, `#room-executive-hill-view`, `#room-executive-river-view`, `#room-family-suite`, `#about`, `#restaurant`, `#wellness`, `#gallery`, `#contact`, `#booking` and `#policies`.
- `Link`/`go()` calls `history.pushState` and then `setRoute`. A `popstate` listener and a `hashchange` listener both re-parse the hash. Any unknown hash renders home.
- The server only ever receives `/`, so **no SPA rewrite rule is needed** (§16).

**Booking handoff.** "Check rates" opens `https://sunriverresort.in/search-results/?mphb_check_in_date=YYYY-MM-DD&mphb_check_out_date=YYYY-MM-DD&mphb_adults=N&mphb_children=N` in a new tab. That page is the existing WordPress + MotoPress Hotel Booking install.

**Contact.** The enquiry form builds a `mailto:info@sunriverresort.in` link and offers a "Copy message" fallback. It sends nothing itself.

## 2. Tech stack (installed versions, from `npm ls`)

| Package | Version | | Package | Version |
|---|---|---|---|---|
| react / react-dom | 19.3.1 | | vite | 8.3.8 (Rolldown) |
| typescript | 7.0.2 | | @vitejs/plugin-react | 6.3.0 |
| gsap (+ ScrollTrigger) | 3.15.1 | | oxlint | 1.94.0 |
| lucide-react | 1.77.0 | | @types/node | 24.19.2 |
| **@playwright/test** (new, dev) | 1.65.1 | | **@axe-core/playwright** (new, dev) | 4.14.0 (axe-core 4.14.1) |

The site uses plain CSS (`src/styles.css`, about 43 kB). It self-hosts 3 font families in 8 WOFF2 files (SIL OFL) and serves 15 photographs, each as an 800w and a 1600w WebP.

## 3. Prerequisites

- **Node.js `^20.19.0 || >=22.12.0`.** This is Vite 8's `engines` requirement. It was verified with Node **24.18.0** and npm **11.16.0**.
- npm is the package manager (`package-lock.json`).
- E2E tests only: the Playwright browsers (about 400 MB, downloaded once).

## 4. Install

```bash
npm ci                                    # exact lockfile install
npx playwright install chromium firefox webkit   # only needed for E2E tests
```

`npm audit` after adding the test dependencies: **0 vulnerabilities**.

## 5. Local development

```bash
npm run dev       # http://localhost:5173 (StrictMode active)
```

## 6. Production build

```bash
npm run lint      # oxlint
npm run build     # tsc -b && vite build  →  dist/
npm run preview   # serves dist/ on http://localhost:4173
```

Build output (final): `dist/index.html` 4.99 kB, `dist/assets/index-*.css` 42.89 kB (9.33 kB gzip), `dist/assets/index-*.js` 411.87 kB (135.23 kB gzip). Vite copies `public/assets/**` (images, fonts, logos) unchanged to `dist/assets/**`.

The build logs 8 notices like `assets/fonts/… didn't resolve at build time, it will remain unchanged to be resolved at runtime`. **These are expected.** The `@font-face` URLs in `index.html` point at `public/` files, which resolve relative to the page at runtime. The tests check that all 8 load (§10).

## 7. Playwright configuration and commands

- Configuration lives in `playwright.config.ts` and the tests in `e2e/`.
- Three servers start automatically:
  - `vite preview` on **:4173**, the production build at `/`
  - `vite preview --base /nested/path/` on **:4174**, the same build under a sub-path
  - `vite` dev on **:5175**, used only to check StrictMode double effects
- Projects:
  - **chromium** runs everything.
  - **firefox** and **webkit** run the `@smoke`-tagged subset: the 12 direct route loads, navigation, booking, forms, assets, reduced motion and nested-path hosting.

```bash
npm run test:e2e            # build, then all 3 browsers
npm run test:e2e:chromium   # build, then Chromium only
npx playwright test e2e/booking.spec.ts --project=chromium   # one file (run `npm run build` first)
npx playwright show-trace test-results/<test>/trace.zip       # inspect a failure
```

Artifacts are git-ignored:

| Output | Location |
|---|---|
| JSON results | `test-results/results.json` |
| Failure traces | `test-results/<test>/trace.zip` |
| Screenshots | `test-artifacts/screenshots/` (39 PNGs) |
| axe reports | `test-artifacts/axe/` (24 JSON) |
| Lighthouse reports | `test-artifacts/lighthouse/` |

## 8. E2E results (final run)

Command: `npm run test:e2e`. Duration: 3.1 min with 4 workers.

| Browser | PASS | FAIL | SKIPPED | Flaky |
|---|---|---|---|---|
| Chromium (full suite) | 255 | 0 | 1 | 0 |
| Firefox (@smoke) | 36 | 0 | 0 | 0 |
| WebKit (@smoke) | 35 | 0 | 1 | 0 |
| **Total** | **326** | **0** | **2** | **0** |

Chromium tests per file:

| File | Tests |
|---|---|
| routes | 23 |
| booking | 15 |
| forms | 6 |
| mobile-nav | 5 |
| animation | 36 |
| responsive | 131 |
| assets | 7 |
| a11y | 29 |
| seo-deploy | 4 |

The 2 skipped tests:

| Test | Status | Reason |
|---|---|---|
| `og:image is an absolute URL` | SKIPPED (`test.fixme`) | A real defect that needs the production domain to fix (§15, §22). |
| WebKit: skip link is first in Tab order | SKIPPED | WebKit only Tabs to links when the user enables it (Safari: Option+Tab). Playwright WebKit on Windows can't reproduce this. Chromium and Firefox both PASS. |

The keyboard-calendar test was stress-run 20× after its fix: 20/20 PASS.

## 9. Route coverage matrix (Chromium unless noted)

| Route | Direct URL (C/F/W) | Header nav | Footer nav | Title | No console errors / 4xx | Reveals complete | Reduced motion | axe 1440 / 375 | 7 widths |
|---|---|---|---|---|---|---|---|---|---|
| `#` home | PASS/PASS/PASS | PASS | — | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#rooms` | PASS/PASS/PASS | PASS | — | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#room-executive-hill-view` | PASS/PASS/PASS | — (not in header) | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#room-executive-river-view` | PASS/PASS/PASS | — | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#room-family-suite` | PASS/PASS/PASS | — | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#about` | PASS/PASS/PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#restaurant` | PASS/PASS/PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#wellness` | PASS/PASS/PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#gallery` | PASS/PASS/PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#contact` | PASS/PASS/PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#booking` | PASS/PASS/PASS | — (menu / CTA) | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |
| `#policies` | PASS/PASS/PASS | — (menu) | PASS | PASS | PASS | PASS | PASS | PASS/PASS | PASS |

Router behaviours:

| Check | Result |
|---|---|
| Test route list matches `routes` in `src/router.tsx` (guards drift) | PASS |
| Browser back / forward (C/F/W) | PASS |
| Refresh on a non-home route | PASS |
| Rapid clicks on 5 links during the curtain transition: URL, title, `<h1>` and curtain consistent, no errors | PASS |
| `history.back()` in the middle of the curtain fade: consistent end state | PASS |
| Typed hash / `hashchange` | PASS |
| Unknown hash (`#does-not-exist`) renders home | PASS |
| Malformed hash (`#%E0%A4%A`) | PASS after fix (crashed before, §16 #1) |
| Focus moves to `<main>` after every route change | PASS |
| First load keeps focus at the top so the skip link is first | PASS after fix (§16 #6) |
| Window/document listeners and `.pin-spacer` count stable across 5 navigation cycles | PASS |
| "Discover the resort" scrolls to `#the-resort` | PASS (lands 100 px below the top because of the deliberate `html { scroll-padding-top: 100px }`) |
| `go(route, { section })` scroll-to-section API | NOT TESTED: no caller in the codebase uses `section` |

Notes on router behaviour:
- **Clicks during a transition are ignored.** A click made while the curtain is fading (about 0.3 s) does nothing. This is the `busy` guard. The end state is always consistent; only that click has no effect.
- **Unknown hashes stay in the URL.** The page renders home, but the address bar keeps the unknown hash.

## 10. Booking-system results

**MotoPress integration** (live, read-only GET on 22 Nov 2026):
- The live homepage form is `<form method="GET" action="https://sunriverresort.in/search-results/">`.
- Its fields are `mphb_check_in_date` and `mphb_check_out_date` (hidden inputs), `mphb_adults` (select 1–30) and `mphb_children` (select 0–10).
- The frontend builds exactly these parameter names.
- A GET of `…/search-results/?mphb_check_in_date=2027-01-10&mphb_check_out_date=2027-01-12&mphb_adults=2&mphb_children=0` returned "1 accommodation found from January 10, 2027 - till January 12, 2027". This confirms the `YYYY-MM-DD` format is accepted.
- No reservation was submitted.

**Not verified:**
- The full reservation flow (Reserve → checkout → payment) on MotoPress was not exercised.
- Behaviour when MotoPress settings change is untested.

**PENDING EXTERNAL VERIFICATION:** a human should complete one test booking on staging or with a cancellable rate.

| Test | Result |
|---|---|
| Past dates disabled; "Previous month" disabled on current month | PASS |
| Two-month view on desktop, one month at ≤767 px; Next/Prev navigation | PASS |
| Year-end range 31 Dec 2026 → 2 Jan 2027: popover closes, focus returns, "2 nights" | PASS |
| **Exact URL** `https://sunriverresort.in/search-results/?mphb_check_in_date=2026-12-31&mphb_check_out_date=2027-01-02&mphb_adults=2&mphb_children=0`; `target=_blank rel=noopener`; popup URL intercepted (live site stubbed in tests) | PASS |
| Leap day: 29 Feb 2028 → 1 Mar 2028 = 1 night; no 29 Feb 2027 | PASS |
| Check-out on or before check-in restarts the range; no zero- or negative-night stays | PASS |
| No booking link exists until both dates are set; "Clear dates" removes it | PASS |
| Escape and outside click close the popover; Escape returns focus | PASS |
| Keyboard: arrows move by day/week, cross beyond the visible months, skip past days; Enter selects; the grid can be re-entered with Tab | PASS after fix (§16 #3, #4, #9) |
| Timezones Asia/Kolkata, America/Los_Angeles, Pacific/Kiritimati: dates use the visitor's local calendar day, with no UTC shift | PASS |
| Guests: adults 1–12 (any room), clamped to room capacity (2 or 6); children 0–10; label and URL agree | PASS |
| Summary: "Listed rate from ₹5,000 per night — about ₹15,000" for 3 nights | PASS |
| "Email this request" mailto: subject and body carry the dates and guests | PASS |
| Room detail "Check rates" prefills the room | PASS |
| "Book" on a room card while already on `#booking` selects that room (with capacity clamp) | PASS after fix (§16 #5) |
| Mobile 375 px: calendar fits the viewport, day cells ≥ 24 px, taps produce the URL | PASS |

Known limits of the handoff (not defects in URL construction):
- **The selected room is not sent to MotoPress.** MotoPress filters by a numeric `mphb_room_type_id`, which this frontend doesn't know. The search shows all available room types.
- **"Any room" allows up to 12 adults.** MotoPress accepts up to 30.

## 11. GSAP and animation results (Chromium, 1440×900 unless noted)

| Test | Result |
|---|---|
| Scrolling through each of the 12 routes leaves no `[data-reveal]` below opacity 1, no masked `[data-lines]` line, no unfinished `[data-img]` clip-path; no console warnings | PASS (12/12) |
| Fast jump to the bottom of `#about`: content skipped over is still revealed | PASS |
| Reveals still complete after 6 consecutive route changes | PASS |
| Pinned resort stack: 1 pin, about 2.3 screens long, `.rs` fixed mid-pin, panel 2 risen, released at the end, final panel text opacity 1 | PASS |
| Horizontal rooms (≥1024 px): pins and travels the full track width | PASS |
| Resize 1440 → 600 → 1440: pin removed and restored (`gsap.matchMedia`), no hidden content | PASS |
| 375 px: no pinning; resort panels stacked and readable | PASS |
| Curtain reaches opacity > 0.9 during navigation, then lifts | PASS |
| Lightbox: fade/scale entrance, arrow keys wrap (1 → 15), Tab trapped, scroll locked, Escape restores focus and scroll | PASS |
| Lightbox touch swipe (375 px, synthetic TouchEvent) | PASS |
| Reduced motion, all 12 routes: content visible at once, no pins, curtain skipped, slideshow starts paused | PASS |
| StrictMode (dev server): 1 pin on home and on rooms, reveals complete (no duplicated effects) | PASS |
| Scroll smoothness / jank perception, real trackpad and touch momentum | NOT TESTED (needs a human on real devices) |

Animation fix: inner pages without a hero subtitle logged 2 "GSAP target not found" warnings per load (§16 #2).

## 12. Responsive results

Each of the **12 routes was tested at 320, 375, 430, 768, 1024, 1440 and 1920 px (84 tests, all PASS).**

Each test scrolls the full page and asserts the following:
- No visible text or control extends past the viewport. Known horizontal carousels and the pinned or animated image layers are excluded. `body { overflow-x: clip }` would hide overflow from `scrollWidth`, so element boxes are measured instead.
- No image is distorted.
- No content is stuck hidden.
- The navigation matches the width: burger at ≤1180 px, full nav above.
- The mobile "Check rates" bar shows below 768 px.
- Buttons are at least 24×24 px below 1024 px.

**Breakpoint edges** (8 tests, all PASS):

| Width | Expected behaviour |
|---|---|
| 399 / 401 | Footer goes from 1 to 2 columns |
| 767 / 768 | Mobile bar on / off |
| 1023 / 1024 | Booking bar 2 columns / single row |
| 1180 / 1181 | Burger on / off |

The JS breakpoints match the CSS ones: 768 for the resort stack and 1024 for the horizontal rooms.

**Mobile navigation** (5 tests, all PASS):
- The menu opens, focuses Close, navigates, closes and releases the scroll lock.
- Choosing the current page closes the menu (fixed).
- Tab stays inside the menu (fixed).
- Escape closes it and returns focus to the burger.
- The mobile bar goes to booking and is hidden there.
- The header turns solid after scrolling.

**Screenshots:** 39 are saved to `test-artifacts/screenshots/` as review artifacts.
- All 12 routes at 375 and 1440 px, full page.
- Home, booking and gallery at 320, 430, 768, 1024 and 1920 px.
- They were captured with reduced motion, so every section is in its final state.
- **There are no approved baselines, so no visual-regression comparison was performed.** A human should review them once.

Not covered:
- **Real devices, iOS Safari address-bar resizing and `100svh` behaviour: NOT TESTED.** The WebKit desktop engine is not iOS Safari.

## 13. Accessibility findings

**axe-core 4.14.1** checked WCAG 2.0/2.1 A + AA on all 12 routes at 1440 and 375 px, with reduced motion so content is final. **0 violations of any impact on all 24 scans** after the fixes.

Before the fixes, axe found:
- `label-content-name-mismatch` (serious, WCAG 2.5.3) on the date and guest buttons.
- A heading-order jump from h1 to h3 on Wellness and Booking (found by our own hierarchy test).

Both are fixed (§16 #7, #8).

| Check | Result |
|---|---|
| Skip link is first in Tab order, visible on focus, focuses `<main>` | PASS (C, F) · SKIPPED (WebKit, §8) |
| One `<main>`, header and footer; one `<h1>`; no heading level skips; every `<img>` has `alt`; every `<nav>` labelled (12 routes) | PASS |
| Visible focus ring (2 px outline) | PASS |
| Route change: focus to `<main>` plus `document.title` update | PASS |
| Popovers expose `role=dialog` and `aria-expanded` | PASS |
| Calendar keyboard operation | PASS (after fixes) |
| Lightbox and mobile menu focus trap and focus restore | PASS (menu trap added) |
| Form labels, `aria-invalid`, `role=alert` errors | PASS |

**Needs manual assistive-technology verification (NOT TESTED):**
- NVDA/JAWS (Windows), VoiceOver (macOS/iOS) and TalkBack (Android) reading of route changes. A focused `<main>` plus a title change is announced differently per screen reader.
- The calendar grid, which uses `role="grid"` with buttons, not full ARIA grid cells.
- The carousels (`aria-roledescription="carousel"`).
- Live-region announcements.

Minor, not fixed:
- **Disabled-looking "Check rates" still opens the calendar.** Before dates are chosen, the button has `aria-disabled="true"` but clicking it opens the picker, so screen readers announce it as disabled. It is a deliberate UX shortcut.
- **Validation doesn't move focus.** Errors are announced by `role=alert`, but submit doesn't move focus to the first invalid field.

## 14. Performance metrics

**Measured** with Lighthouse 12 (run via `npx`, not a project dependency):
- Playwright's Chromium against `vite preview`, on localhost.
- Default simulated throttling: mobile is a slow-4G + 4× CPU profile; desktop uses the desktop preset.
- Single runs; run-to-run variance is about ±0.3 s.
- Reports are in `test-artifacts/lighthouse/`.
- Numbers are for the **final shipped build**: the original preload restored, plus the fixes.

| Route | Form | Score | FCP | LCP | TBT | CLS | Transfer | LCP element |
|---|---|---|---|---|---|---|---|---|
| home | mobile | 78 | 2.4 s | 5.1 s | 60 ms | 0 | 835 KB | hero subtitle text |
| home | desktop | 92 | 0.5 s | 1.8 s | 0 ms | 0 | 1874 KB | hero subtitle text |
| rooms | mobile | 82 | 2.4 s | 4.4 s | 20 ms | 0 | 742 KB | hero image |
| rooms | desktop | 99 | 0.5 s | 1.0 s | 0 ms | 0 | 996 KB | hero image |
| gallery | mobile | 80 | 2.4 s | 4.7 s | 10 ms | 0 | 845 KB | hero image |
| gallery | desktop | 96 | 0.5 s | 1.4 s | 0 ms | 0 | 1730 KB | hero image |
| booking | mobile | 87 | 2.4 s | 3.6 s | 30 ms | 0 | 615 KB | hero image |
| booking | desktop | 100 | 0.5 s | 0.8 s | 0 ms | 0 | 899 KB | hero image |

(These are the "before" runs, made on a build with the same preload; the fixes don't touch loading. INP: NOT TESTED, since lab tools can't measure it reliably. TBT stays under 100 ms everywhere.)

Findings:
- **CLS is 0 on every route.** Images reserve their intrinsic size and fonts use `font-display: swap`.
- **FCP is 2.4 s on mobile on every route.** The page renders nothing until the 135 kB (gzip) JS bundle executes: React and GSAP make up most of it. Improving this would need prerendering or SSR, an architectural change that is out of scope and needs approval.
- **Home's LCP is the hero subtitle.** The finalized entrance timeline reveals it at about 1–2 s, and the hero images fade in from opacity 0, so they don't count as LCP. This is a design cost; nothing was changed.
- **Hero preload trade-off.** I measured three variants (mobile LCP, single runs):

  | Route | Original `river-balcony` (shipped) | Swap to `entrance-walkway` | No image preload |
  |---|---|---|---|
  | home | 5.1 s | 4.7 s | 5.4 s |
  | booking | 3.6 s | 4.4 s | 4.1 s |
  | gallery | 4.7 s | 5.0 s | 4.7 s |
  | rooms | 4.4 s | 4.3 s | 4.1 s |

  - A single static preload in a hash SPA favours one route over the others, and most differences sit within noise.
  - **I kept the original.** The brief asked for measurement-backed changes only.
  - If home is the dominant entry page (check analytics after launch), swapping to `entrance-walkway` is a reasonable small win for home at booking's expense.
- **Font preloading is not excessive.** 2 of 8 fonts (about 46 kB) are preloaded, and both are used above the fold (test-verified).
- **Bundle:** JS 411.9 kB raw / 135.2 kB gzip. CSS 42.9 kB / 9.3 kB.
- **Images** total about 1.8 MB at 800w and about 3.2 MB at 1600w across the set. Below-the-fold images are `loading="lazy"`, and the first hero slide is `eager` + `fetchpriority="high"` (test-verified).

## 15. SEO findings and limitations

| Item | Status |
|---|---|
| `<title>`, meta description, `lang="en-IN"`, OG title and description | PASS |
| Schema.org `Resort` JSON-LD parses (name, address 246127, geo, amenities, url `https://sunriverresort.in/`) | PASS |
| **`og:image` is relative** (`assets/hero/river-balcony-1600.webp`). Facebook, WhatsApp, LinkedIn and X require an absolute URL, so **social previews will show no image** | FAIL, kept as `test.fixme`; needs the production domain |
| `<link rel="canonical">` | Missing. Add it once the domain is known |
| `robots.txt`, `sitemap.xml` | Not present. `vite preview` answers `/robots.txt` with `index.html`; real hosts will return 404 |
| Per-route titles | Set by JavaScript (`document.title`), so browsers and JS-rendering crawlers see them |

**Hash-routing limitation (verified).** The server receives the same `index.html` for every route: one title, one description, an empty `<div id="root">`.
- Social preview bots don't run JavaScript, so every shared link previews as the home page.
- Google treats `#fragment` URLs as the same URL, so **the 12 routes are not independently indexable.** Only `/` is.
- Fixing this needs path routing plus prerendering or SSR, which is a routing change that requires approval. It was not done.

Recommendations, once the domain is known:
- Make `og:image` absolute and add `og:url`, `og:type=website` and `twitter:card=summary_large_image`.
- Add a canonical link to `/`.
- Add `public/robots.txt` (`Allow: /` plus the sitemap URL) and a one-URL `sitemap.xml`.

## 16. Static hosting configuration

No hosting provider or configuration exists in the repository (no `vercel.json`, `netlify.toml`, `_headers`, or CI). I created none, because the provider isn't chosen.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node | 22.x or 24.x |
| Install | `npm ci` |
| Rewrites | **None.** Routes are `#hash` URLs, and the server only ever serves `/index.html`. A catch-all rewrite would wrongly turn missing files (e.g. `/robots.txt`) into 200 HTML responses. |
| Sub-path hosting | Works: `base: './'`, verified by the nested-path test at `/nested/path/` (all JS, CSS, fonts and images load; home link keeps the sub-path) |

**Recommended host:** Vercel, Netlify or Cloudflare Pages all fit. Vercel suits a Vite static site with no configuration and offers instant rollback.

**Cache-Control:**
- `/assets/index-*.js` and `/assets/index-*.css` are content-hashed. Use `public, max-age=31536000, immutable`.
- `/assets/{hero,resort,rooms,restaurant,branding,fonts}/*` are **not hashed**. `public/` files keep their names. Use `public, max-age=604800` (7 days), and rename a file if its content changes.
- `/index.html`: `no-cache`.

**Security headers** (tested against the code's needs):
- GSAP writes inline `style` attributes and `index.html` has an inline `<style>` block, so `style-src 'unsafe-inline'` is required.
- The JSON-LD block is not executed, so it needs no script exception.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Example `vercel.json`, if Vercel is chosen (not committed):

```json
{
  "headers": [
    { "source": "/assets/index-(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/assets/(hero|resort|rooms|restaurant|branding|fonts)/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=604800" }] },
    { "source": "/(.*)", "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ] }
  ]
}
```

Re-run the smoke tests against the deployed URL after adding the CSP. Its effect on this app was not exercised in a browser.

### Fixes made during this audit (§16 of the brief)

Each fix was test-first: the regression test failed before the fix and passes after it.

| # | File | Defect (root cause) | Fix | Regression test |
|---|---|---|---|---|
| 1 | `src/router.tsx` | A malformed hash such as `#%E0%A4%A` threw `URIError` in `decodeURIComponent` and blanked the whole app | `try/catch` falls back to home | routes: "unknown and malformed hashes…" |
| 2 | `src/pages/Inner.tsx` | `PageHero` always tweened `.phero__extra`, which only room pages render. That logged 2 "GSAP target not found" console warnings on 8 routes | Tween it only when present | routes: "direct URL load" (no console warnings), animation: reveals on 12 routes |
| 3 | `src/components/Forms.tsx` | Arrowing past the visible months lost keyboard focus. It focused the new month's day in a `requestAnimationFrame` that could run before React rendered it | Remember the target day and focus it in an effect after the view changes | booking: "keyboard…" |
| 4 | `src/components/Forms.tsx` | Every day button had `tabIndex=-1`, so after Tabbing out of the grid it couldn't be re-entered by keyboard | Roving tabindex: one day (focused, check-in, today or first of month) is `tabIndex=0` | booking: "keyboard…" |
| 5 | `src/components/Forms.tsx` | On `#booking`, a room card's "Book" link set the router prefill, but the mounted bar read prefill only at mount. The click just scrolled to the top | `useBooking` adopts a new prefill (React's adjust-state-on-prop-change pattern) and clamps adults to the room's capacity | booking: "'Book' on a room card while already on #booking…" |
| 6 | `src/router.tsx` | `<main>` was focused on first load too, so the first Tab skipped the skip link and header | Focus `<main>` only on route changes | a11y: "skip link…"; routes: direct load asserts `<main>` not focused |
| 7 | `src/components/Forms.tsx` | Date and guest buttons were named only by their static label, not their visible value (WCAG 2.5.3, axe serious) | `aria-labelledby` = label + value; the redundant `aria-describedby` removed | a11y: axe on home and booking |
| 8 | `src/pages/Inner.tsx` | Heading jumped h1 → h3 on Wellness and Booking | Visually hidden `<h2 class="sr-only">` (no visual change) | a11y: "landmarks and heading hierarchy" |
| 9 | `src/components/Forms.tsx` | Race: after choosing check-in, a one-frame-delayed refocus could pull focus back from the next key (1/8 failures) | Skip the refocus when focus is already on a day | booking: "keyboard…" ×20 |
| 10 | `src/components/Chrome.tsx` | The mobile menu (`aria-modal`) let Tab escape into the page behind | Tab / Shift+Tab wrap inside the sheet | mobile-nav: "Escape closes… Tab stays inside" |
| 11 | `src/components/Chrome.tsx` | Tapping the current page in the mobile menu left it open with the body scroll locked, because the route didn't change | Menu links also close the menu on click | mobile-nav: "choosing the current page…" |

No visual design, colours, fonts, spacing, animation timings or the MotoPress destination were changed. `index.html` is unchanged; the preload experiment was reverted (§14).

Tooling added:
- `playwright.config.ts` and `e2e/*.spec.ts` (9 files plus `helpers.ts`)
- dev dependencies `@playwright/test` and `@axe-core/playwright`
- scripts `test:e2e` and `test:e2e:chromium`
- `.gitignore` entries for test output

## 17. Environment variables

**None.** The code doesn't use `import.meta.env`, and the bundle scan found no secrets, keys or development URLs (`localhost`, `/src/`). The only external URLs in the bundle are the MotoPress search, the room and legal pages on sunriverresort.in, Google Maps, Instagram and Facebook.

## 18. Step-by-step deployment (example: Vercel; not performed)

1. **Decide the domain first** (§22 risk 1).
2. `npm ci && npm run lint && npm run test:e2e`, all green.
3. Initialize Git, commit and push to a private repo. Nothing has been committed; this needs your permission.
4. Vercel → New Project → import the repo. Framework preset: Vite. Build: `npm run build`. Output: `dist`. Node 22 or 24.
5. Optionally add the `vercel.json` from §16.
6. Deploy to a **preview URL** and run the §20 checklist there.
7. Fix `og:image` and the canonical link for the real domain, then rebuild.
8. Promote to production and attach the domain (§19).

Any static host works the same way: upload the contents of `dist/`.

## 19. Custom domain and HTTPS

- Add the domain in the host. Point an apex `A`/`ALIAS` record or a `www` `CNAME` record to the host per its instructions.
- Keep the TTL low (300 s) during cut-over.
- HTTPS certificates are issued automatically (Let's Encrypt) by Vercel, Netlify and Cloudflare. Enforce the HTTPS redirect and add HSTS after it works.
- `mailto:` and `tel:` links work on any origin.
- The MotoPress handoff is a plain top-level link, so it has no CORS dependency.

## 20. Post-deployment checklist

- [ ] `/`, then every `#route` via a direct link, back/forward and refresh
- [ ] DevTools: no console errors, no 404s (fonts, images, `index-*.js` / `.css`)
- [ ] "Check rates" opens `https://sunriverresort.in/search-results/?mphb_check_in_date=…` with the chosen dates, and MotoPress shows the same dates and guests
- [ ] **One human end-to-end test booking** with a cancellable rate, or on MotoPress staging
- [ ] Contact "Open in email" opens a draft to info@sunriverresort.in; "Copy message" works
- [ ] iPhone Safari and Android Chrome: menu, calendar, guest picker, gallery swipe, sticky bars
- [ ] OS "Reduce motion" on: all content visible
- [ ] Social preview check (Facebook Sharing Debugger / LinkedIn Post Inspector) after the `og:image` fix
- [ ] Response headers present (CSP, HSTS, cache)
- [ ] Lighthouse on the live URL (real CDN numbers will differ from localhost)

## 21. Rollback

- **Vercel / Netlify / Cloudflare Pages:** every deploy is immutable. Use "Instant Rollback" / "Publish previous deploy" in the dashboard (Vercel: `vercel rollback`).
- **Plain static host:** keep the previous `dist/` as a dated zip and re-upload it.
- **DNS cut-over from the current WordPress site:** keep the old DNS values written down. Reverting the records restores the old site, subject to TTL.

## 22. Known issues and deployment risks

1. **Domain conflict with the booking engine (HIGH; a decision is needed before go-live).**
   - Booking, room "live" links and the Terms/Privacy links all point to **sunriverresort.in**, which today *is* the WordPress + MotoPress site.
   - If this frontend replaces WordPress at `sunriverresort.in`, `/search-results/` and the legal pages will 404 and **booking breaks.**
   - Options:
     - (a) Host this site on another domain or subdomain and keep WordPress at sunriverresort.in.
     - (b) Move WordPress to e.g. `book.sunriverresort.in` and update `liveUrl`, `rooms[].liveUrl` and `contact.legalLinks` in `src/data.ts` (code change plus re-test).
   - **Not changed**, because there is no evidence yet of the final topology.
2. **`og:image` is relative** and there is no canonical link: social previews will have no image (§15). It needs the domain.
3. **Hash routes aren't independently indexable** and all share one preview (§15). This is an architectural limitation.
4. **Live booking flow not verified end to end.** Only the search-results step was confirmed. Booking completion and payment are pending human verification.
5. **Contact form delivery depends on the visitor's email client.** If none is configured, "Open in email" does nothing visible; "Copy message" is the fallback. The README already lists a mail endpoint as "still to connect".
6. **Mobile FCP is 2.4 s and home LCP about 5 s** (simulated slow 4G), driven by client-side rendering and the finalized hero animation (§14).
7. **The selected room is not passed to MotoPress** (needs a numeric room-type id).
8. **Not tested:**
   - real iOS and Android devices
   - screen readers
   - real-network or CDN performance
   - INP
   - visual-regression baselines
   - the CSP in a browser
9. **12 pre-existing oxlint warnings** (fast-refresh exports, `Date` in render, a setState in an effect). None are errors and none affect production behaviour. They were left as they were to avoid refactoring.

## 23. Final production readiness assessment

**READY WITH WARNINGS.**

- **Build:** `tsc -b` clean, oxlint 0 errors (12 pre-existing warnings), Vite build OK.
- **Tests:** 326/326 executed E2E tests pass across Chromium, Firefox and WebKit, with 0 flaky and 2 skipped for documented reasons.
- **Accessibility:** 0 axe violations on 24 scans.
- **Animations and layout:** no hidden content on any route, width or motion setting.
- **Booking URL:** exact construction verified against the live MotoPress form fields.
- **Fixes:** all 11 defects found are fixed with regression tests.

It is not "ready" without warnings because:
- the domain topology decision (risk 1) must be made before go-live, or booking could break;
- `og:image` and the canonical link need the domain;
- the live booking completion is pending human verification.

None of these is a code defect in the current build, so the verdict is not BLOCKED.
