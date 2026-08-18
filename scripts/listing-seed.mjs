import { readFile } from 'node:fs/promises';

export const CATEGORIES = new Set(['food-shopping-dining', 'healthcare-insurance', 'housing-household-services', 'transport-travel-experiences']);
const FIELDS = new Set(['name', 'slug', 'category', 'listing_type', 'summary', 'location', 'search_terms', 'website', 'phone', 'source_url', 'verification_method', 'last_verified_at', 'next_review_at', 'status']);
const REQUIRED = ['name', 'slug', 'category', 'listing_type', 'summary', 'source_url', 'verification_method', 'last_verified_at', 'status'];
const URL_FIELDS = ['website', 'source_url'];
const DATE_FIELDS = ['last_verified_at', 'next_review_at'];
const LIMITS = { name: 160, slug: 160, listing_type: 120, summary: 500, location: 240, search_terms: 1000, phone: 80 };

const fail = (message) => { throw new Error(message); };
const validUrl = (value) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.host); } catch { return false; } };
const validDate = (value) => { if (!/^\d{4}-\d{2}-\d{2}(?:[ T].*)?$/.test(value)) return false; const [year, month, day] = value.slice(0, 10).split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; };

export function validateListingSeed(seed) {
  if (!seed || seed.hive_slug !== 'manta-manabi' || !Array.isArray(seed.listings)) fail('invalid listing seed shape');
  const slugs = new Set();
  seed.listings.forEach((listing, index) => {
    const prefix = `listing ${index}`;
    for (const field of REQUIRED) if (typeof listing[field] !== 'string' || !listing[field].trim()) fail(`${prefix} missing ${field}`);
    for (const field of Object.keys(listing)) if (!FIELDS.has(field)) fail(`${prefix} unexpected field ${field}`);
    if (!CATEGORIES.has(listing.category)) fail(`${prefix} category`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(listing.slug)) fail(`${prefix} slug`);
    if (slugs.has(listing.slug)) fail(`duplicate slug ${listing.slug}`); slugs.add(listing.slug);
    for (const [field, limit] of Object.entries(LIMITS)) if (listing[field]?.length > limit) fail(`${prefix} ${field} too long`);
    for (const field of URL_FIELDS) if (listing[field] !== undefined && !validUrl(listing[field])) fail(`${prefix} ${field}`);
    for (const field of DATE_FIELDS) if (listing[field] !== undefined && !validDate(listing[field])) fail(`${prefix} ${field}`);
    if (!['source_checked', 'provider_confirmed', 'editor_checked'].includes(listing.verification_method)) fail(`${prefix} verification_method`);
    if (!['draft', 'published', 'archived'].includes(listing.status)) fail(`${prefix} status`);
  });
  return { ...seed, slugs };
}

export function validateSearchCases(seed, listingSlugs) {
  if (!seed || seed.hive_slug !== 'manta-manabi' || !Array.isArray(seed.search_cases)) fail('invalid search cases');
  for (const test of seed.search_cases) {
    if (typeof test.query !== 'string' || !test.query.trim() || !Array.isArray(test.expected_slugs)) fail('invalid search case');
    for (const slug of test.expected_slugs) if (!listingSlugs.has(slug)) fail(`expected slug ${slug} missing from listings`);
  }
  return seed;
}

export async function readSeedFiles(listingsPath, casesPath) {
  const [listings, cases] = await Promise.all([readFile(listingsPath, 'utf8'), readFile(casesPath, 'utf8')]);
  const listingSeed = validateListingSeed(JSON.parse(listings));
  return { listingSeed, cases: validateSearchCases(JSON.parse(cases), listingSeed.slugs) };
}
