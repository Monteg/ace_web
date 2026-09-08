import {
  CTA as baseCTA,
  faq as baseFaq,
  headerNav as baseHeaderNav,
  heroStats as baseHeroStats,
  integration as baseIntegration,
  nav as baseNav,
  process as baseProcess,
  sectionCopy as baseSectionCopy,
  socialIntro as baseSocialIntro,
  why as baseWhy,
} from '../data/site';
import type { Locale } from './i18n';
import { localizePath, t } from './i18n';

const headerKeys = [
  'header.nav.games',
  'header.nav.event',
  'header.nav.about_us',
  'header.nav.our_benefits',
  'header.nav.why_ace_games',
  'header.nav.faq',
];

export function getSiteContent(locale: Locale) {
  const headerNav = baseHeaderNav.map((item, index) => ({
    ...item,
    href: localizePath(item.href, locale),
    label: t(headerKeys[index], locale),
  }));
  const footerKeyByLabel: Record<string, string> = {
    Games: 'header.nav.games',
    Maths: 'footer.nav.maths',
    Studio: 'footer.nav.studio',
    Integration: 'footer.nav.integration',
    FAQ: 'header.nav.faq',
  };
  const nav = baseNav.map((item) => ({
    ...item,
    href: localizePath(item.href, locale),
    label: footerKeyByLabel[item.label] ? t(footerKeyByLabel[item.label], locale) : item.label,
  }));
  const CTA = { ...baseCTA, label: t('global.cta.lets_talk', locale), href: localizePath(baseCTA.href, locale) };
  const heroStats = baseHeroStats.map((stat, index) => ({
    ...stat,
    label: t(['home.proof.prototypes', 'home.proof.releases', 'home.proof.players', 'home.proof.ecosystem'][index], locale),
  }));
  const why = baseWhy.map((item, index) => ({
    ...item,
    title: t(['home.excellence.trust_title', 'home.excellence.innovation_title', 'home.excellence.retention_title'][index], locale),
    body: t(['home.excellence.trust_body', 'home.excellence.innovation_body', 'home.excellence.retention_body'][index], locale),
  }));
  const process = baseProcess.map((item, index) => ({
    ...item,
    title: t([
      'home.future.engineering_title',
      'home.future.strategy_title',
      'home.future.integration_title',
      'home.future.optimization_title',
    ][index], locale),
    body: t([
      'home.future.engineering_body',
      'home.future.strategy_body',
      'home.future.integration_body',
      'home.future.optimization_body',
    ][index], locale),
  }));
  const faq = baseFaq.map((item, index) => ({
    ...item,
    q: t(`home.faq.${index + 1}.question`, locale),
    a: t(`home.faq.${index + 1}.answer`, locale),
  }));
  const integrationKeys = [
    ['integration', ['method', 'aggregators', 'documentation', 'time']],
    ['compliance', ['testing', 'certified', 'jurisdictions', 'legal']],
    ['commercial', ['model', 'languages', 'currencies', 'platforms']],
  ] as const;
  const integration = baseIntegration.map((group, groupIndex) => ({
    ...group,
    title: t(`home.integration.${integrationKeys[groupIndex][0]}.title`, locale),
    rows: group.rows.map((row, rowIndex) => {
      const prefix = `home.integration.${integrationKeys[groupIndex][0]}.${integrationKeys[groupIndex][1][rowIndex]}`;
      return {
        ...row,
        label: t(`${prefix}.label`, locale),
        hint: row.hint ? t(`${prefix}.hint`, locale) : row.hint,
        value: groupIndex === 2 && rowIndex === 3 ? t(`${prefix}.value`, locale) : row.value,
      };
    }),
  }));

  return {
    CTA,
    headerNav,
    nav,
    heroStats,
    why,
    process,
    faq,
    integration,
    proofIntro: t('home.proof.intro', locale),
    socialIntro: t('footer.social_intro', locale) || baseSocialIntro,
    sectionCopy: {
      ...baseSectionCopy,
      portfolioTitle: t('home.portfolio.title', locale),
      excellenceTitle: t('home.excellence.title', locale),
      futureTitle: t('home.future.title', locale),
      contactTitle: t('contact.title', locale),
      contactBody: t('contact.prompt', locale),
    },
  };
}
