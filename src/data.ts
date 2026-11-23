// Single source of truth for Sunriver Resort content.
// Every fact below was read from https://sunriverresort.in (Nov 2026).
// Anything the live site does not state is deliberately left out.

export type Photo = { id: string; alt: string; tag: 'Rooms' | 'Bathrooms' | 'Outdoors' | 'Dining'; w: number; h: number };

const folder = (id: string) =>
  id === 'river-balcony' ? 'hero' : id === 'riverside-terrace' ? 'restaurant' :
  ['pool-mountains', 'grounds-gardens', 'entrance-walkway'].includes(id) ? 'resort' : 'rooms';
export const img = (id: string, size: 800 | 1600 = 1600) => `assets/${folder(id)}/${id}-${size}.webp`;
export const srcSet = (id: string) => `${img(id, 800)} 800w, ${img(id, 1600)} 1344w`;
export const logo = { emblemWhite: 'assets/branding/sunriver-emblem-white.png', emblemBlack: 'assets/branding/sunriver-emblem-black.png', emblemGold: 'assets/branding/sunriver-emblem-gold.png', full: 'assets/branding/sunriver-logo.png' };

export const photos: Photo[] = [
  { id: 'river-balcony', alt: 'Private balcony with teak chairs and a hanging swing, overlooking the river and forested hillside', tag: 'Rooms', w: 1344, h: 897 },
  { id: 'pool-mountains', alt: 'Outdoor swimming pool with poolside table, framed by green mountains and the resort building', tag: 'Outdoors', w: 1345, h: 895 },
  { id: 'riverside-terrace', alt: 'Table set for two on the riverside promenade, with the river and wooded slopes behind', tag: 'Dining', w: 894, h: 1344 },
  { id: 'exec-hill-1', alt: 'Executive room with king bed, armchair and a window looking onto the hills', tag: 'Rooms', w: 1344, h: 896 },
  { id: 'grounds-gardens', alt: 'Stone garden path leading through lawns to the resort buildings and a red-roofed gazebo', tag: 'Outdoors', w: 1344, h: 896 },
  { id: 'family-suite-1', alt: 'Family Suite with king bed, bunk beds and timber-panelled walls', tag: 'Rooms', w: 1344, h: 897 },
  { id: 'exec-river-1', alt: 'Executive room with king bed and doors opening to a balcony with green views', tag: 'Rooms', w: 1345, h: 896 },
  { id: 'entrance-walkway', alt: 'Walkway beside the resort with balconies above and the Sun River Resort sign beyond', tag: 'Outdoors', w: 1343, h: 897 },
  { id: 'bath-tub', alt: 'Bathroom with soaking tub, rolled towels and vessel basin', tag: 'Bathrooms', w: 1333, h: 904 },
  { id: 'exec-hill-2', alt: 'Executive room seating area with sofa chairs and wall-mounted television', tag: 'Rooms', w: 1344, h: 896 },
  { id: 'family-suite-2', alt: 'Family Suite looking towards the balcony doors, with bunk beds and a lounge chair', tag: 'Rooms', w: 1344, h: 896 },
  { id: 'exec-river-2', alt: 'Bright room with king bed and a large window onto the greenery', tag: 'Rooms', w: 1342, h: 898 },
  { id: 'suite-lounge', alt: 'Spacious room with king bed, sofa set and timber ceiling', tag: 'Rooms', w: 1344, h: 897 },
  { id: 'bath-shower', alt: 'Marble-finished bathroom with shower and bath ledge', tag: 'Bathrooms', w: 1344, h: 896 },
  { id: 'exec-hill-3', alt: 'Room detail with marble media wall and timber doors', tag: 'Rooms', w: 1345, h: 896 },
];

export const contact = {
  name: 'Sunriver Resort',
  legal: 'Sun River Resort Pvt. Ltd.',
  address: 'Dugadda, Uttarakhand 246127, India',
  region: 'Lansdowne, Uttarakhand',
  phones: ['+91 92580 34042', '+91 83508 36837'],
  emails: { info: 'info@sunriverresort.in', reservations: 'reservations@sunriverresort.in' },
  mapUrl: 'https://maps.app.goo.gl/XaGDX2we2v4CtVyL6',
  coords: { lat: 29.8125, lng: 78.6108 },
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/sunriverresort1/' },
    { label: 'Facebook', href: 'https://www.facebook.com/p/Sun-River-Resort-Pvt-Ltd-61555223977303/' },
  ],
  legalLinks: [
    { label: 'Terms & Conditions', href: 'https://sunriverresort.in/terms-conditions-2/' },
    { label: 'Privacy Policy', href: 'https://sunriverresort.in/privacy-policy-2/' },
  ],
};

export const tel = (p: string) => `tel:${p.replace(/\s/g, '')}`;

export type Room = {
  slug: string; route: string; name: string; short: string; view: string; bed: string;
  adults: number; from: number; liveUrl: string; mphbId: string;
  lead: string; body: string; amenities: string[]; photos: string[];
};

const baseAmenities = [
  '40-inch Samsung LED TV', 'Electronic safe with charging', 'Iron and ironing board',
  'USB charging station', 'Wired and wireless internet', 'Work desk', 'Non-smoking',
];

