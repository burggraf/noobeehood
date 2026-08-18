import assert from 'node:assert/strict';
import { validateListingSeed, validateSearchCases, readSeedFiles } from './listing-seed.mjs';

const root = new URL('../pocketbase/', import.meta.url);
const files = await readSeedFiles(new URL('seeds/manta-manabi-listings.json', root), new URL('seeds/manta-manabi-search-cases.json', root));
assert.equal(files.listingSeed.listings.length, 10);
assert.equal(files.cases.search_cases.length, 6);

const valid = {
  hive_slug: 'manta-manabi',
  listings: [{ name: 'Example', slug: 'example', category: 'food-shopping-dining', listing_type: 'shop', summary: 'A listing', location: 'Manta', search_terms: 'food', website: 'https://example.com', source_url: 'https://example.com/source', verification_method: 'source_checked', last_verified_at: '2026-08-18', next_review_at: '2026-11-18', status: 'published' }],
};
assert.doesNotThrow(() => validateListingSeed(valid));
assert.throws(() => validateListingSeed({ ...valid, listings: [{ ...valid.listings[0], category: 'bogus' }] }), /category/);
assert.throws(() => validateListingSeed({ ...valid, listings: [{ ...valid.listings[0] }, { ...valid.listings[0] }] }), /duplicate slug/);
assert.throws(() => validateListingSeed({ ...valid, listings: [{ ...valid.listings[0], source_url: '' }] }), /source_url/);
assert.throws(() => validateListingSeed({ ...valid, listings: [{ ...valid.listings[0], last_verified_at: 'not-a-date' }] }), /last_verified_at/);
assert.throws(() => validateSearchCases({ hive_slug: 'manta-manabi', search_cases: [{ query: 'x', expected_slugs: ['missing'] }] }, new Set(['known'])), /expected slug/);
console.log('negative validator cases passed');
