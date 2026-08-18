export const DISCOVER_CATEGORIES = [
  'food-shopping-dining',
  'healthcare-insurance',
  'housing-household-services',
  'transport-travel-experiences',
];

/** @param {URL} url */
export function readDiscoverParams(url) {
  const category = url.searchParams.get('category') || '';
  const rawPage = Number(url.searchParams.get('page') || 1);
  return {
    query: (url.searchParams.get('q') || '').trim(),
    category: DISCOVER_CATEGORIES.includes(category) ? category : '',
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

/** @param {string} path @param {{query: string, category: string, page: number}} input */
export function discoverUrl(path, { query, category, page }) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