export const rooms: Room[] = [
  {
    slug: 'executive-hill-view', route: 'room-executive-hill-view', mphbId: 'executive-room',
    name: 'Executive Room with Hill View', short: 'Hill View', view: 'Hill view', bed: 'King-size bed', adults: 2, from: 5000,
    liveUrl: 'https://sunriverresort.in/accommodation/executive-room/',
    lead: 'A calm king room turned toward the forested slopes.',
    body: 'Polished floors, warm timber and a soft-seated lounge corner make this an easy room to settle into. Windows frame the green hillside that rises behind the resort — the view most guests wake up to.',
    amenities: baseAmenities, photos: ['exec-hill-1', 'exec-hill-2', 'exec-hill-3', 'bath-shower'],
  },
  {
    slug: 'executive-river-view', route: 'room-executive-river-view', mphbId: 'executive-room-with-river-view',
    name: 'Executive Room with River View', short: 'River View', view: 'River view', bed: 'King-size bed', adults: 2, from: 5500,
    liveUrl: 'https://sunriverresort.in/accommodation/executive-room-with-river-view/',
    lead: 'The same considered room, opened to the sound of the river.',
    body: 'The resort describes its river-view balconies as one of the most beautiful outlooks in Lansdowne. Step out with a morning tea and watch the water move over the stones below the wooded ridge.',
    amenities: baseAmenities, photos: ['exec-river-1', 'river-balcony', 'exec-river-2', 'bath-tub'],
  },
  {
    slug: 'family-suite', route: 'room-family-suite', mphbId: 'family-suite-room',
    name: 'Family Suite', short: 'Family Suite', view: 'River view', bed: 'King-size bed + bunk beds', adults: 6, from: 12000,
    liveUrl: 'https://sunriverresort.in/accommodation/family-suite-room/',
    lead: 'One generous river-view room for up to six adults.',
    body: 'A king bed and timber bunk beds share a wide, light-filled room panelled in warm wood, with a lounge chair by the balcony doors. Made for families and friends who would rather stay together.',
    amenities: [...baseAmenities.slice(0, 3), 'Mini bar', ...baseAmenities.slice(3)], photos: ['family-suite-1', 'family-suite-2', 'suite-lounge', 'bath-tub'],
  },
];

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

// Verified on sunriverresort.in (home, about, restaurant pages)
export const features = [
  { title: 'River views', text: 'Balconies and a riverside promenade look straight onto the river and the wooded ridge.', photo: 'river-balcony' },
  { title: 'Swimming pool', text: 'A large, cleanly kept pool set between the mountains — for a quiet swim or a small celebration.', photo: 'pool-mountains' },
  { title: 'In-house restaurant', text: 'Multi-cuisine dining with river and mountain views, open every day from early morning.', photo: 'riverside-terrace' },
  { title: 'Gardens & outdoor seating', text: 'Lawns, stone paths and a gazebo give you somewhere to sit outside at every hour.', photo: 'grounds-gardens' },
];

export const reasons = [
  { title: 'On the river', text: 'River and mountain views from the rooms, the terrace and the grounds.' },
  { title: 'Dining on site', text: 'A multi-cuisine restaurant, open Monday to Sunday, 6:00 am to 10:30 pm.' },
  { title: 'Rooms for two or six', text: 'Executive rooms for couples, and a Family Suite that sleeps six adults.' },
  { title: 'Free parking & Wi-Fi', text: 'Free on-site parking and high-speed Wi-Fi are included with your stay.' },
  { title: 'Room service', text: 'In-room service from the resort team, as and when you need it.' },
  { title: 'Close to nature', text: 'Forest slopes, fresh air and a peaceful setting near Lansdowne.' },
];

export const restaurant = {
  days: 'Monday – Sunday',
  hours: '6:00 am – 10:30 pm',
  price: 'Dishes from ₹200',
  text: 'Experience fine dining at Sunriver Resort’s in-house restaurant, where multi-cuisine flavours meet river and mountain views. Freshly prepared meals, an elegant setting and an unhurried pace — for families, couples and travellers alike.',
};

// Summarised from sunriverresort.in/terms-conditions-2 (last updated 20 Nov 2026).
// The full documents stay authoritative and are linked from the Policies page.
export const policies = [
  { title: 'Reservations', points: ['All reservations are subject to availability.', 'A booking is confirmed only once the advance or full payment is received and the resort has confirmed it.', 'Unconfirmed or incomplete reservations may be cancelled by the resort.'] },
  { title: 'Check-in & check-out', points: ['Standard timings are shared with you at the time of booking.', 'A valid government-issued photo ID is required at check-in.', 'Early check-in and late check-out depend on availability and may carry a charge.'] },
  { title: 'Payment', points: ['Pay through the resort’s approved payment methods.', 'Food, beverages and additional services used during the stay may be charged separately.', 'Applicable government taxes are shared during booking.'] },
  { title: 'Cancellation & refunds', points: ['Request cancellations directly through the resort’s official channels.', 'Refunds depend on the cancellation terms of your booking; charges, if any, are deducted first.', 'No-shows may be treated as cancelled without refund, as per the booking policy.'] },
  { title: 'Children & extra guests', points: ['Include every child and additional guest in the reservation.', 'Extra guests, extra beds or added services may carry a charge.'] },
];
