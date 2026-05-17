// Printymand — full editorial data

const ISSUE = {
  number: '07',
  season: 'Spring 2026',
  city: 'Tunis',
  date: 'May / Juin',
  copies: 'Edition of 4,200',
  price: '12 TND',
};

const COVER_DESIGN = {
  id: 901,
  title: 'Carthage Pulse',
  designer: 'Amira Ben Salem',
  designerRank: 'Elite',
  category: 'Culture',
  rating: 4.9,
  sales: 321,
  price: 28,
  leadTime: 2,
  description: 'A graphic tribute to Tunisian heritage reworked as a confident modern poster — fired blues, ochre, and a single defiant terracotta stripe.',
  image: 'https://picsum.photos/seed/carthage-pm/1400/1600',
  tags: ['heritage', 'blue', 'architectural'],
};

const TICKER = [
  'Made in Tunisia',
  'Free returns inside Tunisia',
  'Visa · MasterCard · D17 · Cash on delivery',
  'Local printers in 9 governorates',
  '2-day delivery from Tunis',
  '120+ verified designers',
  'Royalties paid weekly',
  'Carbon-balanced shipping',
];

// Full design catalog used across marketplace + detail
const DESIGNS = [
  COVER_DESIGN,
  { id: 702, title: 'Sahara Type',     designer: 'Karim Dhouib',     designerRank: 'Rising', category: 'Typography', tags: ['type', 'streetwear'], price: 32, rating: 4.7, sales: 210, leadTime: 2, seed: 'sahara-type',   description: 'Clean bilingual lettering set built for streetwear collections and statement pieces.' },
  { id: 703, title: 'Medina Minimal',  designer: 'Amira Ben Salem',  designerRank: 'Elite',  category: 'Minimal',    tags: ['minimal', 'linework'], price: 26, rating: 4.8, sales: 198, leadTime: 3, seed: 'medina-min',    description: 'Minimal linework inspired by old city facades and tiled courtyards.' },
  { id: 704, title: 'Olive Grove',     designer: 'Houda Khalifa',    designerRank: 'Elite',  category: 'Nature',     tags: ['nature', 'olive'],     price: 24, rating: 4.6, sales: 145, leadTime: 2, seed: 'olive-grove',   description: 'Illustrated branch pattern optimized for tote bags, hoodies, and gifting.' },
  { id: 705, title: 'Bab Bhar Nights', designer: 'Karim Dhouib',     designerRank: 'Rising', category: 'Streetwear', tags: ['night', 'poster'],     price: 36, rating: 4.5, sales: 130, leadTime: 3, seed: 'babbhar-night', description: 'Poster-style composition for dark garments and high-contrast accessories.' },
  { id: 706, title: 'Retro Beach Club',designer: 'Yasmine Ferjani',  designerRank: 'Rising', category: 'Retro',      tags: ['retro', 'summer'],     price: 30, rating: 4.7, sales: 162, leadTime: 2, seed: 'beach-club',    description: 'Warm retro palette suited to seasonal drops and souvenir collections.' },
  { id: 707, title: 'Atlas Lines',     designer: 'Karim Dhouib',     designerRank: 'Rising', category: 'Minimal',    tags: ['mountains', 'monoline'], price: 22, rating: 4.4, sales: 98, leadTime: 3, seed: 'atlas-lines',   description: 'Continuous-line illustration of the Atlas range — works at any garment size.' },
  { id: 708, title: 'Souk Pattern 01', designer: 'Amira Ben Salem',  designerRank: 'Elite',  category: 'Culture',    tags: ['tile', 'pattern'],     price: 28, rating: 4.8, sales: 188, leadTime: 2, seed: 'souk-pattern',  description: 'Geometric pattern derived from medina tilework — repeats cleanly across products.' },
  { id: 709, title: 'Sidi Bou Blues',  designer: 'Houda Khalifa',    designerRank: 'Elite',  category: 'Culture',    tags: ['heritage'],            price: 30, rating: 4.9, sales: 254, leadTime: 2, seed: 'sidi-bou',      description: 'A study of cobalt and lime from the most photographed village in the country.' },
  { id: 710, title: 'Couscous Sundays',designer: 'Yasmine Ferjani',  designerRank: 'Rising', category: 'Retro',      tags: ['food', 'illustrated'], price: 26, rating: 4.6, sales: 112, leadTime: 3, seed: 'couscous',      description: 'A loving illustration of the most Tunisian afternoon there is.' },
  { id: 711, title: 'Mosaic 47',        designer: 'Mehdi Karoui',    designerRank: 'Verified', category: 'Minimal',  tags: ['mosaic', 'mono'],      price: 24, rating: 4.5, sales: 76, leadTime: 4, seed: 'mosaic-47',     description: 'Forty-seven hand-cut tile pieces arranged into a single, perfectly imperfect square.' },
  { id: 712, title: 'Jasmine Type',     designer: 'Karim Dhouib',    designerRank: 'Rising', category: 'Typography', tags: ['type', 'floral'],      price: 28, rating: 4.7, sales: 134, leadTime: 3, seed: 'jasmine-type',  description: 'A bilingual display face inspired by the national flower of Tunisia.' },
];

