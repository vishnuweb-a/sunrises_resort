import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, type Route } from '../router';
import { Img } from './ui';
import { MOTION } from '../motion';

type Panel = { photo: string; pos?: string; eyebrow: string; lines: string[]; text: string; cta?: { to: Route; label: string } };

const panels: Panel[] = [
  {
    photo: 'river-balcony', pos: '22% 55%', eyebrow: 'The Resort',
    lines: ['Where the river', 'sets the pace'],
    text: 'At Dugadda, near Lansdowne, the balconies and riverside promenade look straight onto the water as it moves over its stone bed below the wooded ridge.',
  },
  {
    photo: 'pool-mountains', pos: '50% 35%', eyebrow: 'The setting',
    lines: ['Nature, in its', 'purest form'],
    text: 'Forested hills rise on every side. Between them sits the swimming pool — fresh air, open sky and the sound of the river close by.',
  },
  {
    photo: 'grounds-gardens', pos: '50% 62%', eyebrow: 'The stay',
    lines: ['An escape worth', 'remembering'],
    text: 'Stone paths, lawns and a gazebo; comfortable modern rooms and an in-house restaurant. A peaceful place to slow down, close to nature.',
    cta: { to: 'rooms', label: 'Explore accommodations' },
  },
];

function PanelBody({ p, i }: { p: Panel; i: number }) {
  return (
    <div className="rs__copy">
      <p className="rs__eyebrow">{p.eyebrow}</p>
      <h2 className="rs__h" id={`rs-h-${i}`}>{p.lines.map((l) => <span className="ln" key={l}><span>{l}</span></span>)}</h2>
      <span className="rs__rule" aria-hidden="true" />
      <p className="rs__text">{p.text}</p>
      {p.cta && <Link to={p.cta.to} className="btn btn--line-light">{p.cta.label}</Link>}
    </div>
  );
}

/**
 * THE RESORT — signature section. A pinned stack of full-screen photographic panels:
 * each new panel rises (yPercent 100 → 0) over the previous one while the previous
 * image drifts upward more slowly and dims, creating layered depth. One scrubbed
 * timeline drives everything; ScrollTrigger releases the pin after the last panel.
 * < 768px or reduced motion: panels are ordinary stacked sections (no pin, no trap).
 */
export function ResortStack({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    const q = gsap.utils.selector(el);

    // Desktop & tablet: pinned overlapping stack
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const ps = q('.rs__panel') as HTMLElement[];
      const imgs = ps.map((p) => p.querySelector('.rs__img') as HTMLElement);
      const copies = ps.map((p) => p.querySelector('.rs__copy') as HTMLElement);
      const veils = ps.map((p) => p.querySelector('.rs__dim') as HTMLElement);

      gsap.set(ps.slice(1), { yPercent: 100 });
      gsap.set(imgs.slice(1), { yPercent: 18, scale: MOTION.resort.scaleFrom });
      gsap.set(copies.slice(1).map((c) => c.children), { y: MOTION.resort.textY, opacity: 0 });
      gsap.set(veils, { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el, start: 'top top', pin: true, scrub: MOTION.resort.scrub, anticipatePin: 1,
          end: () => '+=' + window.innerHeight * MOTION.resort.screensPerPanel * (ps.length - 1),
          invalidateOnRefresh: true,
        },
      });
      // panel 1 copy rises gently as the stack begins (controlled vertical movement)
      for (let k = 1; k < ps.length; k++) {
        const at = k - 1; // each transition occupies 1 unit of timeline time
        tl.to(ps[k], { yPercent: 0, duration: 1 }, at)                                   // incoming screen rises in front
          .to(imgs[k], { yPercent: 0, scale: 1, duration: 1 }, at)                        // incoming image: counter-drift + 1.06 → 1
          .to(imgs[k - 1], { yPercent: -MOTION.resort.parallax, duration: 1 }, at)       // previous image moves slower (depth)
          .to(copies[k - 1], { y: -80, opacity: 0.25, duration: 0.7 }, at)                // previous text yields
          .to(veils[k - 1], { opacity: 0.55, duration: 1 }, at)                           // previous screen dims behind
          .to(copies[k].children, { y: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'power2.out' }, at + 0.55); // heading reveal late in the rise
      }
      tl.to({}, { duration: 0.25 }); // brief hold on the final panel before release
    });

    // Every viewport: panel 1 entrance on approach (not scrubbed) + mobile/reduced fallbacks
    mm.add({ ok: '(prefers-reduced-motion: no-preference)', small: '(max-width: 767px)' }, (c) => {
      const { ok, small } = c.conditions as { ok: boolean; small: boolean };
      if (!ok) return;
      const first = q('.rs__panel')[0] as HTMLElement;
      gsap.from(first.querySelectorAll('.rs__copy .ln > span'), { yPercent: 100, duration: 1.1, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: first, start: 'top 60%', once: true } });
      gsap.from(first.querySelectorAll('.rs__eyebrow, .rs__rule, .rs__text'), { opacity: 0, y: 24, duration: 1, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: first, start: 'top 55%', once: true } });
      gsap.fromTo(first.querySelector('.rs__img'), { yPercent: -6 }, { yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: first, start: 'top bottom', end: 'top top', scrub: true } });
      if (small) {
        // light version: natural scroll, short reveals, ±5% image travel
        (q('.rs__panel') as HTMLElement[]).slice(1).forEach((p) => {
          gsap.fromTo(p.querySelector('.rs__img'), { yPercent: -5, scale: 1.04 }, { yPercent: 5, scale: 1, ease: 'none',
            scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
          gsap.from(p.querySelectorAll('.rs__copy > *'), { opacity: 0, y: 24, duration: 0.8, ease: 'power2.out', stagger: 0.06,
            scrollTrigger: { trigger: p, start: 'top 65%', once: true } });
        });
      }
    });

    const imgs = Array.from(el.querySelectorAll('img'));
    let n = 0;
    imgs.forEach((i) => (i.complete ? ++n : i.addEventListener('load', () => { if (++n === imgs.length) ScrollTrigger.refresh(); }, { once: true })));
    return () => mm.revert();
  }, []);

  return (
    <section className="rs" ref={root} aria-label="The Resort" id="the-resort">
      {panels.map((p, i) => (
        <article key={p.photo} className="rs__panel" style={{ zIndex: i + 1 }} aria-labelledby={`rs-h-${i}`}>
          <div className="rs__img"><Img id={p.photo} sizes="100vw" pos={p.pos} alt="" /></div>
          <div className="rs__shade" />
          <PanelBody p={p} i={i} />
          <div className="rs__dim" />
        </article>
      ))}
      {children}
    </section>
  );
}
