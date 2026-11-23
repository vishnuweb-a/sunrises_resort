import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useMotion } from '../motion';
import { Link } from '../router';
import { contact, features, inr, photos, policies, reasons, restaurant, rooms, tel } from '../data';
import { Eyebrow, Icon, Img, Lines } from '../components/ui';
import { GalleryGrid, Lightbox } from '../components/Gallery';
import { BookingPanel, InquiryForm } from '../components/Forms';
import { HorizontalRooms, RoomCard } from '../components/Rooms';

/** Inner-page hero: full-bleed photograph, italic eyebrow, light uppercase title. */
function PageHero({ photo, eyebrow, lines, pos, children }: { photo: string; eyebrow: string; lines: ReactNode[]; pos?: string; children?: ReactNode }) {
  const r = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(r.current);
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(q('.phero__img'), { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' })
        .from(q('.phero__eyebrow'), { opacity: 0, duration: 0.8 }, 0.3)
        .from(q('h1 .ln > span'), { yPercent: 100, stagger: 0.1, duration: 1.1 }, 0.35);
      const extra = q('.phero__extra'); // only room pages have it; an empty target logs a GSAP warning
      if (extra.length) tl.from(extra, { opacity: 0, y: 12, duration: 0.8 }, 0.8);
    });
    return () => mm.revert();
  }, []);
  return (
    <section className="phero" ref={r}>
      <Img id={photo} eager className="phero__img" pos={pos} alt="" />
      <div className="hero__shade" />
      <div className="phero__txt">
        <p className="phero__eyebrow eyebrow eyebrow--light">{eyebrow}</p>
        <Lines as="h1" className="light-caps light-caps--xl" lines={lines} />
        {children && <div className="phero__extra">{children}</div>}
      </div>
    </section>
  );
}

