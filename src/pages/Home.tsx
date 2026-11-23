import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useMotion, reducedMotion, MOTION } from '../motion';
import { Link, useRouter } from '../router';
import { restaurant } from '../data';
import { Eyebrow, Icon, Img, Lines, SectionHead } from '../components/ui';
import { BookingBar, useBooking } from '../components/Forms';
import { Explore, FeaturedRooms, type Story } from '../components/Rooms';
import { GalleryGrid } from '../components/Gallery';
import { ResortStack } from '../components/Resort';

const slides = [
  { id: 'entrance-walkway', pos: '50% 58%', cap: 'Arriving at Sunriver, Dugadda' },
  { id: 'exec-river-1', pos: '50% 50%', cap: 'Executive Room with River View' },
  { id: 'family-suite-2', pos: '55% 50%', cap: 'The Family Suite' },
];
const SLIDE_MS = 8000;

/** Hero — calm, centred composition; one sequenced entrance timeline. */
function Hero() {
  const { go } = useRouter();
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(reducedMotion());
  const fill = useRef<HTMLSpanElement>(null);
  const [b, set] = useBooking();

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root.current);
      const H = MOTION.hero;
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(q('.hero__media'), { opacity: 0 }, { opacity: 1, duration: H.image, ease: 'power1.out' })                 // 1. imagery
        .fromTo(q('.hero__slide.is-on img'), { scale: 1.1 }, { scale: 1, duration: H.settle, ease: 'power2.out' }, 0)
        .from(q('.hero__h .ln > span'), { yPercent: 105, duration: H.heading, stagger: 0.14 }, 0.45)                    // 2. masked heading
        .from(q('.hero__rule'), { scaleX: 0, duration: 1.2, ease: 'power2.inOut' }, 0.8)
        .from(q('.hero__sub'), { opacity: 0, y: 18, duration: H.sub }, 1.05)                                           // 3. subtitle
        .from(q('.hero__ctas > *'), { opacity: 0, y: 14, duration: H.cta, stagger: 0.1 }, 1.3)                         // 4. CTA
        .from('.hdr__main', { opacity: 0, y: -12, duration: H.nav, ease: 'power2.out' }, 1.45)                         // 5. navigation settles
        .from(q('.hero__dock, .hero__scroll'), { opacity: 0, duration: 1 }, 1.6);
      gsap.to(q('.hero__media'), { yPercent: 10, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(q('.hero__inner'), { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: '75% top', scrub: true } });
    });
    return () => mm.revert();
  }, []);

  useEffect(() => {
    const el = fill.current; if (!el) return;
    if (paused) { gsap.killTweensOf(el); return; }
    const tw = gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: SLIDE_MS / 1000, ease: 'none', onComplete: () => setI((x) => (x + 1) % slides.length) });
    return () => { tw.kill(); };
  }, [i, paused]);
  useEffect(() => {
    if (reducedMotion() || !root.current) return;
    gsap.fromTo(root.current.querySelector('.hero__slide.is-on img'), { scale: 1.06 }, { scale: 1, duration: SLIDE_MS / 1000 + 1.6, ease: 'none' });
  }, [i]);

  const toResort = () => document.getElementById('the-resort')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  return (
    <section className="hero" ref={root} aria-labelledby="hero-h">
      <div className="hero__media">
        {slides.map((s, k) => (
          <div key={s.id} className={'hero__slide' + (k === i ? ' is-on' : '')} aria-hidden={k !== i}>
            <Img id={s.id} eager={k === 0} pos={s.pos} sizes="100vw" alt={k === i ? s.cap : ''} />
          </div>
        ))}
      </div>
      <div className="hero__shade" />
      <div className="hero__inner">
        <p className="hero__kicker">Dugadda · Lansdowne · Uttarakhand</p>
        <Lines as="h1" id="hero-h" className="hero__h" lines={['Sunriver', 'Resort']} />
        <span className="hero__rule" aria-hidden="true" />
        <p className="hero__sub">A riverside escape in the heart of Uttarakhand</p>
        <button className="hero__find" onClick={() => go('booking')}>Choose your dates {Icon.cal}</button>
        <div className="hero__ctas">
          <button className="btn btn--gold" onClick={() => go('booking')}>Book your stay</button>
          <button className="btn btn--line-light" onClick={toResort}>Discover the resort</button>
        </div>
      </div>
      <div className="hero__foot">
        <div className="hero__progress" aria-hidden="true">
          {slides.map((s, k) => <span key={s.id} className="hero__seg">{k === i && <span ref={fill} className="hero__fill" />}{k < i && <span className="hero__fill hero__fill--done" />}</span>)}
        </div>
        <p className="hero__cap" aria-live="polite">{slides[i].cap}</p>
        <button className="hero__pause" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>{paused ? Icon.play : Icon.pause}</button>
      </div>
      <button className="hero__scroll" onClick={toResort} aria-label="Scroll to The Resort"><span>Scroll</span><i /></button>
      <div className="hero__dock"><BookingBar b={b} set={set} /></div>
    </section>
  );
}

