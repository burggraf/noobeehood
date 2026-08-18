/** @typedef {'food-shopping-dining'|'healthcare-insurance'|'housing-household-services'|'transport-travel-experiences'} ListingCategory */

const CATEGORIES = new Set([
  'food-shopping-dining',
  'healthcare-insurance',
  'housing-household-services',
  'transport-travel-experiences',
]);

/**
 * Build the bound filter and pagination options for public listing queries.
 * @param {{hiveId: string, query?: string, category?: string, page?: number}} input
 * @returns {{expression: string, params: {hive: string, query: string, category: string}, page: number, perPage: 20}}
 */
export function createListingQuery({ hiveId, query = '', category = '', page = 1 }) {
  const trimmedQuery = query.trim();
  const safeCategory = CATEGORIES.has(category) ? category : '';
  const clauses = ['hive = {:hive}'];

  if (trimmedQuery) {
    clauses.push('(' + ['name', 'listing_type', 'summary', 'location', 'search_terms']
      .map((field) => `${field} ~ {:query}`)
      .join(' || ') + ')');
  }
  if (safeCategory) clauses.push('category = {:category}');

  return {
    expression: clauses.join(' && '),
    params: { hive: hiveId, query: trimmedQuery, category: safeCategory },
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    perPage: 20,
  };
}
