/**
 * Catalogue filter that re-orders instead of hiding.
 *
 * A buyer who taps "Slots" gets the slots first, and still sees the rest of
 * the catalogue after them, dimmed. Nothing disappears, so nothing is missed.
 * The move is animated with FLIP (measure, reorder, invert, play) on
 * transform only, and skipped under reduced motion.
 */
export function mountCatalogueFilter(gridId: string, chipSelector: string) {
  const found = document.getElementById(gridId);
  if (!found) return;
  const grid: HTMLElement = found;
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>(chipSelector));
  if (!chips.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = () => Array.from(grid.querySelectorAll<HTMLElement>(':scope > [data-type]'));
  const original = items();

  function apply(type: string, push = true) {
    const before = new Map<HTMLElement, DOMRect>();
    for (const el of items()) before.set(el, el.getBoundingClientRect());

    const order =
      type === 'all'
        ? original
        : [...original.filter((el) => el.dataset.type === type), ...original.filter((el) => el.dataset.type !== type)];

    for (const el of order) {
      el.classList.toggle('is-dim', type !== 'all' && el.dataset.type !== type);
      grid.appendChild(el);
    }
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.filter === type));
    grid.dataset.filtered = type;

    const note = document.querySelector<HTMLElement>('[data-filter-note]');
    if (note) {
      const n = original.filter((el) => el.dataset.type === type).length;
      const label = chips.find((c) => c.dataset.filter === type)?.textContent?.trim().toLowerCase() ?? type;
      note.textContent = type === 'all' ? '' : `${n} ${label} first, the rest of the games below.`;
    }

    if (push) {
      const url = new URL(window.location.href);
      if (type === 'all') url.searchParams.delete('type');
      else url.searchParams.set('type', type);
      history.replaceState(null, '', url);
    }

    if (reduce) return;
    for (const el of order) {
      const a = before.get(el);
      const b = el.getBoundingClientRect();
      if (!a) continue;
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (!dx && !dy) continue;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 560, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
      );
    }
  }

  for (const c of chips) c.addEventListener('click', () => apply(c.dataset.filter!));

  const initial = new URL(window.location.href).searchParams.get('type');
  if (initial && chips.some((c) => c.dataset.filter === initial)) apply(initial, false);
}
