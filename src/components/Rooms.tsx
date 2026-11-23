import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { inr, photos, rooms, type Room } from '../data';
import { Link, type Route } from '../router';
import { reducedMotion } from '../motion';
import { Icon, Img, SectionHead } from './ui';

const go = (r: Room) => r.route as Route;

/* ------------------------------------------------------------------------
 * Featured rooms slider — reference: Four Seasons "Featured Properties".
 * Active slide's photo fills the background; active card is white; side
 * cards are 1px outlines with caps titles; tabs + "1 / 3" counter control it.
 * --------------------------------------------------------------------- */
export function FeaturedRooms() {
  const [i, setI] = useState(0);
  const bg = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const n = rooms.length;
  const to = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (reducedMotion()) return;
    if (bg.current) gsap.fromTo(bg.current.querySelectorAll('img')[i], { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.inOut' });
    if (card.current) gsap.fromTo(card.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
  }, [i]);

  const r = rooms[i];
  const side = (d: number) => rooms[((i + d) % n + n) % n];
  // swipe
  const x0 = useRef<number | null>(null);
  return (
    <section className="feat" aria-labelledby="feat-h" aria-roledescription="carousel"
      onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (x0.current == null) return; const dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 50) to(i + (dx < 0 ? 1 : -1)); x0.current = null; }}>
      <div className="feat__bg" ref={bg} aria-hidden="true">
        {rooms.map((x, k) => <Img key={x.slug} id={x.photos[1] ?? x.photos[0]} sizes="100vw" alt="" className={k === i ? 'is-on' : ''} />)}
      </div>
      <div className="feat__head">
        <SectionHead id="feat-h" eyebrow="Accommodation" lines={['Rooms & suites']} center light />
        <div className="tabs tabs--light" role="tablist" aria-label="Room types" data-reveal>
          {rooms.map((x, k) => (
            <button key={x.slug} role="tab" aria-selected={k === i} className="tabs__btn" onClick={() => to(k)}>{x.short}</button>
          ))}
        </div>
        <p className="feat__intro body-serif" data-reveal>Two executive rooms and a family suite, each turned toward the hills or the river.</p>
        <Link to="rooms" className="link-caps link-caps--light" >View all accommodations {Icon.arrow}</Link>
      </div>
      <div className="feat__stage">
        <button className="feat__ghost feat__ghost--l" onClick={() => to(i - 1)} tabIndex={-1} aria-hidden="true"><span>{side(-1).name}</span></button>
        <article className="feat__card" ref={card} role="tabpanel" aria-label={`${i + 1} of ${n}: ${r.name}`}>
          <h3 className="caps-title">{r.name}</h3>
          <div className="feat__img"><Img id={r.photos[0]} sizes="(min-width: 1024px) 420px, 80vw" /></div>
          <p className="body-serif">{r.lead}</p>
          <p className="feat__meta">Up to {r.adults} adults · from {inr(r.from)} / night</p>
          <div className="feat__ctas">
            <Link to={go(r)} className="btn btn--black">Explore room</Link>
            <Link to="booking" prefill={{ room: r.slug }} className="link-caps">Book</Link>
          </div>
        </article>
        <button className="feat__ghost feat__ghost--r" onClick={() => to(i + 1)} tabIndex={-1} aria-hidden="true"><span>{side(1).name}</span></button>
      </div>
      <div className="counter counter--light">
        <button onClick={() => to(i - 1)} aria-label="Previous room">{Icon.prev}</button>
        <span aria-live="polite">{i + 1} / {n}</span>
        <button onClick={() => to(i + 1)} aria-label="Next room">{Icon.next}</button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
 * Explore carousel — reference: "Explore More with Four Seasons".
 * Large centred image with peeking neighbours, chevrons on the image edges,
 * caption below (caps title, serif body, underlined LEARN MORE).
 * --------------------------------------------------------------------- */
export type Story = { photo: string; title: string; text: string; to: Route; cta: string; pos?: string };
export function Explore({ items, title }: { items: Story[]; title?: ReactNode }) {
  const [i, setI] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const n = items.length;
  const to = (k: number) => setI(((k % n) + n) % n);
  useLayoutEffect(() => {
    const t = track.current; if (!t) return;
    const slide = t.children[i] as HTMLElement;
    const x = -(slide.offsetLeft - (t.parentElement!.clientWidth - slide.clientWidth) / 2);
    if (reducedMotion()) gsap.set(t, { x }); else gsap.to(t, { x, duration: 0.7, ease: 'power2.inOut' });
  }, [i]);
  useEffect(() => {
    const re = () => { const t = track.current; if (!t) return; const s = t.children[i] as HTMLElement; gsap.set(t, { x: -(s.offsetLeft - (t.parentElement!.clientWidth - s.clientWidth) / 2) }); };
    addEventListener('resize', re); return () => removeEventListener('resize', re);
  }, [i]);
  const x0 = useRef<number | null>(null);
  return (
    <section className="explore" aria-label="Explore Sunriver" aria-roledescription="carousel">
      {title && <h2 className="display center-t" data-reveal>{title}</h2>}
      <div className="explore__view" onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
        onTouchEnd={(e) => { if (x0.current == null) return; const dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 50) to(i + (dx < 0 ? 1 : -1)); x0.current = null; }}>
        <div className="explore__track" ref={track}>
          {items.map((s, k) => (
            <figure key={s.title} className={'explore__slide' + (k === i ? ' is-on' : '')} aria-hidden={k !== i} onClick={() => k !== i && to(k)}>
              <div className="explore__img"><Img id={s.photo} sizes="(min-width: 1024px) 66vw, 86vw" pos={s.pos} /></div>
              <figcaption className="explore__cap">
                <h3 className="caps-title">{s.title}</h3>
                <p className="body-serif">{s.text}</p>
                <Link to={s.to} className="link-under">{s.cta}</Link>
              </figcaption>
            </figure>
          ))}
        </div>
        <button className="explore__nav explore__nav--prev" onClick={() => to(i - 1)} aria-label="Previous story">{Icon.prev}</button>
        <button className="explore__nav explore__nav--next" onClick={() => to(i + 1)} aria-label="Next story">{Icon.next}</button>
      </div>
      <p className="sr-only" aria-live="polite">{i + 1} of {n}: {items[i].title}</p>
    </section>
  );
}