const CATEGORIES = ['All works', 'Culture', 'Typography', 'Minimal', 'Nature', 'Streetwear', 'Retro'];

// Products that can carry a design
const PRODUCTS = [
  { id: 601, name: 'Premium T-Shirt',  basePrice: 28, colors: ['White', 'Black', 'Navy', 'Olive'], sizes: ['S','M','L','XL','XXL'], leadTime: 2, image: 'https://picsum.photos/seed/tee-pm/600/600' },
  { id: 602, name: 'Oversized Hoodie', basePrice: 52, colors: ['Black', 'Sand', 'Brick'], sizes: ['M','L','XL','XXL'], leadTime: 3, image: 'https://picsum.photos/seed/hoodie-pm/600/600' },
  { id: 603, name: 'Ceramic Mug',      basePrice: 21, colors: ['White', 'Black'], sizes: ['11oz'], leadTime: 2, image: 'https://picsum.photos/seed/mug-pm/600/600' },
  { id: 604, name: 'Canvas Tote Bag',  basePrice: 24, colors: ['Sand', 'Black'], sizes: ['One Size'], leadTime: 3, image: 'https://picsum.photos/seed/tote-pm/600/600' },
  { id: 605, name: 'Art Print A2',     basePrice: 32, colors: ['Paper'], sizes: ['A3','A2','A1'], leadTime: 2, image: 'https://picsum.photos/seed/print-pm/600/600' },
];

const COLOR_HEX = {
  'White':  '#F8F4ED', 'Black':  '#1A140D', 'Navy':   '#1B3A5C', 'Olive':  '#6B7A4E',
  'Sand':   '#D6C8A8', 'Brick':  '#7A2E1F', 'Paper':  '#EFE7D8',
};

const PRINTERS = [
  { id: 501, idx: '01', name: 'PrintPro Tunisia',     est: 'est. 2018', loc: 'Tunis',    rank: 'Premium',  rating: 4.9, reviews: 286, fulfillment: 98, lead: 2, fromPrice: 28 },
  { id: 502, idx: '02', name: 'Atelier Couleurs',     est: 'est. 2015', loc: 'Sfax',     rank: 'Gold',     rating: 4.7, reviews: 163, fulfillment: 94, lead: 3, fromPrice: 26 },
  { id: 503, idx: '03', name: 'Studio Press Nabeul',  est: 'est. 2020', loc: 'Nabeul',   rank: 'Verified', rating: 4.5, reviews:  89, fulfillment: 90, lead: 4, fromPrice: 24 },
  { id: 504, idx: '04', name: 'Imprimerie du Sud',    est: 'est. 2012', loc: 'Gabès',    rank: 'Verified', rating: 4.6, reviews: 124, fulfillment: 92, lead: 4, fromPrice: 25 },
  { id: 505, idx: '05', name: 'Maison de la Presse',  est: 'est. 2019', loc: 'Sousse',   rank: 'Gold',     rating: 4.8, reviews: 201, fulfillment: 95, lead: 2, fromPrice: 27 },
];

const GOVERNORATES = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Bizerte','Sousse','Monastir','Mahdia','Sfax','Gabès','Médenine','Tataouine','Kasserine','Sidi Bouzid','Kairouan','Le Kef','Béja','Jendouba','Siliana','Zaghouan','Tozeur','Gafsa','Kébili'];

