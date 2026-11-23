import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, BedDouble, ChevronLeft, ChevronRight, Mail, MapPin, Mountain, Phone, Users, Waves, X, ArrowUpRight, Pause, Play, Plus, Minus, Calendar, ChevronDown } from 'lucide-react';
import { img, srcSet, photos } from '../data';

type ImgProps = { id: string; alt?: string; sizes?: string; eager?: boolean; className?: string; style?: CSSProperties; pos?: string };
/** Responsive photograph with intrinsic size reserved (no layout shift). */
export function Img({ id, alt, sizes = '100vw', eager, className, style, pos }: ImgProps) {
  const p = photos.find((x) => x.id === id);
  return (
    <img src={img(id, eager ? 1600 : 800)} srcSet={srcSet(id)} sizes={sizes} width={p?.w} height={p?.h}
      alt={alt ?? p?.alt ?? ''} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined}
      className={className} style={{ objectPosition: pos, ...style }} />
  );
}

/** Heading with art-directed line breaks; each line rises out of a mask. */
export function Lines({ as: Tag = 'h2', lines, className, id }: { as?: 'h1' | 'h2' | 'h3'; lines: ReactNode[]; className?: string; id?: string }) {
  return (
    <Tag className={className} data-lines id={id}>
      {lines.map((l, i) => <span className="ln" key={i}><span>{l}</span></span>)}
    </Tag>
  );
}

/** Italic Garamond eyebrow — the reference's "Winter Travel" / "Featured Properties" role. */
export const Eyebrow = ({ children, light }: { children: ReactNode; light?: boolean }) =>
  <p className={'eyebrow' + (light ? ' eyebrow--light' : '')} data-reveal>{children}</p>;

const s = { size: 18, strokeWidth: 1.25, 'aria-hidden': true } as const;
export const Icon = {
  arrow: <ArrowRight {...s} />, out: <ArrowUpRight {...s} size={15} />, prev: <ChevronLeft {...s} size={22} />, next: <ChevronRight {...s} size={22} />,
  close: <X {...s} size={26} />, phone: <Phone {...s} size={16} />, mail: <Mail {...s} size={16} />, pin: <MapPin {...s} size={16} />,
  users: <Users {...s} size={16} />, bed: <BedDouble {...s} size={16} />, view: <Mountain {...s} size={16} />, river: <Waves {...s} size={16} />,
  pause: <Pause {...s} size={14} />, play: <Play {...s} size={14} />, plus: <Plus {...s} size={16} />, minus: <Minus {...s} size={16} />,
  cal: <Calendar {...s} size={16} />, down: <ChevronDown {...s} size={18} />,
};

/** Taj-style section heading: Cormorant display lines with a gold rule; centred (rules both sides) or left (rule from the edge, intro to the right). */
export function SectionHead({ id, eyebrow, lines, intro, center, light }: { id?: string; eyebrow?: string; lines: ReactNode[]; intro?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={'shead' + (center ? ' shead--center' : '') + (light ? ' shead--light' : '')}>
      <div className="shead__title">
        {eyebrow && <p className="shead__eyebrow" data-reveal>{eyebrow}</p>}
        <div className="shead__row">
          <span className="shead__rule" aria-hidden="true" />
          <Lines id={id} className="display" lines={lines} />
          {center && <span className="shead__rule" aria-hidden="true" />}
        </div>
      </div>
      {intro && <p className="shead__intro" data-reveal>{intro}</p>}
    </div>
  );
}
