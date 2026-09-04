import type { ImageMetadata } from 'astro';

export interface EventTeamMember {
  id: string;
  name: string;
  position: string | null;
  expertise: string;
  photo: ImageMetadata | null;
  linkedin: string;
  bookingUrl: string | null;
}

/** Event content and campaign settings. End is exclusive, in Lisbon local time. */
export const sbcLisbon = {
  id: 'sbc-lisbon-2026',
  eventName: 'SBC Lisbon',
  eventLocation: 'Lisbon',
  eventUrl: '/event',
  timeZone: 'Europe/Lisbon',
  campaignStart: '2026-09-01T00:00:00+01:00',
  eventStart: '2026-09-29T00:00:00+01:00',
  eventEnd: '2026-10-02T00:00:00+01:00',
  headline: 'Meet Ace Games at SBC Lisbon',
  tagline: 'Games shaped by 15+ years in game development and tested with real players.',
  introduction: 'Meet the Ace Games team in Lisbon to explore the portfolio, discuss a tailored game for your business, and talk through the route to launch.',
  bookingLabel: 'Book a meeting',
  bookingAnchor: '#book-meeting',
  // Set a real booking URL here, or on an individual team member, when supplied.
  bookingUrl: null as string | null,
  whyTitle: 'Why meet Ace Games?',
  reasons: [
    {
      title: 'Explore a different kind of game',
      body: 'Ace combines familiar gaming mechanics with iGaming formats: intuitive to enter, with the risk and reward of gambling, and fresh enough to keep players engaged and coming back for the gameplay itself.',
    },
    {
      title: 'Tested with real players',
      body: 'We test games in our own live environment before taking them to external operators. This gives us real data on how each game performs with players: from return rates, bet patterns, and session activity to how individual mechanics work in practice.',
    },
    {
      title: 'Exclusive games for your brand',
      body: 'Our team develops branded games around your goals, audience, and market. We handle the full process from concept to a launch-ready title in one month.',
    },
  ],
  stats: [
    { value: '25+', label: 'games' },
    { value: '15+', label: 'years of game-development experience' },
    { value: '600K+', label: 'unique players testing our games' },
  ],
  gamesTitle: "A taste of what we’ll bring to Lisbon",
  featuredGames: [
    { id: 'ace-city', name: 'Ace City', description: 'Crime, style, and rising stakes. A cinematic urban slot where every win builds the multiplier.' },
    { id: 'zeus-run', name: 'Zeus Runner', description: 'A fast, high-stakes runner built around split-second choices. Pick a path, build the multiplier, and decide how far you’re willing to push before cashing out.' },
    { id: 'plinko-game', name: 'Plinko', description: 'A familiar arcade mechanic with adjustable risk. Choose the board setup, drop the balls, and see which multiplier slots they land in.' },
    { id: 'chicken-doom', name: 'Chicken Doom', description: 'Take the chicken through a series of enemy encounters, with each successful step unlocking a higher multiplier. Cash out after any safe step or keep going for more.' },
  ],
  teamTitle: 'Meet the team in Lisbon',
  team: [
    { id: 'angelina', name: 'Angelina', position: null, photo: null, expertise: 'Partnerships, markets, and game boutique', linkedin: 'https://www.linkedin.com/in/astasiuk', bookingUrl: null },
    { id: 'timur', name: 'Timur', position: null, photo: null, expertise: 'Game development, product, and player behaviour', linkedin: 'https://www.linkedin.com/in/timur-rafiev-52593a120/', bookingUrl: null },
    { id: 'mykola', name: 'Mykola', position: null, photo: null, expertise: 'Gaming engineering, scale, and pragmatic technology', linkedin: 'https://www.linkedin.com/in/mykola-dorofii/', bookingUrl: null },
  ] satisfies EventTeamMember[],
  topicsTitle: 'What can we talk about in Lisbon?',
  topics: [
    { title: 'Player acquisition & retention', description: 'How game mechanics, formats, and visuals can help keep acquired players engaged.' },
    { title: 'Custom games', description: 'Games built around a specific brand, market, and audience.' },
    { title: 'Game formats', description: 'Mechanics for different player behaviours, markets, and product goals.' },
    { title: 'Integration & distribution', description: 'Ways to bring Ace Games to your platform.' },
  ],
  bookingTitle: 'Book your meeting in Lisbon',
  bookingIntro: 'Meet the Ace Games team during SBC Lisbon.',
  bookingDescription: 'Choose a convenient time below and tell us what you’d like to discuss. We’ll confirm the meeting details directly.',
};

export type EventData = typeof sbcLisbon;
export const currentEvent = sbcLisbon;
