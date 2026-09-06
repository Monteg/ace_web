import fs from 'node:fs';
import path from 'node:path';
import { faq as localFaq } from '../data/site';
import { defaultLocale } from './config';

export interface FaqItem { id: string; question: string; answerMarkdown: string; }

function readLocaleFile(locale: string): Record<string, unknown> {
  const target = path.resolve(process.cwd(), 'src', 'generated', 'cms', 'site', `${locale}.json`);
  return fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : {};
}

export function getFaqItems(locale = defaultLocale): FaqItem[] {
  if ((import.meta.env.CONTENT_SOURCE ?? 'local') !== 'cms') {
    return localFaq.filter((item) => item.a).map((item, index) => ({ id: `local-${index + 1}`, question: item.q, answerMarkdown: item.a ?? '' }));
  }
  const requested = readLocaleFile(locale).__faq;
  const english = readLocaleFile(defaultLocale).__faq;
  const requestedById = new Map((Array.isArray(requested) ? requested : []).map((item: any) => [item.id, item]));
  return (Array.isArray(english) ? english : []).map((fallback: any) => {
    const item = requestedById.get(fallback.id) as any;
    if (!item && locale !== defaultLocale) console.warn(`[i18n fallback] ${locale}:faq:${fallback.id} -> ${defaultLocale}`);
    const value = item ?? fallback;
    return { id: fallback.id, question: value.question, answerMarkdown: value.answer_markdown };
  });
}
