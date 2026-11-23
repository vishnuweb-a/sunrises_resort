import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link, useRouter, type Route } from '../router';
import { contact, logo, rooms, tel } from '../data';
import { reducedMotion } from '../motion';
import { BookingBar, useBooking } from './Forms';
import { Icon } from './ui';

const nav: { to: Route; label: string }[] = [
  { to: 'home', label: 'Resort Overview' }, { to: 'rooms', label: 'Accommodations' }, { to: 'restaurant', label: 'Dining' },
  { to: 'wellness', label: 'Wellness' }, { to: 'gallery', label: 'Gallery' }, { to: 'about', label: 'About' }, { to: 'contact', label: 'Contact' },
];

/** Docked "Check Rates" panel under the header — the reference's property-page booking bar. */
function RatesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [b, set] = useBooking();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    if (!reducedMotion()) gsap.fromTo(ref.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    ref.current.querySelector<HTMLButtonElement>('.bf__field')?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.pop')) onClose(); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="rates" ref={ref} role="region" aria-label="Check rates">
      <div className="rates__inner">
        <BookingBar b={b} set={set} />
        <button className="rates__hide" onClick={onClose}>Hide</button>
      </div>
    </div>
  );
}

export function Header() {
  const { route } = useRouter();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [rates, setRates] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setSolid(scrollY > 40);
    on(); addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, [route]);
  useEffect(() => { setMenu(false); setRates(false); }, [route]);
  useEffect(() => {
    const open = () => setRates(true);
    addEventListener('sr:rates', open); return () => removeEventListener('sr:rates', open);
  }, []);

  useEffect(() => {
    const p = panel.current; if (!p) return;
    document.body.style.overflow = menu ? 'hidden' : '';
    if (!menu) return;
    if (!reducedMotion()) {
      gsap.fromTo(p.querySelector('.menu__sheet'), { xPercent: 100 }, { xPercent: 0, duration: 0.4, ease: 'power3.out' });
      gsap.fromTo(p.querySelector('.menu__scrim'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
    }
    p.querySelector<HTMLElement>('.menu__close')?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenu(false); burger.current?.focus(); }
      else if (e.key === 'Tab') { // aria-modal: keep focus inside the sheet
        const f = Array.from(p.querySelectorAll<HTMLElement>('a[href], button'));
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
      }
    };
    addEventListener('keydown', esc); return () => removeEventListener('keydown', esc);
  }, [menu]);

  return (
    <>
      <header className={'hdr' + (solid || rates ? ' hdr--solid' : '')}>
        <div className="hdr__util">
          <a href={tel(contact.phones[0])}>{contact.phones[0]}</a>
          <a href={'mailto:' + contact.emails.reservations}>{contact.emails.reservations}</a>
          <a href={contact.mapUrl} target="_blank" rel="noopener">Dugadda · Lansdowne</a>
        </div>
        <div className="hdr__main">
          <Link to="home" className="hdr__logo" aria-label="Sunriver Resort — home"><img src={solid || rates ? logo.emblemGold : logo.emblemWhite} alt="" width="58" height="32" /></Link>
          <div className="hdr__prop">
            <Link to="home" className="hdr__name">Sunriver Resort</Link>
            <nav className="hdr__nav" aria-label="Main">
              {nav.map((n) => <Link key={n.to} to={n.to} className="hdr__link">{n.label}</Link>)}
            </nav>
          </div>
          <button className="btn btn--gold btn--rates" aria-expanded={rates} onClick={() => setRates(!rates)}>Check rates</button>
          <button ref={burger} className="burger" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(true)}>
            <span className="burger__lines" aria-hidden="true"><i /><i /><i /></span><span className="burger__txt">Menu</span>
          </button>
        </div>
        <RatesPanel open={rates} onClose={() => setRates(false)} />
      </header>

      <div id="menu" className="menu" ref={panel} hidden={!menu} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="menu__scrim" onClick={() => setMenu(false)} />
        <div className="menu__sheet">
          <div className="menu__top">
            <a href={tel(contact.phones[0])} className="menu__util">{Icon.phone}{contact.phones[0]}</a>
            <button className="menu__close" onClick={() => { setMenu(false); burger.current?.focus(); }} aria-label="Close menu">{Icon.close}</button>
          </div>
          <img src={logo.emblemGold} alt="" width="60" height="33" className="menu__logo" />
          <nav aria-label="Mobile">
            <ul className="menu__list">
              {/* close on click too: choosing the current page doesn't change the route */}
              {nav.map((n) => <li key={n.to}><Link to={n.to} onClick={() => setMenu(false)}>{n.label}</Link></li>)}
              <li><Link to="booking" onClick={() => setMenu(false)}>Book your stay</Link></li>
              <li><Link to="policies" onClick={() => setMenu(false)}>Policies</Link></li>
            </ul>
          </nav>
          <p className="menu__addr">{contact.address}<br /><a href={'mailto:' + contact.emails.reservations}>{contact.emails.reservations}</a></p>
        </div>
      </div>
    </>
  );
}

/** Mobile: sticky black CHECK RATES bar, as observed on the reference. */
export function MobileBar() {
  const { route, go } = useRouter();
  if (route === 'booking') return null;
  return <div className="mbar"><button className="btn btn--gold btn--block" onClick={() => go('booking')}>Check rates</button></div>;
}

export function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr__brand">
        <img src={logo.full} alt="Sun River Resort Pvt. Ltd." width="150" height="97" />
      </div>
      <div className="ftr__cols">
        <nav aria-label="Stay">
          <h2 className="ftr__h">Stay</h2>
          <ul>{rooms.map((r) => <li key={r.slug}><Link to={r.route as Route}>{r.name}</Link></li>)}<li><Link to="booking">Book your stay</Link></li></ul>
        </nav>
        <nav aria-label="Resort">
          <h2 className="ftr__h">Resort</h2>
          <ul><li><Link to="about">About us</Link></li><li><Link to="restaurant">Dining</Link></li><li><Link to="wellness">Wellness</Link></li><li><Link to="gallery">Gallery</Link></li></ul>
        </nav>
        <nav aria-label="Reservations">
          <h2 className="ftr__h">Reservations</h2>
          <ul><li><Link to="contact">Contact us</Link></li><li><Link to="policies">Policies</Link></li>
            <li><a href={'mailto:' + contact.emails.reservations}>Email reservations</a></li></ul>
        </nav>
        <div>
          <h2 className="ftr__h">Find us</h2>
          <ul className="ftr__plain">
            {contact.phones.map((p) => <li key={p}><a href={tel(p)}>{p}</a></li>)}
            <li><a href={'mailto:' + contact.emails.info}>{contact.emails.info}</a></li>
            <li><a href={contact.mapUrl} target="_blank" rel="noopener">{contact.address}</a></li>
          </ul>
        </div>
      </div>
      <div className="ftr__base">
        <div className="ftr__social">{contact.social.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noopener">{s.label}</a>)}</div>
        <p className="ftr__legal">
          {contact.legalLinks.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noopener">{l.label}</a>)}
          <Link to="policies">Booking policies</Link>
        </p>
        <p className="ftr__copy">© {new Date().getFullYear()} {contact.legal}. All rights reserved.</p>
      </div>
    </footer>
  );
}