/* ------------------------------------------------------------------------
 * Room card with inline mini-slider — reference: property Accommodations grid.
 * --------------------------------------------------------------------- */
export function RoomCard({ r }: { r: Room }) {
  const [k, setK] = useState(0);
  const n = r.photos.length;
  const p = photos.find((x) => x.id === r.photos[k]);
  return (
    <article className="rcard" data-reveal>
      <div className="rcard__media">
        <Link to={go(r)} aria-label={`${r.name} — details`} className="rcard__imglink"><Img id={r.photos[k]} sizes="(min-width: 1024px) 45vw, 100vw" alt={p?.alt} /></Link>
        <div className="rcard__ctl">
          <button onClick={() => setK((k - 1 + n) % n)} aria-label={`Previous photo of ${r.name}`}>{Icon.prev}</button>
          <span>{k + 1} / {n}</span>
          <button onClick={() => setK((k + 1) % n)} aria-label={`Next photo of ${r.name}`}>{Icon.next}</button>
        </div>
      </div>
      <div className="rcard__body">
        <h3 className="caps-title"><Link to={go(r)}>{r.name}<span aria-hidden="true">{Icon.arrow}</span></Link></h3>
        <ul className="specs">
          <li>{Icon.bed}{r.bed}</li>
          <li>{Icon.view}{r.view}</li>
          <li>{Icon.users}Up to {r.adults} adults</li>
        </ul>
        <div className="rcard__foot">
          <p className="rate"><span>From</span> {inr(r.from)} <span>/ night</span></p>
          <Link to="booking" prefill={{ room: r.slug }} className="btn btn--black btn--sm">Book</Link>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------------
 * Pinned horizontal showcase — SUNRIVER ENHANCEMENT (not on the reference).
 * Desktop ≥1024px + motion allowed: vertical scroll drives horizontal travel.
 * Otherwise: native swipe with scroll-snap, no pinning, no scroll trapping.
 * --------------------------------------------------------------------- */
export function HorizontalRooms() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const t = track.current!, s = sec.current!;
      const dist = () => t.scrollWidth - window.innerWidth;
      const move = gsap.to(t, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: s, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (st) => gsap.set(bar.current, { scaleX: st.progress }) },
      });
      t.querySelectorAll<HTMLElement>('.hroom').forEach((p) => {
        gsap.fromTo(p.querySelector('img'), { scale: 1.1 }, { scale: 1, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: move, start: 'left right', end: 'center center', scrub: true } });
        gsap.fromTo(p.querySelectorAll('.hroom__txt > *'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.05, ease: 'power1.out',
          scrollTrigger: { trigger: p, containerAnimation: move, start: 'left 70%', end: 'left 40%', scrub: true } });
      });
    });
    return () => mm.revert();
  }, []);
  return (
    <section className="hscroll" ref={sec} aria-labelledby="hs-h">
      <div className="hscroll__track" ref={track}>
        <div className="hscroll__intro">
          <p className="eyebrow eyebrow--light">The rooms, in sequence</p>
          <h2 id="hs-h" className="light-caps light-caps--left">Three outlooks</h2>
          <p className="body-serif">Scroll through each room as you would walk the corridor — from the hills to the river.</p>
        </div>
        {rooms.map((r, i) => (
          <article key={r.slug} className="hroom">
            <div className="hroom__img"><Img id={r.photos[0]} sizes="(min-width: 1024px) 55vw, 85vw" /></div>
            <div className="hroom__txt">
              <p className="hroom__n">{String(i + 1).padStart(2, '0')} — {r.view}</p>
              <h3 className="caps-title">{r.name}</h3>
              <p className="body-serif">{r.lead}</p>
              <p className="feat__meta">Up to {r.adults} adults · {r.bed} · from {inr(r.from)}</p>
              <div className="feat__ctas"><Link to={go(r)} className="btn btn--white btn--sm">Explore room</Link><Link to="booking" prefill={{ room: r.slug }} className="link-caps link-caps--light">Book</Link></div>
            </div>
          </article>
        ))}
      </div>
      <div className="hscroll__progress" aria-hidden="true"><span ref={bar} /></div>
    </section>
  );
}
