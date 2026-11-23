# Animation specification

All motion uses GSAP 3 + ScrollTrigger. There is no Lenis and no Framer Motion: one animation system, and native scrolling.

- Tokens live in `src/motion.ts` (`M`).
- Every effect is built inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` and reverted when the component unmounts or the route changes. The reduced-motion alternative is the final state, shown immediately.
- Initial states are set in JavaScript inside the same layout effect, before the browser paints. Without JavaScript, all content is visible and there is no flash.

**Source codes:**

- **[O] Observed:** the timing and behaviour match what was seen on the reference.
- **[E] Estimated:** the timing is estimated from observation.
- **[P] Proposed:** the effect does not exist on the reference.

| Element | Trigger | From → To | Duration / ease | Delay / stagger | Scroll start / end | Pin | Mobile | Reduced motion | Source |
|---|---|---|---|---|---|---|---|---|---|
| Hero media | initial load | opacity 0 → 1 | 0.8 s power1.out | 0 | — | no | same | static | O/E (video fade) |
| Hero image settle | initial load + every slide change | scale 1.08 → 1 (load); 1.06 → 1 over the slide's life | 2.4 s power2.out; 8.2 s none | 0 | — | no | same | none | P (subtle) |
| Hero slideshow | timer, 7 s | cross-fade opacity | 1.2 s CSS ease | — | — | no | same | paused, first slide shown | O (rotating hero + progress line) |
| Hero progress line | per slide | scaleX 0 → 1 | 7 s linear | — | — | no | same | hidden progress, paused | O |
| Hero heading | initial load | lines yPercent 100 → 0 (masked) | 1.1 s power3.out | 0.3 s, stagger 0.1 | — | no | same | static | P (masked lines) |
| Hero subtitle | initial load | opacity 0, y 16 → 0 | 0.9 s power3.out | 0.7 s | — | no | same | static | E |
| Hero booking dock | initial load | opacity 0, y 16 → 0 | 0.9 s power3.out | 0.9 s | — | no | hidden (sticky bar instead) | static | E |
| Hero media drift | scroll | yPercent 0 → 8 | scrub | — | top top → bottom top | no | same | none | P (light) |
| Section headings `[data-lines]` | enters viewport | yPercent 100 → 0 per line | 1.0 s power3.out | stagger 0.08 | top 88% (once) | no | same | static | P |
| Text blocks `[data-reveal]` | enters viewport (batched) | opacity 0, y 24 → 0 | 0.9 s power2.out | stagger 0.08 | top 85% (once) | no | y 16 | static | O/E (gentle fade-in) |
| Image boxes `[data-img]` | enters viewport | opacity 0 → 1, scale 1.06 → 1 | 1.4 s power2.out | 0 | top 85% (once) | no | same | static | E |
| Cinematic image `[data-speed]` | scroll | yPercent −8 → 8 | scrub | — | top bottom → bottom top | no | **off** < 768 px | none | P |
| Header state | scrollY > 40 | transparent → #000, utility row collapses | 0.3 s ease | — | — | fixed | same | instant | O/E |
| Rates panel | CHECK RATES click | opacity 0, y −8 → 0 | 0.3 s power2.out | — | — | under header | — | instant | E |
| Mobile menu | MENU click | sheet xPercent 100 → 0; scrim opacity 0 → 1 | 0.4 s power3.out | — | — | — | — | instant | O/E |
| Featured Rooms change | tab, chevron, swipe | background opacity 0 → 1, scale 1.03 → 1; card opacity 0, y 12 → 0 | 0.7 s power2.inOut / 0.6 s power2.out | — | — | no | same (no ghost cards) | instant swap | O/E |
| Explore carousel | chevron, swipe, click a neighbour | track x → centre the slide; caption opacity | 0.7 s power2.inOut / 0.5 s CSS | — | — | no | 84 vw slides | instant | O/E |
| Room-card photo slider | chevron | image swap | instant | — | — | no | same | same | O |
| Image hover | pointer | scale 1 → 1.03 | 1.0 s CSS ease | — | — | — | n/a | none | E |
| Buttons and links | hover | background tone; arrow translateX 4 px; underline opacity | 0.3–0.4 s | — | — | — | n/a | instant | E |
| Gallery filter | tab click | items opacity 0 → 1 | 0.5 s power1.out | stagger 0.04 | — | — | same | instant | P |
| Lightbox image | open / next | opacity 0, scale 0.97 → 1 | 0.5 s power2.out | — | — | — | swipe | instant | P |
| Route transition | internal link | black overlay opacity 0 → 1, route swaps, 1 → 0 | 0.3 s power1.in / 0.45 s power1.out | 0.05 s | — | — | same | no overlay | P (the reference does full page loads) |
| **Horizontal room showcase** (Rooms page) | scroll | track x 0 → −(scrollWidth − viewport); progress scaleX | scrub 0.6 | — | top top → +distance | **pinned** | **off < 1024 px**: native swipe with scroll-snap and `overscroll-behavior-x: contain` (no trapping) | not pinned; swipe row | **P (Sunriver enhancement)** |
| Showcase panel image | scroll inside the container animation | scale 1.1 → 1 | scrub | — | left right → center center | inherits | off | none | P |
| Showcase panel text | scroll inside the container animation | opacity 0, y 20 → 0 | scrub | stagger 0.05 | left 70% → left 40% | inherits | off | static | P |

## Clean-up and safety

- Each page root is keyed by route, so `useMotion` reverts its `matchMedia` context on unmount: every tween and ScrollTrigger is killed.
- After the images on a page load, `ScrollTrigger.refresh()` runs once, so the pin distances use the real heights.
- Only `transform`, `opacity` and `clip-path` are animated. Nothing animates layout properties.