const amenities: Story[] = [
  { photo: 'exec-hill-2', title: 'Room service, as you need it', text: 'Restful king rooms, lounge corners and in-room service from the resort team whenever you need it.', to: 'rooms', cta: 'View accommodations' },
  { photo: 'bath-tub', title: 'Unhurried mornings', text: 'Fresh towels, a deep tub and nowhere you need to be.', to: 'room-executive-river-view', cta: 'Explore a room' },
  { photo: 'exec-river-2', title: 'Rooms that open to the green', text: 'Wide windows and balconies frame the hills and the river; the view does most of the work.', to: 'gallery', cta: 'View the gallery' },
];
const verified = ['Swimming pool', 'River views', 'In-house restaurant', 'Room service', 'Free parking', 'High-speed Wi-Fi', 'Outdoor seating'];

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useMotion(root);
  const [b, set] = useBooking();
  return (
    <div ref={root}>
      <Hero />

      <ResortStack />

      <FeaturedRooms />

      {/* Amenities — large images, restrained captions */}
      <section className="amen-sec" aria-labelledby="amen-h">
        <div className="wrap">
          <SectionHead id="amen-h" eyebrow="Amenities" lines={['Thoughtful', 'comforts']} intro="Everything Sunriver lists for its guests — nothing more, nothing invented." />
        </div>
        <Explore items={amenities} />
        <ul className="amen-list wrap" data-reveal>{verified.map((v) => <li key={v}>{v}</li>)}</ul>
      </section>

      {/* Restaurant — editorial split */}
      <section className="dine section--ivory" aria-labelledby="dine-h">
        <div className="wrap dine__grid">
          <figure className="dine__img" data-img><Img id="riverside-terrace" sizes="(min-width: 1024px) 42vw, 100vw" /></figure>
          <div className="dine__txt">
            <Eyebrow>In-house restaurant</Eyebrow>
            <Lines id="dine-h" className="display display--left" lines={['A taste of', 'something memorable']} />
            <span className="gold-rule" aria-hidden="true" />
            <p className="body-serif" data-reveal>{restaurant.text}</p>
            <dl className="facts" data-reveal>
              <div><dt>Open</dt><dd>{restaurant.days}</dd></div>
              <div><dt>Hours</dt><dd>{restaurant.hours}</dd></div>
              <div><dt>Prices</dt><dd>{restaurant.price}</dd></div>
            </dl>
            <div data-reveal><Link to="restaurant" className="link-gold">Discover dining {Icon.arrow}</Link></div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gal section--white" aria-labelledby="gal-h">
        <div className="wrap">
          <SectionHead id="gal-h" eyebrow="Gallery" lines={['Moments at', 'Sunriver']} center />
          <GalleryGrid limit={6} />
          <p className="center" data-reveal><Link to="gallery" className="btn btn--line">View all photographs</Link></p>
        </div>
      </section>

      {/* Booking */}
      <section className="bookband" aria-labelledby="bk-h">
        <div className="wrap">
          <SectionHead id="bk-h" eyebrow="Plan your stay" lines={['Reserve', 'your stay']} center light />
          <div data-reveal className="bookband__bar"><BookingBar b={b} set={set} /></div>
          <p className="bookband__note">Rates and availability are confirmed on Sunriver’s live booking system.</p>
        </div>
      </section>
    </div>
  );
}
