import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(markdown: string): string {
  const rendered = marked.parse(markdown ?? '', { async: false, gfm: true, breaks: false });
  return sanitizeHtml(rendered, {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'blockquote', 'code'],
    allowedAttributes: { a: ['href', 'title', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attributes) => ({ tagName: 'a', attribs: { ...attributes, rel: 'noopener noreferrer' } }),
    },
  });
}
