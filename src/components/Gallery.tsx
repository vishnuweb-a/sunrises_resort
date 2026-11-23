import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { photos, img, type Photo } from '../data';
import { Icon, Img } from './ui';

export function Lightbox({ list, index, onClose, onIndex }: { list: Photo[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const picRef = useRef<HTMLImageElement>(null);
  const returnTo = useRef<Element | null>(document.activeElement);
  const p = list[index];
  const step = useCallback((d: number) => onIndex((index + d + list.length) % list.length), [index, list.length, onIndex]);

  useEffect(() => {
    const node = ref.current!;
    node.querySelector<HTMLButtonElement>('.lb__close')?.focus();
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') { // keep focus inside
        const f = Array.from(node.querySelectorAll<HTMLElement>('button'));
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    addEventListener('keydown', key);
    return () => { removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [onClose, step]);

  useEffect(() => () => { (returnTo.current as HTMLElement | null)?.focus?.(); }, []);
  useEffect(() => {
    if (picRef.current && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      gsap.fromTo(picRef.current, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
  }, [index]);

  // swipe on touch
  const x0 = useRef<number | null>(null);
  return (
    <div className="lb" ref={ref} role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (x0.current == null) return; const dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); x0.current = null; }}>
      <button className="lb__close" onClick={onClose} aria-label="Close photo viewer">{Icon.close}</button>
      <button className="lb__nav lb__nav--prev" onClick={() => step(-1)} aria-label="Previous photo">{Icon.prev}</button>
      <figure className="lb__fig">
        <img ref={picRef} src={img(p.id, 1600)} alt={p.alt} width={p.w} height={p.h} />
        <figcaption><span>{p.alt}</span><span className="lb__count">{index + 1} / {list.length}</span></figcaption>
      </figure>
      <button className="lb__nav lb__nav--next" onClick={() => step(1)} aria-label="Next photo">{Icon.next}</button>
    </div>
  );
}

const tags = ['All', 'Rooms', 'Bathrooms', 'Outdoors', 'Dining'] as const;

/** Editorial grid with controlled crops, caps filter tabs (reference "Featured Properties" tabs) and a lightbox. */
export function GalleryGrid({ limit, filters }: { limit?: number; filters?: boolean }) {
  const [tag, setTag] = useState<typeof tags[number]>('All');
  const [open, setOpen] = useState<number | null>(null);
  const list = photos.filter((p) => tag === 'All' || p.tag === tag).slice(0, limit);
  const grid = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!filters || !grid.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(grid.current.children, { opacity: 0 }, { opacity: 1, stagger: 0.04, duration: 0.5, ease: 'power1.out' });
  }, [tag, filters]);

  return (
    <>
      {filters && (
        <div className="tabs" role="group" aria-label="Filter photographs">
          {tags.map((t) => (
            <button key={t} className="tabs__btn" aria-pressed={tag === t} onClick={() => setTag(t)}>
              {t} ({t === 'All' ? photos.length : photos.filter((p) => p.tag === t).length})
            </button>
          ))}
        </div>
      )}
      <ul className={'pgrid' + (limit ? ' pgrid--teaser' : '')} ref={grid}>
        {list.map((p, i) => (
          <li key={p.id} className="pgrid__item" data-reveal={limit ? '' : undefined}>
            <button className="pgrid__btn" onClick={() => setOpen(i)} aria-label={`View photograph: ${p.alt}`}>
              <Img id={p.id} sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw" pos={p.h > p.w ? '50% 60%' : undefined} />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox list={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
