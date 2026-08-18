import assert from 'node:assert/strict';
import { validateListings, validateSearchCases, readSeedFiles } from './listing-seed.mjs';

const root = new URL('../pocketbase/', import.meta.url);
const files = await readSeedFiles(new URL('seeds/manta-manabi-listings.json', root), new URL('seeds/manta-manabi-search-cases.json', root));
assert.equal(files.hive, 'manta-manabi');
assert.equal(files.listings.length, 10);
assert.equal(files.searchCases.length, 6);

const valid = [{ name: 'Example', slug: 'example', category: 'food-shopping-dining', listing_type: 'shop', summary: 'A listing', location: 'Manta', search_terms: 'food', website: 'https://example.com', source_url: 'https://example.com/source', verification_method: 'source_checked', last_verified_at: '2026-08-18', next_review_at: '2026-11-18', status: 'published' }];
assert.doesNotThrow(() => validateListings(valid));
assert.throws(() => validateListings({ listings: valid }), /array/);
assert.throws(() => validateListings([{ ...valid[0], category: 'bogus' }]), /category/);
assert.throws(() => validateListings([valid[0], { ...valid[0] }]), /duplicate slug/);
assert.throws(() => validateListings([{ ...valid[0], source_url: '' }]), /source_url/);
assert.throws(() => validateListings([{ ...valid[0], last_verified_at: 'not-a-date' }]), /last_verified_at/);

const cases = [{ query: 'food', category: 'food-shopping-dining', expected_slugs: ['example'] }];
assert.doesNotThrow(() => validateSearchCases(cases, valid));
assert.throws(() => validateSearchCases([{ query: 'x', category: 'bogus', expected_slugs: [] }], valid), /category/);
assert.throws(() => validateSearchCases([{ query: 'x', expected_slugs: ['example'] }], [{ ...valid[0], status: 'draft' }]), /published/);
assert.throws(() => validateSearchCases([{ query: 'x', expected_slugs: ['missing'] }], valid), /expected slug/);
assert.throws(() => validateSearchCases([{ query: 'x', expected_slugs: [] }, { query: ' x ', expected_slugs: [] }], valid), /query/);
console.log('seed contract positive and negative cases passed');
