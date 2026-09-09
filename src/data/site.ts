import { currentEvent } from './events';

/**
 * Site-level content lives here as data, so a number or a link is changed in
 * one file and never by editing markup. `null` means "the owner has not
 * supplied this yet" and the page renders a visible gap rather than a lie.
 */

export const company = {
  name: 'Ace Games',
  legalName: 'ACEGAMES LTD',
  street: 'Georgiou A 13, Stala Court, Flat/Office 3, Germasogeia',
  city: 'Limassol',
  postcode: '4040',
  country: 'Cyprus',
  countryCode: 'CY',
  get address() {
    return `${this.street}, ${this.postcode} ${this.city}, ${this.country}`;
  },
  email: 'info@acegames.io',
  legalEmail: 'legal@acegames.io',
  origin: 'https://acegames.io',
};

/** Keep disabled homepage sections and their navigation in sync. */
export const homepageSections = { integration: false, craft: false };

export const headerNav = [
  { href: '/games', label: 'Games' },
  { href: currentEvent.eventUrl, label: 'Event' },
  { href: '/#about-us', label: 'About Us' },
  { href: '/#our-benefits', label: 'Our Benefits' },
  { href: '/#why-ace-games', label: 'Why Ace Games' },
  { href: '/#faq', label: 'FAQ' },
];

/** Footer navigation is intentionally unchanged by the Header redesign. */
export const nav = [
  { href: '/games', label: 'Games' },
  { href: '/#maths', label: 'Maths' },
  { href: '/#craft', label: 'Studio' },
  { href: '/#integration', label: 'Integration' },
  { href: '/#faq', label: 'FAQ' },
].filter((item) =>
  (homepageSections.integration || item.href !== '/#integration') &&
  (homepageSections.craft || item.href !== '/#craft'),
);

/** One label per intent, used in the nav, the hero and the footer. */
export const CTA = { label: "Let's talk", href: '/#contact' };

export const socialIntro = 'Stay updated with our latest games, news, and partnerships.';

export const social: { label: string; icon: string; href: string | null }[] = [
  { label: 'Instagram', icon: 'ph:instagram-logo', href: null },
  { label: 'LinkedIn', icon: 'ph:linkedin-logo', href: null },
];

/** Operator and aggregator logos, SVG files in public/partners/. Empty renders nothing. */
export const partners: { name: string; src: string }[] = [];

export const proofIntro =
  'Ace Games builds casino games worldwide, combining design, audio, and technology to create high-performance slots and crash games';

export const heroStats = [
  { icon: 'proof-slot-777', value: '30+', label: 'Prototypes' },
  { icon: 'proof-dice', value: '21', label: 'Game Releases' },
  { icon: 'proof-users', value: '1M+', label: 'Players Reached' },
  { icon: 'ph:briefcase-fill', value: 'PRIVATE', label: 'Operator Ecosystem' },
];

export const integration = [
  {
    title: 'Integration',
    icon: 'ph:plugs-connected',
    tint: 'ice',
    rows: [
      { label: 'Method', value: null, hint: 'Direct REST API, seamless wallet, or both' },
      { label: 'Aggregators', value: null, hint: 'The aggregators you are live on' },
      { label: 'Documentation', value: null, hint: 'Link to the integration docs' },
      { label: 'Time to go live', value: null, hint: 'Typical days from credentials to lobby' },
    ],
  },
  {
    title: 'Compliance',
    icon: 'ph:seal-check',
    tint: 'mint',
    rows: [
      { label: 'Testing laboratory', value: null, hint: 'GLI, iTech Labs, BMM, whichever is true' },
      { label: 'Certified to', value: null, hint: 'Standard and certificate numbers' },
      { label: 'Jurisdictions', value: null, hint: 'Markets approved today' },
      { label: 'Legal entity', value: 'ACEGAMES LTD, Limassol, Cyprus', hint: null },
    ],
  },
  {
    title: 'Commercial and product',
    icon: 'ph:handshake',
    tint: 'lemon',
    rows: [
      { label: 'Model', value: null, hint: 'Revenue share, licence fee, or both' },
      { label: 'Languages', value: null, hint: 'Localisations shipped' },
      { label: 'Currencies', value: null, hint: 'Fiat and crypto support' },
      { label: 'Platforms', value: 'HTML5, portrait and landscape, mobile first', hint: null },
    ],
  },
];

export const process = [
  {
    title: 'Expert Engineering Team',
    body: 'Developers, mathematicians, and designers building high-performance casino games for scale and stability.',
    image: 'engineering',
  },
  {
    title: 'Game Strategy & Product Design',
    body: 'We align RTP models, volatility curves, and engagement mechanics with your business goals before development begins.',
    image: 'strategy',
  },
  {
    title: 'Build & Integrate',
    body: 'We develop, test, and integrate games into your platform with fast deployment and stable performance.',
    image: 'integration',
  },
  {
    title: 'Monitor & Optimize',
    body: 'Post-launch analytics and player behavior tracking help improve retention and operator profitability.',
    image: 'optimization',
  },
];

export const why = [
  {
    title: 'Trust at the Core',
    body: 'Built on certified RNG standards and secure architecture, Ace Games delivers fair gameplay, stability, and regulatory readiness.',
    image: 'trust',
  },
  {
    title: 'Innovation That Drives Performance',
    body: 'We create mechanics designed to increase retention, session length, and player lifetime value.',
    image: 'innovation',
  },
  {
    title: 'Retention Engineered for Scale',
    body: 'Our games are built to keep players returning, with mechanics optimized for session time, repeat play, and operator revenue.',
    image: 'retention',
  },
];

export const sectionCopy = {
  portfolioTitle: 'DISCOVER ACE GAMES',
  excellenceTitle: 'Redefining iGaming Excellence',
  futureTitle: 'The Future of Gaming with Ace Games',
  contactTitle: 'Contact our team today',
  contactBody: 'Drop us a message!',
};

/** Questions and answers carried over from the published Ace Games site. */
export const faq: { q: string; a: string | null; hint?: string; extra?: string }[] = [
  {
    q: 'What types of casino games do you develop?',
    a: 'We develop a wide range of casino products including slot games, crash games, and custom mechanics tailored to operator needs. Each game is designed to maximize engagement, retention, and revenue performance.',
  },
  {
    q: 'How long does it take to develop a casino game?',
    a: 'Development timelines depend on complexity. Standard slot projects typically take 3–6 months, while advanced mechanics or custom game concepts may require 6–12 months.',
  },
  {
    q: 'Can I order a fully customized casino game?',
    a: 'Yes. We design fully customized games aligned with your brand, audience, and platform requirements, from theme and visuals to mechanics and reward systems.',
  },
  {
    q: 'How do you ensure game quality and fairness?',
    a: 'Every game undergoes extensive testing including functional QA, performance testing, and RNG validation to ensure fair gameplay and stable performance.',
  },
  {
    q: 'Do you provide post-launch support?',
    a: 'Yes. We provide ongoing support, updates, and performance optimization to ensure games remain competitive and profitable over time.',
  },
];
