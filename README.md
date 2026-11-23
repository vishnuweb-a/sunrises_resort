# Sunriver Resort website: Four Seasons–inspired redesign

A React 19, TypeScript, Vite and GSAP ScrollTrigger website for Sunriver Resort (Dugadda, near Lansdowne). Its design and motion follow patterns observed on fourseasons.com. Every piece of content and every photograph comes from sunriverresort.in.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/ (base './', works from any folder)
npm run preview
npm run test:e2e  # build + Playwright E2E (see docs/frontend_deployment.md)
npx tsc -b && npx oxlint src
```

## Documentation (`docs/`)

| File | Contents |
|---|---|
| `FOUR-SEASONS-REFERENCE-AUDIT.md` | What was inspected, what was observed and estimated, and how each part was adapted |
| `SUNRIVER-DESIGN-SYSTEM.md` | Colour and type tokens, layout, components, brand assets |
| `ANIMATION-SPECIFICATION.md` | Every animation: trigger, from/to, timing, mobile and reduced-motion behaviour, source |
| `ASSET-INVENTORY.md` | Each image's original in the WP media library, where it is used, and gaps |
| `VISUAL-QA-REPORT.md` | Test results, user journeys, side-by-side corrections, known limits |

## Pages (hash routes, which work on any static host)

- Home: `#`
- Accommodations: `#rooms`
- Three room pages: `#room-executive-hill-view`, `#room-executive-river-view`, `#room-family-suite`
- About: `#about`
- Dining: `#restaurant`
- Wellness: `#wellness`
- Gallery: `#gallery`
- Contact: `#contact`
- Check rates: `#booking`
- Policies: `#policies`

## Booking

- The bar has a date-range calendar and a room & guests popover.
- **Check rates** opens Sunriver's existing MotoPress availability search on sunriverresort.in, with the chosen dates and guests filled in.
- No availability or payment is simulated.

## Still to connect or confirm

- A mail endpoint for the contact form. It currently hands the message to the guest's mail app.
- The 2560 px photo originals and the resort video.
- Approval of the single-colour emblem.
- Which photos belong to which executive room.

Nothing has been deployed or committed.
