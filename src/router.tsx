import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Hash routing with plain #names so it works on any static host
// (including sandboxed previews that only pass a bare #name).
export const routes = ['home', 'rooms', 'policies', 'room-executive-hill-view', 'room-executive-river-view', 'room-family-suite',
  'about', 'restaurant', 'wellness', 'gallery', 'contact', 'booking'] as const;
export type Route = typeof routes[number];

const parse = (): Route => {
  let h = location.hash.replace(/^#/, '');
  try { h = decodeURIComponent(h); } catch { return 'home'; } // malformed %-encoding would otherwise crash the app
  return (routes as readonly string[]).includes(h) ? (h as Route) : 'home';
};

type BookingPrefill = { room?: string; checkIn?: string; checkOut?: string; adults?: number; children?: number };
type Ctx = { route: Route; go: (r: Route, opts?: { prefill?: BookingPrefill; section?: string }) => void; prefill: BookingPrefill };
const RouterCtx = createContext<Ctx>({ route: 'home', go: () => {}, prefill: {} });
export const useRouter = () => useContext(RouterCtx);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(parse);
  const [prefill, setPrefill] = useState<BookingPrefill>({});
  const busy = useRef(false);
  const pendingSection = useRef<string | undefined>(undefined);
  const rendered = useRef(false);

  const scrollToSection = (id?: string) => {
    if (!id) { window.scrollTo(0, 0); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    }));
  };

  const go = useCallback<Ctx['go']>((r, opts) => {
    if (opts?.prefill) setPrefill(opts.prefill);
    if (r === route) { if (opts?.section) scrollToSection(opts.section); else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); return; }
    if (busy.current) return;
    pendingSection.current = opts?.section;
    const curtain = document.querySelector<HTMLElement>('.curtain');
    const commit = () => {
      history.pushState(null, '', r === 'home' ? location.pathname + location.search : '#' + r);
      setRoute(r);
    };
    if (!curtain || reduced()) { commit(); return; }
    busy.current = true;
    gsap.timeline()
      .set(curtain, { display: 'block', opacity: 0 })
      .to(curtain, { opacity: 1, duration: 0.3, ease: 'power1.in' })
      .add(commit);
  }, [route]);

  // after a route renders: reset scroll, lift the curtain
  useEffect(() => {
    document.title = route === 'home' ? 'Sunriver Resort — Riverside stays near Lansdowne' :
      `${titles[route]} — Sunriver Resort`;
    scrollToSection(pendingSection.current);
    pendingSection.current = undefined;
    const curtain = document.querySelector<HTMLElement>('.curtain');
    if (curtain && busy.current) {
      gsap.timeline({ onComplete: () => { busy.current = false; } })
        .to(curtain, { opacity: 0, duration: 0.45, ease: 'power1.out', delay: 0.05 })
        .set(curtain, { display: 'none' });
    }
    // move focus to the new page on route changes only; on first load the skip link must stay first in Tab order
    if (rendered.current) document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
    rendered.current = true;
  }, [route]);

  useEffect(() => {
    const onPop = () => setRoute(parse());
    addEventListener('popstate', onPop); addEventListener('hashchange', onPop);
    return () => { removeEventListener('popstate', onPop); removeEventListener('hashchange', onPop); };
  }, []);

  return <RouterCtx.Provider value={{ route, go, prefill }}>{children}</RouterCtx.Provider>;
}

export const titles: Record<Route, string> = {
  home: 'Home', rooms: 'Rooms', 'room-executive-hill-view': 'Executive Room with Hill View',
  'room-executive-river-view': 'Executive Room with River View', 'room-family-suite': 'Family Suite',
  policies: 'Policies', about: 'About', restaurant: 'Restaurant', wellness: 'Wellness & Nature', gallery: 'Gallery', contact: 'Contact', booking: 'Book your stay',
};

type LinkProps = { to: Route; section?: string; className?: string; children: ReactNode; onClick?: () => void; 'aria-label'?: string; prefill?: BookingPrefill };
export function Link({ to, section, className, children, onClick, prefill, ...rest }: LinkProps) {
  const { go, route } = useRouter();
  const href = to === 'home' ? '#' : '#' + to;
  const handle = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); onClick?.(); go(to, { section, prefill });
  };
  return <a href={href} className={className} onClick={handle} aria-current={route === to && !section ? 'page' : undefined} {...rest}>{children}</a>;
}
