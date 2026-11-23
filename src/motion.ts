import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Motion tokens — see docs/ANIMATION-SPECIFICATION.md. Restraint over spectacle. */
export const MOTION = {
  // calmer, longer durations than before (Taj-like): nothing under 0.9s for reveals
  reveal: { y: 28, duration: 1.1, ease: 'power2.out', stagger: 0.1, start: 'top 85%' },
  lines: { duration: 1.25, ease: 'power3.out', stagger: 0.12, start: 'top 88%' },
  image: { scale: 1.06, duration: 1.6, ease: 'power2.out', start: 'top 85%' },
  mask: { duration: 1.4, ease: 'power3.inOut' },
  parallax: 0.08,
  resort: { scrub: 1, screensPerPanel: 1.15, parallax: 16, scaleFrom: 1.06, textY: 40 },
  hero: { image: 1.4, settle: 2.8, heading: 1.3, sub: 1.0, cta: 1.0, nav: 0.9 },
};
export const M = MOTION;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Declarative scroll reveals, opted into with data attributes:
 *  data-lines   – heading whose .ln > span lines rise out of an overflow mask
 *  data-reveal  – opacity + 24px lift, batched with an 80ms stagger
 *  data-img     – image container: picture fades in and settles from 1.06 → 1
 *  data-speed   – light parallax (fraction of section height), cinematic sections only
 * Initial states are set by JS inside the same layout effect (no flash, no-JS safe).
 */
export function useMotion(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add({ ok: '(prefers-reduced-motion: no-preference)', small: '(max-width: 767px)' }, (c) => {
      const { ok, small } = c.conditions as { ok: boolean; small: boolean };
      if (!ok) return;
      const q = gsap.utils.selector(el);

      q('[data-lines]').forEach((h) => {
        gsap.from((h as HTMLElement).querySelectorAll('.ln > span'), {
          yPercent: 100, duration: M.lines.duration, ease: M.lines.ease, stagger: M.lines.stagger,
          scrollTrigger: { trigger: h as Element, start: M.lines.start, once: true },
        });
      });

      const reveals = q('[data-reveal]');
      if (reveals.length) {
        gsap.set(reveals, { autoAlpha: 0, y: small ? 16 : M.reveal.y });
        ScrollTrigger.batch(reveals, {
          start: M.reveal.start, once: true,
          onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: M.reveal.duration, ease: M.reveal.ease, stagger: M.reveal.stagger, overwrite: true }),
        });
      }

      q('[data-img]').forEach((box) => {
        const im = (box as HTMLElement).querySelector('img');
        if (!im) return;
        const st = { trigger: box as Element, start: M.image.start, once: true };
        gsap.fromTo(box, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: M.mask.duration, ease: M.mask.ease, scrollTrigger: st });
        gsap.fromTo(im, { scale: M.image.scale + 0.04 }, { scale: 1, duration: M.image.duration + 0.4, ease: M.image.ease, scrollTrigger: st });
      });

      if (!small) q('[data-speed]').forEach((n) => {
        const s = parseFloat((n as HTMLElement).dataset.speed || String(M.parallax));
        gsap.fromTo(n, { yPercent: -s * 100 }, {
          yPercent: s * 100, ease: 'none',
          scrollTrigger: { trigger: (n as HTMLElement).closest('section') || n, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });

    const imgs = Array.from(el.querySelectorAll('img'));
    let n = 0;
    const done = () => { if (++n === imgs.length) ScrollTrigger.refresh(); };
    imgs.forEach((i) => (i.complete ? done() : i.addEventListener('load', done, { once: true })));
    return () => mm.revert();
  }, [root]);
}
