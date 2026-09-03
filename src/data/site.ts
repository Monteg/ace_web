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

export const nav = [
  { href: '/games', label: 'Games' },
  { href: '/#maths', label: 'Maths' },
  { href: '/#craft', label: 'Studio' },
  { href: '/#integration', label: 'Integration' },
  { href: '/#faq', label: 'FAQ' },
];

/** One label per intent, used in the nav, the hero and the footer. */
export const CTA = { label: "Let's talk", href: '/#contact' };

export const social: { label: string; href: string }[] = [
  // The old site linked four accounts belonging to another company.
  // Add the real Ace Games profiles here; an empty list renders nothing.
];

/** Operator and aggregator logos, SVG files in public/partners/. Empty renders nothing. */
export const partners: { name: string; src: string }[] = [];

export const heroStats = [
  {
    icon: 'ph:percent',
    tint: 'mint',
    value: '94.0-97.4%',
    label: 'Published RTP range, configurable per market',
  },
  { icon: 'ph:buildings', tint: 'ice', value: null, label: 'Operators running Ace Games content' },
  {
    icon: 'ph:globe-hemisphere-west',
    tint: 'lemon',
    value: null,
    label: 'Markets we can supply today',
  },
  { icon: 'ph:timer', tint: 'peach', value: null, label: 'Weeks from signed spec to certified build' },
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
    title: 'Scope',
    body: 'We agree the mechanic, the RTP band, the volatility curve and the target market before a single asset is drawn.',
  },
  {
    title: 'Build',
    body: 'Maths, art, client and server run in parallel. You get a playable build early and every sprint after that.',
  },
  {
    title: 'Certify',
    body: 'RNG and maths go to the lab, the build goes through functional and load QA, and the certificate comes back attached to a version.',
  },
  {
    title: 'Launch and tune',
    body: 'We watch session length, bet distribution and retention after launch, and adjust configuration rather than guessing.',
  },
];

export const why = [
  {
    title: 'One integration, the whole catalogue',
    body: 'Connect once to our RGS and every title here, plus everything we ship next, is available to switch on. No second integration, no per-game engineering on your side.',
    feature: true,
  },
  {
    title: 'Maths you can reconfigure',
    body: 'RTP bands, volatility modes and bet ranges are set per operator and per market, not baked into the build. The same title can run at a different RTP in two jurisdictions.',
    feature: false,
  },
  {
    title: 'Built entirely in-house',
    body: 'Maths, art, client, server and RGS are all ours. No licensed third-party engine sits under our games, so nothing in the catalogue carries anyone else’s IP or release schedule.',
    feature: false,
  },
];

/** The six questions that actually decide a B2B games deal. */
export const faq: { q: string; a: string | null; hint?: string; extra?: string }[] = [
  {
    q: 'How do we integrate your games?',
    a: null,
    hint: 'Describe the integration route: direct API and seamless wallet, plus the aggregators you are already live on, and link the documentation.',
  },
  {
    q: 'Who certifies the maths and the RNG?',
    a: null,
    hint: 'Name the laboratory and the standard, and say that certificates are available per title on request.',
    extra:
      'Every build is also put through functional QA, load testing and RNG validation in-house before it leaves us.',
  },
  {
    q: 'Which jurisdictions can we run these in?',
    a: null,
    hint: 'List the markets you are approved for today, and the ones certification is in progress for.',
  },
  {
    q: 'Can RTP and volatility be configured per market?',
    a: 'Yes. RTP bands, volatility modes and bet ranges are configuration, not build constants, so the same title can run at different settings in different jurisdictions. The current published range across the catalogue is 94.0% to 97.4%.',
  },
  {
    q: 'Can you build a custom title for our brand?',
    a: 'Yes. We take the theme, the audience and the commercial target and design the mechanic and the maths around them. Standard slot projects run 3 to 6 months; custom mechanics run 6 to 12.',
  },
  {
    q: 'What happens after launch?',
    a: 'We keep the title updated, watch performance in your lobby and adjust configuration. Support and optimisation are part of the deal, not a separate contract.',
  },
];
