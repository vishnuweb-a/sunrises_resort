import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { contact, inr, rooms, tel } from '../data';
import { useRouter } from '../router';
import { Icon } from './ui';

/* ---------- date helpers (local dates, ISO yyyy-mm-dd) ---------- */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const nightsBetween = (a: string, b: string) => Math.round((+parse(b) - +parse(a)) / 86400000);
const fmt = (s: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => parse(s).toLocaleDateString('en-IN', o);
const today = () => iso(new Date());

/* ---------- shared booking state ---------- */
export type Booking = { checkIn: string; checkOut: string; adults: number; children: number; room: string };
export function useBooking(): [Booking, (p: Partial<Booking>) => void] {
  const { prefill } = useRouter();
  const [b, setB] = useState<Booking>({
    checkIn: prefill.checkIn ?? '', checkOut: prefill.checkOut ?? '',
    adults: prefill.adults ?? 2, children: prefill.children ?? 0, room: prefill.room ?? 'any',
  });
  // a new prefill while this bar is mounted (e.g. "Book" on a room card on #booking itself) updates it
  const [seen, setSeen] = useState(prefill);
  if (seen !== prefill) {
    setSeen(prefill);
    const max = rooms.find((x) => x.slug === (prefill.room ?? b.room))?.adults ?? 12;
    setB((x) => ({ ...x, ...prefill, adults: Math.min(prefill.adults ?? x.adults, max) }));
  }
  return [b, (p) => setB((x) => ({ ...x, ...p }))];
}
export const liveUrl = (b: Booking) =>
  `https://sunriverresort.in/search-results/?mphb_check_in_date=${b.checkIn}&mphb_check_out_date=${b.checkOut}&mphb_adults=${b.adults}&mphb_children=${b.children}`;

/* ---------- popover shell: closes on Escape / outside click, returns focus ---------- */
function Popover({ open, onClose, anchor, children, label, className = '' }: { open: boolean; onClose: () => void; anchor: React.RefObject<HTMLButtonElement | null>; children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node) && !anchor.current?.contains(e.target as Node)) onClose(); };
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { onClose(); anchor.current?.focus(); } };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, onClose, anchor]);
  if (!open) return null;
  return <div ref={ref} className={'pop ' + className} role="dialog" aria-label={label}>{children}</div>;
}