function Page({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useMotion(root);
  return <div ref={root}>{children}</div>;
}

const Intro = ({ children }: { children: ReactNode }) => <p className="intro-serif" data-reveal>{children}</p>;

export function Rooms() {
  const [f, setF] = useState<'all' | 'exec' | 'suite'>('all');
  const list = rooms.filter((r) => f === 'all' || (f === 'exec' ? r.slug.startsWith('executive') : r.slug === 'family-suite'));
  return (
    <Page>
      <PageHero photo="family-suite-2" eyebrow="Accommodations" lines={['Rooms & suites']} />
      <section className="section--white"><div className="wrap">
        <Intro>Sunriver Resort offers three types of accommodation near Lansdowne: two Executive Rooms, one facing the forested hills and one opening onto the river, and a Family Suite with river views that sleeps up to six adults. Each has a king-size bed, a work desk, a television and wired and wireless internet.</Intro>
      </div></section>
      <HorizontalRooms />
      <section className="section--white"><div className="wrap">
        <div className="filters" role="group" aria-label="Filter rooms">
          <button className="filters__all" aria-pressed={f === 'all'} onClick={() => setF('all')}>View all ({rooms.length})</button>
          <span className="filters__rule" aria-hidden="true" />
          <div className="filters__list">
            <button aria-pressed={f === 'exec'} onClick={() => setF('exec')}>Executive rooms (2)</button>
            <button aria-pressed={f === 'suite'} onClick={() => setF('suite')}>Suites (1)</button>
          </div>
        </div>
        <div className="rgrid">{list.map((r) => <RoomCard key={r.slug} r={r} />)}</div>
        <div className="policy-teaser" data-reveal>
          <h2 className="caps-title">Policies</h2>
          <p className="body-serif">Check-in timings are shared at booking; a government-issued photo ID is required. <Link to="policies" className="link-under">Read the booking policies</Link></p>
        </div>
      </div></section>
    </Page>
  );
}

export function RoomDetail({ slug }: { slug: string }) {
  const r = rooms.find((x) => x.slug === slug)!;
  const [lb, setLb] = useState<number | null>(null);
  const list = r.photos.map((id) => photos.find((p) => p.id === id)!);
  return (
    <Page>
      <PageHero photo={r.photos[0]} eyebrow={r.view} lines={r.name.includes(' with ') ? [r.name.split(' with ')[0], 'with ' + r.name.split(' with ')[1]] : [r.name]}>
        <p className="phero__rate">From {inr(r.from)} per night</p>
      </PageHero>
      <section className="section--white"><div className="wrap rd">
        <div className="rd__main">
          <Intro>{r.body}</Intro>
          <ul className="specs specs--lg" data-reveal>
            <li>{Icon.bed}{r.bed}</li><li>{Icon.view}{r.view}</li><li>{Icon.users}Up to {r.adults} adults</li>
          </ul>
          <h2 className="caps-title rd__h" data-reveal>In the room</h2>
          <ul className="amen" data-reveal>{r.amenities.map((a) => <li key={a}>{a}</li>)}</ul>
          <h2 className="caps-title rd__h" data-reveal>Photographs</h2>
          <div className="rd__photos">
            {list.map((p, i) => (
              <button key={p.id} className="rd__ph" onClick={() => setLb(i)} aria-label={`View photograph: ${p.alt}`} data-reveal>
                <Img id={p.id} sizes="(min-width: 1024px) 30vw, 50vw" />
              </button>
            ))}
          </div>
        </div>
        <aside className="rd__side" aria-label="Book this room">
          <div className="rd__card">
            <p className="caps-title">Rates</p>
            <p className="rate rate--lg"><span>From</span> {inr(r.from)} <span>/ night</span></p>
            <p className="small">Listed rate on sunriverresort.in. Your dates are checked against live availability before anything is reserved.</p>
            <Link to="booking" prefill={{ room: r.slug, adults: Math.min(2, r.adults) }} className="btn btn--black btn--block">Check rates</Link>
            <a className="link-caps" href={tel(contact.phones[0])}>Call {contact.phones[0]}</a>
          </div>
        </aside>
      </div></section>
      <section className="section--warm"><div className="wrap">
        <h2 className="light-caps" data-reveal>Other accommodations</h2>
        <div className="rgrid">{rooms.filter((x) => x.slug !== slug).map((o) => <RoomCard key={o.slug} r={o} />)}</div>
      </div></section>
      {lb !== null && <Lightbox list={list} index={lb} onIndex={setLb} onClose={() => setLb(null)} />}
    </Page>
  );
}

export function About() {
  return (
    <Page>
      <PageHero photo="entrance-walkway" eyebrow="About" lines={['Welcome to', 'Sunriver Resort']} />
      <section className="section--white"><div className="wrap">
        <Intro>Sunriver Resort is a peaceful luxury getaway in Lansdowne, offering beautiful river and mountain views, comfortable stays, delicious dining and a relaxing experience close to nature.</Intro>
      </div></section>
      <section className="split section--white"><div className="wrap split__grid">
        <figure className="split__img" data-img><Img id="grounds-gardens" sizes="(min-width: 1024px) 50vw, 100vw" /></figure>
        <div className="split__txt">
          <Eyebrow>Make your stay memorable</Eyebrow>
          <h2 className="caps-title caps-title--lg" data-reveal>What you’ll find</h2>
          <p className="body-serif" data-reveal>A luxurious in-house restaurant, comfortable modern rooms, scenic river and mountain views, free parking, high-speed Wi-Fi, outdoor seating areas and a peaceful atmosphere designed for a relaxing, memorable stay.</p>
          <ul className="ticks" data-reveal>{reasons.map((x) => <li key={x.title}><strong>{x.title}.</strong> {x.text}</li>)}</ul>
        </div>
      </div></section>
      <section className="story"><h2 className="light-caps" data-reveal>Rivers, mountains, hospitality</h2>
        <p className="body-serif" data-reveal>At Sunriver Resort, every stay is surrounded by peaceful rivers, beautiful mountains, warm hospitality and unforgettable moments close to nature.</p>
        <div data-reveal><Link to="rooms" className="btn btn--white">View accommodations</Link></div>
      </section>
    </Page>
  );
}

export function Restaurant() {
  return (
    <Page>
      <PageHero photo="riverside-terrace" pos="50% 42%" eyebrow="Dining" lines={['Enhancing life', 'around great food']} />
      <section className="section--white"><div className="wrap"><Intro>{restaurant.text}</Intro></div></section>
      <section className="section--white"><div className="wrap dine__grid">
        <figure className="dine__img" data-img><Img id="riverside-terrace" sizes="(min-width: 1024px) 40vw, 100vw" /></figure>
        <div className="dine__txt">
          <Eyebrow>In-house restaurant</Eyebrow>
          <h2 className="light-caps light-caps--left" data-reveal>Hours & reservations</h2>
          <dl className="facts facts--stack" data-reveal>
            <div><dt>Open</dt><dd>{restaurant.days}</dd></div>
            <div><dt>Hours</dt><dd>{restaurant.hours}</dd></div>
            <div><dt>Prices</dt><dd>{restaurant.price}</dd></div>
          </dl>
          <div className="row" data-reveal><a className="btn btn--black" href={tel(contact.phones[0])}>Call to reserve</a><Link to="contact" className="btn btn--outline">Send an enquiry</Link></div>
          <p className="small" data-reveal>The resort does not publish a menu online. Ask the team about today’s dishes and dietary needs.</p>
        </div>
      </div></section>
    </Page>
  );
}

export function Wellness() {
  return (
    <Page>
      <PageHero photo="pool-mountains" eyebrow="Wellness & nature" lines={['Rest, by', 'nature']} />
      <section className="section--white"><div className="wrap">
        <Intro>Wellbeing at Sunriver comes from the setting itself: the river below, the forested hills above, a swimming pool between them and quiet gardens to sit in.</Intro>
        <h2 className="sr-only">The setting</h2>
        <div className="fgrid">
          {features.map((x) => (
            <article key={x.title} className="fcard" data-reveal>
              <div className="fcard__img"><Img id={x.photo} sizes="(min-width: 1024px) 25vw, 100vw" /></div>
              <h3 className="caps-title">{x.title}</h3><p className="body-serif">{x.text}</p>
            </article>
          ))}
        </div>
        <aside className="notice" data-reveal>
          <h2 className="caps-title">A note on spa treatments</h2>
          <p className="body-serif">Sunriver does not currently list spa or massage services, so none are advertised here. If you are hoping for a particular treatment or activity, please ask before you book — <a href={tel(contact.phones[0])}>{contact.phones[0]}</a>.</p>
        </aside>
      </div></section>
    </Page>
  );
}

export function GalleryPage() {
  return (
    <Page>
      <PageHero photo="grounds-gardens" pos="50% 60%" eyebrow="Gallery" lines={['Moments at', 'Sunriver']} />
      <section className="section--white"><div className="wrap">
        <Intro>Every photograph here was taken at Sunriver Resort.</Intro>
        <GalleryGrid filters />
      </div></section>
    </Page>
  );
}

export function Contact() {
  return (
    <Page>
      <PageHero photo="exec-river-1" eyebrow="Contact" lines={['Have any', 'questions?']} />
      <section className="section--white"><div className="wrap contact">
        <div>
          <ul className="clist">
            <li data-reveal><h2 className="caps-title">Telephone</h2>{contact.phones.map((p) => <a key={p} href={tel(p)}>{p}</a>)}</li>
            <li data-reveal><h2 className="caps-title">Email</h2><a href={'mailto:' + contact.emails.info}>{contact.emails.info}</a><a href={'mailto:' + contact.emails.reservations}>{contact.emails.reservations}</a></li>
            <li data-reveal><h2 className="caps-title">Address</h2><p className="body-serif">{contact.address}<br />Near Lansdowne, Uttarakhand</p>
              <a href={contact.mapUrl} target="_blank" rel="noopener" className="link-under">Open in Google Maps</a></li>
          </ul>
        </div>
        <div>
          <h2 className="light-caps light-caps--left" data-reveal>Send an enquiry</h2>
          <InquiryForm />
        </div>
      </div></section>
    </Page>
  );
}

export function Booking() {
  return (
    <Page>
      <PageHero photo="river-balcony" pos="25% 55%" eyebrow="Reservations" lines={['Check rates']} />
      <section className="section--white"><div className="wrap">
        <BookingPanel />
        <h2 className="sr-only">Accommodations</h2>
        <div className="rgrid rgrid--3">{rooms.map((r) => <RoomCard key={r.slug} r={r} />)}</div>
      </div></section>
    </Page>
  );
}

export function Policies() {
  return (
    <Page>
      <PageHero photo="exec-hill-2" eyebrow="Reservations" lines={['Booking policies']} />
      <section className="section--white"><div className="wrap narrow">
        <Intro>A summary of Sunriver Resort’s Terms & Conditions (last updated 20 November 2026). The full documents remain the authoritative versions.</Intro>
        <div className="acc">
          {policies.map((p, i) => (
            <details key={p.title} className="acc__item" open={i === 0} data-reveal>
              <summary className="caps-title">{p.title}<span aria-hidden="true">{Icon.plus}</span></summary>
              <ul className="ticks">{p.points.map((t) => <li key={t}>{t}</li>)}</ul>
            </details>
          ))}
        </div>
        <p className="row">{contact.legalLinks.map((l) => <a key={l.label} className="link-under" href={l.href} target="_blank" rel="noopener">{l.label} (full text)</a>)}</p>
      </div></section>
    </Page>
  );
}

