import { readFile } from 'node:fs/promises';

export const HIVE_SLUG = 'manta-manabi';
export const CATEGORIES = new Set(['food-shopping-dining', 'healthcare-insurance', 'housing-household-services', 'transport-travel-experiences']);
const VERIFICATION_METHODS = new Set(['source_checked', 'provider_confirmed', 'editor_checked']);
const STATUSES = new Set(['draft', 'published', 'archived']);
const FIELDS = new Set(['name', 'slug', 'category', 'listing_type', 'summary', 'location', 'search_terms', 'website', 'phone', 'source_url', 'verification_method', 'last_verified_at', 'next_review_at', 'status']);
const REQUIRED = ['name', 'slug', 'category', 'listing_type', 'summary', 'source_url', 'verification_method', 'last_verified_at', 'status'];
const LIMITS = { name: 160, slug: 160, listing_type: 120, summary: 500, location: 240, search_terms: 1000, phone: 80 };

const fail = (message) => { throw new Error(message); };
const validUrl = (value) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.host); } catch { return false; } };
const validDate = (value) => { if (!/^\d{4}-\d{2}-\d{2}(?:[ T].*)?$/.test(value)) return false; const [year, month, day] = value.slice(0, 10).split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; };

export function validateListings(records) {
  if (!Array.isArray(records)) fail('listings must be an array');
  const slugs = new Set();
  records.forEach((listing, index) => {
    const prefix = `listing ${index}`;
    if (!listing || typeof listing !== 'object' || Array.isArray(listing)) fail(`${prefix} must be an object`);
    for (const field of REQUIRED) if (typeof listing[field] !== 'string' || !listing[field].trim()) fail(`${prefix} missing ${field}`);
    for (const field of Object.keys(listing)) if (!FIELDS.has(field)) fail(`${prefix} unexpected field ${field}`);
    if (!CATEGORIES.has(listing.category)) fail(`${prefix} category`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(listing.slug)) fail(`${prefix} slug`);
    if (slugs.has(listing.slug)) fail(`duplicate slug ${listing.slug}`); slugs.add(listing.slug);
    for (const [field, limit] of Object.entries(LIMITS)) if (listing[field]?.length > limit) fail(`${prefix} ${field} too long`);
    for (const field of ['website', 'source_url']) if (listing[field] !== undefined && !validUrl(listing[field])) fail(`${prefix} ${field}`);
    for (const field of ['last_verified_at', 'next_review_at']) if (listing[field] !== undefined && !validDate(listing[field])) fail(`${prefix} ${field}`);
    if (!VERIFICATION_METHODS.has(listing.verification_method)) fail(`${prefix} verification_method`);
    if (!STATUSES.has(listing.status)) fail(`${prefix} status`);
  });
  return records;
}

export function validateSearchCases(cases, listings) {
  if (!Array.isArray(cases)) fail('search cases must be an array');
  if (!Array.isArray(listings)) fail('listings must be an array');
  const bySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  const queries = new Set();
  cases.forEach((test, index) => {
    if (!test || typeof test !== 'object' || Array.isArray(test)) fail(`search case ${index} must be an object`);
    if (typeof test.query !== 'string' || !test.query.trim() || queries.has(test.query.trim().toLowerCase())) fail(`search case ${index} query`);
    queries.add(test.query.trim().toLowerCase());
    if (test.category !== undefined && !CATEGORIES.has(test.category)) fail(`search case ${index} category`);
    if (!Array.isArray(test.expected_slugs)) fail(`search case ${index} expected_slugs`);
    for (const slug of test.expected_slugs) {
      const listing = bySlug.get(slug);
      if (!listing) fail(`expected slug ${slug} missing from listings`);
      if (listing.status !== 'published') fail(`expected slug ${slug} is not published`);
    }
    for (const field of Object.keys(test)) if (!['query', 'category', 'expected_slugs'].includes(field)) fail(`search case ${index} unexpected field ${field}`);
  });
  return cases;
}

export async function readSeedFiles(listingsPath, casesPath) {
  const [listingsJson, casesJson] = await Promise.all([readFile(listingsPath, 'utf8'), readFile(casesPath, 'utf8')]);
  const listings = validateListings(JSON.parse(listingsJson));
  const searchCases = validateSearchCases(JSON.parse(casesJson), listings);
  return { hive: HIVE_SLUG, listings, searchCases };
}