/* ---------- date range calendar ---------- */
function Month({ y, m, b, set, hover, setHover, tab }: { y: number; m: number; b: Booking; set: (d: string) => void; hover: string; setHover: (d: string) => void; tab: string }) {
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const t = today();
  const end = b.checkOut || (b.checkIn && hover > b.checkIn ? hover : '');
  return (
    <div className="cal__month">
      <p className="cal__title">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      <div className="cal__grid" role="grid">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d} className="cal__dow" aria-hidden="true">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={'x' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = iso(new Date(y, m, i + 1));
          const past = d < t;
          const isStart = d === b.checkIn, isEnd = d === b.checkOut;
          const inRange = b.checkIn && end && d > b.checkIn && d < end;
          return (
            <button key={d} type="button" data-date={d} disabled={past}
              className={'cal__day' + (isStart ? ' is-start' : '') + (isEnd ? ' is-end' : '') + (inRange ? ' is-in' : '')}
              aria-pressed={isStart || isEnd} aria-label={fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (isStart ? ', check-in' : isEnd ? ', check-out' : '')}
              onMouseEnter={() => setHover(d)} onFocus={() => setHover(d)} onClick={() => set(d)} tabIndex={d === tab ? 0 : -1}>
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRange({ b, set, dark }: { b: Booking; set: (p: Partial<Booking>) => void; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState('');
  const base = b.checkIn ? parse(b.checkIn) : new Date();
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const btn = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const id = useId();
  const two = typeof window !== 'undefined' && window.innerWidth >= 768;

  const pick = (d: string) => {
    if (!b.checkIn || b.checkOut || d <= b.checkIn) set({ checkIn: d, checkOut: '' });
    else { set({ checkOut: d }); setOpen(false); btn.current?.focus(); }
  };
  const shift = (n: number) => setView(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const canPrev = !(view.y === new Date().getFullYear() && view.m === new Date().getMonth());

  // roving keyboard focus across day buttons
  useEffect(() => {
    if (!open) return;
    const start = b.checkIn || today();
    requestAnimationFrame(() => (document.activeElement as HTMLElement)?.dataset?.date ? undefined : (grid.current?.querySelector<HTMLButtonElement>(`[data-date="${start}"]:not(:disabled)`) ?? grid.current?.querySelector<HTMLButtonElement>('.cal__day:not(:disabled)'))?.focus());
  }, [open, b.checkIn]);
  // arrowing past the visible months: focus the target day once the new month has rendered
  const want = useRef('');
  useEffect(() => {
    if (!want.current) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${want.current}"]`)?.focus();
    want.current = '';
  }, [view]);
  const onKey = (e: KeyboardEvent) => {
    const cur = (document.activeElement as HTMLElement)?.dataset?.date; if (!cur) return;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key as string];
    if (!step) return;
    e.preventDefault();
    const next = addDays(cur, step);
    if (next < today()) return;
    const el = grid.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`);
    if (el) el.focus(); else { want.current = next; shift(step > 0 ? 1 : -1); }
  };
  // one day button stays in the Tab order (roving tabindex), so the grid can be re-entered with Tab
  const months = [view, { y: new Date(view.y, view.m + 1, 1).getFullYear(), m: new Date(view.y, view.m + 1, 1).getMonth() }].slice(0, two ? 2 : 1)
    .map(({ y, m }) => `${y}-${String(m + 1).padStart(2, '0')}`);
  const tab = [hover, b.checkIn, today()].find((d) => d && d >= today() && months.includes(d.slice(0, 7))) ?? months[0] + '-01';

  const label = b.checkIn ? `${fmt(b.checkIn)} — ${b.checkOut ? fmt(b.checkOut) : 'Check out'}` : 'Check in — Check out';
  const m2 = new Date(view.y, view.m + 1, 1);
  return (
    <div className="bf">
      <span className="bf__label" id={id}>Check in — Check out</span>
      <button ref={btn} type="button" className={'bf__field' + (dark ? ' bf__field--dark' : '')} aria-haspopup="dialog" aria-expanded={open} aria-labelledby={id + ' ' + id + '-v'} onClick={() => setOpen(!open)}>
        <span id={id + '-v'}>{label}</span>{Icon.down}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} label="Choose check-in and check-out dates" className="pop--cal">
        <div className="cal" ref={grid} onKeyDown={onKey}>
          <div className="cal__nav">
            <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month">{Icon.prev}</button>
            <p className="cal__hint" aria-live="polite">{!b.checkIn || b.checkOut ? 'Select your check-in date' : 'Now select your check-out date'}</p>
            <button type="button" onClick={() => shift(1)} aria-label="Next month">{Icon.next}</button>
          </div>
          <div className="cal__months">
            <Month y={view.y} m={view.m} b={b} set={pick} hover={hover} setHover={setHover} tab={tab} />
            {two && <Month y={m2.getFullYear()} m={m2.getMonth()} b={b} set={pick} hover={hover} setHover={setHover} tab={tab} />}
          </div>
          <div className="cal__foot">
            <span>{b.checkIn && b.checkOut ? `${nightsBetween(b.checkIn, b.checkOut)} night${nightsBetween(b.checkIn, b.checkOut) > 1 ? 's' : ''}` : ''}</span>
            <button type="button" className="link-caps" onClick={() => set({ checkIn: '', checkOut: '' })}>Clear dates</button>
          </div>
        </div>
      </Popover>
    </div>
  );
}

function Stepper({ label, hint, value, min, max, onChange }: { label: string; hint?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="step">
      <div><p className="step__label">{label}</p>{hint && <p className="step__hint">{hint}</p>}</div>
      <div className="step__ctl" role="group" aria-label={label}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>{Icon.minus}</button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>{Icon.plus}</button>
      </div>
    </div>
  );
}

export function Guests({ b, set, dark }: { b: Booking; set: (p: Partial<Booking>) => void; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const r = rooms.find((x) => x.slug === b.room);
  const label = `${r ? r.short : 'Any room'} — ${b.adults} Adult${b.adults > 1 ? 's' : ''}${b.children ? `, ${b.children} Child${b.children > 1 ? 'ren' : ''}` : ''}`;
  return (
    <div className="bf">
      <span className="bf__label" id={id}>Room & guests</span>
      <button ref={btn} type="button" className={'bf__field' + (dark ? ' bf__field--dark' : '')} aria-haspopup="dialog" aria-expanded={open} aria-labelledby={id + ' ' + id + '-v'} onClick={() => setOpen(!open)}>
        <span id={id + '-v'}>{label}</span>{Icon.down}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} label="Choose room and guests" className="pop--guests">
        <fieldset className="rooms-pick">
          <legend className="step__label">Room</legend>
          {[{ slug: 'any', name: 'Any available room', note: '' }, ...rooms.map((x) => ({ slug: x.slug, name: x.name, note: `Up to ${x.adults} adults · from ${inr(x.from)}` }))].map((o) => (
            <label key={o.slug} className="radio">
              <input type="radio" name={id + 'room'} checked={b.room === o.slug} onChange={() => set({ room: o.slug, adults: Math.min(b.adults, rooms.find((x) => x.slug === o.slug)?.adults ?? 12) })} />
              <span><strong>{o.name}</strong>{o.note && <small>{o.note}</small>}</span>
            </label>
          ))}
        </fieldset>
        <Stepper label="Adults" value={b.adults} min={1} max={r ? r.adults : 12} onChange={(n) => set({ adults: n })} hint={r ? `${r.short} sleeps up to ${r.adults}` : undefined} />
        <Stepper label="Children" value={b.children} min={0} max={10} onChange={(n) => set({ children: n })} />
        <button type="button" className="btn btn--black btn--block" onClick={() => { setOpen(false); btn.current?.focus(); }}>Done</button>
      </Popover>
    </div>
  );
}

/** The reference's docked "Check Rates" bar. CHECK RATES hands the dates to Sunriver's live booking engine. */
export function BookingBar({ dark, b, set, onRates }: { dark?: boolean; b: Booking; set: (p: Partial<Booking>) => void; onRates?: () => void }) {
  const ready = !!(b.checkIn && b.checkOut);
  return (
    <form className={'bbar' + (dark ? ' bbar--dark' : '')} aria-label="Check rates and availability" onSubmit={(e) => e.preventDefault()}>
      <DateRange b={b} set={set} dark={dark} />
      <Guests b={b} set={set} dark={dark} />
      {ready ? (
        <a className={'btn ' + (dark ? 'btn--white' : 'btn--black') + ' bbar__go'} href={liveUrl(b)} target="_blank" rel="noopener" onClick={onRates}>Check rates</a>
      ) : (
        <button type="button" className={'btn ' + (dark ? 'btn--white' : 'btn--black') + ' bbar__go'} aria-disabled="true"
          onClick={(e) => (e.currentTarget.closest('form')?.querySelector<HTMLButtonElement>('.bf__field'))?.click()}>Check rates</button>
      )}
    </form>
  );
}

/** Booking page: same bar plus an honest summary and alternatives. */
export function BookingPanel() {
  const [b, set] = useBooking();
  const r = rooms.find((x) => x.slug === b.room);
  const n = b.checkIn && b.checkOut ? nightsBetween(b.checkIn, b.checkOut) : 0;
  const summary = `Booking request — Sunriver Resort\n\nRoom: ${r ? r.name : 'Any available room'}\nCheck-in: ${b.checkIn ? fmt(b.checkIn) : '-'}\nCheck-out: ${b.checkOut ? fmt(b.checkOut) : '-'}\nAdults: ${b.adults}\nChildren: ${b.children}\n\nName:\nPhone:\n`;
  const mail = `mailto:${contact.emails.reservations}?subject=${encodeURIComponent('Booking request')}&body=${encodeURIComponent(summary)}`;
  return (
    <div className="bpanel">
      <BookingBar b={b} set={set} />
      <div className="bpanel__sum" aria-live="polite">
        {n > 0 ? (
          <>
            <p className="caps-title">{n} night{n > 1 ? 's' : ''} · {fmt(b.checkIn, { weekday: 'short', day: 'numeric', month: 'short' })} — {fmt(b.checkOut, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            <p className="body-serif">{r ? <>Listed rate from <strong>{inr(r.from)}</strong> per night — about {inr(r.from * n)} for your stay before taxes. </> : null}
              “Check rates” opens Sunriver’s live booking system with these dates, where availability and the final price are confirmed. Nothing is reserved until you complete it there.</p>
          </>
        ) : <p className="body-serif">Choose your dates to see the number of nights and continue to live availability.</p>}
        <p className="bpanel__alt">Prefer to speak to someone? <a href={tel(contact.phones[0])}>{contact.phones[0]}</a> · <a href={mail}>Email this request</a></p>
      </div>
    </div>
  );
}

/* ---------- contact enquiry (no backend: hands off to the guest's email app) ---------- */
export function InquiryForm() {
  const [v, setV] = useState({ name: '', email: '', phone: '', message: '' });
  const [touched, setTouched] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const e = useMemo(() => {
    const x: Record<string, string> = {};
    if (!v.name.trim()) x.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) x.email = 'Enter an email address we can reply to.';
    if (v.phone && !/^[+\d][\d\s-]{6,}$/.test(v.phone)) x.phone = 'That phone number looks incomplete.';
    if (v.message.trim().length < 10) x.message = 'Please add a little more detail (10+ characters).';
    return x;
  }, [v]);
  const body = `${v.message}\n\n— ${v.name}\n${v.email}${v.phone ? '\n' + v.phone : ''}`;
  const mail = `mailto:${contact.emails.info}?subject=${encodeURIComponent('Enquiry from ' + v.name)}&body=${encodeURIComponent(body)}`;
  const set = (k: keyof typeof v) => (ev: { target: { value: string } }) => { setV({ ...v, [k]: ev.target.value }); setReady(false); };
  const err = (k: string) => touched && e[k] ? <span className="field__err" role="alert">{e[k]}</span> : null;
  return (
    <form className="enq" noValidate onSubmit={(ev) => { ev.preventDefault(); setTouched(true); if (!Object.keys(e).length) setReady(true); }} aria-label="Send an enquiry">
      <label className="field"><span className="bf__label">Name</span><input value={v.name} onChange={set('name')} autoComplete="name" aria-invalid={!!(touched && e.name)} />{err('name')}</label>
      <label className="field"><span className="bf__label">Email</span><input type="email" value={v.email} onChange={set('email')} autoComplete="email" aria-invalid={!!(touched && e.email)} />{err('email')}</label>
      <label className="field"><span className="bf__label">Phone (optional)</span><input type="tel" value={v.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!(touched && e.phone)} />{err('phone')}</label>
      <label className="field field--wide"><span className="bf__label">Message</span><textarea rows={5} value={v.message} onChange={set('message')} aria-invalid={!!(touched && e.message)} />{err('message')}</label>
      <button className="btn btn--black" type="submit">Prepare message</button>
      {ready && (
        <div className="enq__ready" role="status">
          <p className="body-serif">Your message is ready to send to <strong>{contact.emails.info}</strong>. Open it in your email app, or copy it.</p>
          <div className="row">
            <a className="btn btn--black" href={mail}>Open in email</a>
            <button type="button" className="btn btn--outline" onClick={() => navigator.clipboard?.writeText(`To: ${contact.emails.info}\n\n${body}`).then(() => setCopied(true), () => setCopied(false))}>{copied ? 'Copied' : 'Copy message'}</button>
          </div>
        </div>
      )}
    </form>
  );
}