// Recent orders (used in dashboard + tracking)
const ORDERS = [
  { id: 'PM-1947', placed: 'May 12', design: 'Carthage Pulse',   product: 'Premium T-Shirt',  color: 'Navy', size: 'L', qty: 1, printer: 'PrintPro Tunisia', loc: 'Tunis', total: 32, status: 'In production', stage: 2 },
  { id: 'PM-1948', placed: 'May 11', design: 'Olive Grove',       product: 'Canvas Tote Bag', color: 'Sand', size: 'One Size', qty: 2, printer: 'Atelier Couleurs', loc: 'Sfax', total: 56, status: 'Out for delivery', stage: 3 },
  { id: 'PM-1949', placed: 'May 10', design: 'Sidi Bou Blues',    product: 'Art Print A2',    color: 'Paper', size: 'A2', qty: 1, printer: 'Maison de la Presse', loc: 'Sousse', total: 30, status: 'Delivered', stage: 4 },
  { id: 'PM-1951', placed: 'May 09', design: 'Sahara Type',       product: 'Oversized Hoodie',color: 'Sand', size: 'M', qty: 1, printer: 'PrintPro Tunisia', loc: 'Tunis', total: 58, status: 'Delivered', stage: 4 },
  { id: 'PM-1955', placed: 'May 07', design: 'Souk Pattern 01',   product: 'Ceramic Mug',     color: 'White', size: '11oz', qty: 3, printer: 'Studio Press Nabeul', loc: 'Nabeul', total: 84, status: 'Delivered', stage: 4 },
];

// Designer payouts
const PAYOUTS = [
  { id: 1, ref: 'PO-2024', due: 'May 22', amount: 480, status: 'Pending' },
  { id: 2, ref: 'PO-2017', due: 'May 15', amount: 612, status: 'Paid' },
  { id: 3, ref: 'PO-2009', due: 'May 08', amount: 354, status: 'Paid' },
  { id: 4, ref: 'PO-2001', due: 'May 01', amount: 528, status: 'Paid' },
];

// Tracking stages
const TRACK_STAGES = [
  { key: 'placed',    label: 'Order placed',     blurb: 'Your order was received and queued for production.' },
  { key: 'accepted',  label: 'Printer accepted', blurb: 'A local pressroom accepted the brief.' },
  { key: 'pressing',  label: 'In production',    blurb: 'On the press. Quality-checked by hand before packing.' },
  { key: 'shipping',  label: 'Out for delivery', blurb: 'Couriered from the pressroom. ETA today or tomorrow.' },
  { key: 'delivered', label: 'Delivered',        blurb: 'Arrived. Returns are free for fourteen days.' },
];

// Admin-like platform stats
const PLATFORM_STATS = {
  customers: 4280, designers: 126, printers: 38, orders: 14200, gmv: 412300, royalties: 208000,
};

// Home-page editorial plates (subset of DESIGNS with magazine layout variants)
const PLATES = [
  { id: 702, no: 'F·02', title: 'Sahara Type',      designer: 'Karim Dhouib',    category: 'Typography', price: 32, rating: 4.7, seed: 'sahara-type',   variant: 'feat-wide' },
  { id: 703, no: 'F·03', title: 'Medina Minimal',   designer: 'Amira Ben Salem', category: 'Minimal',    price: 26, rating: 4.8, seed: 'medina-min',    variant: '' },
  { id: 704, no: 'F·04', title: 'Olive Grove',      designer: 'Houda Khalifa',   category: 'Nature',     price: 24, rating: 4.6, seed: 'olive-grove',   variant: '' },
  { id: 705, no: 'F·05', title: 'Bab Bhar Nights',  designer: 'Karim Dhouib',    category: 'Streetwear', price: 36, rating: 4.5, seed: 'babbhar-night', variant: 'feat-double' },
  { id: 706, no: 'F·06', title: 'Retro Beach Club', designer: 'Yasmine Ferjani', category: 'Retro',      price: 30, rating: 4.7, seed: 'beach-club',    variant: 'feat-double' },
  { id: 707, no: 'F·07', title: 'Atlas Lines',      designer: 'Karim Dhouib',    category: 'Minimal',    price: 22, rating: 4.4, seed: 'atlas-lines',   variant: '' },
  { id: 708, no: 'F·08', title: 'Souk Pattern 01',  designer: 'Amira Ben Salem', category: 'Culture',    price: 28, rating: 4.8, seed: 'souk-pattern',  variant: '' },
  { id: 709, no: 'F·09', title: 'Sidi Bou Blues',   designer: 'Houda Khalifa',   category: 'Culture',    price: 30, rating: 4.9, seed: 'sidi-bou',      variant: '' },
];

Object.assign(window, {
  ISSUE, COVER_DESIGN, TICKER, DESIGNS, PLATES, CATEGORIES, PRODUCTS, COLOR_HEX, PRINTERS, GOVERNORATES,
  ORDERS, PAYOUTS, TRACK_STAGES, PLATFORM_STATS,
});
