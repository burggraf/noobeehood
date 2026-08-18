import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { listingPayloadMatches, readSeedFiles } from './listing-seed.mjs';

const require = createRequire(new URL('../web/package.json', import.meta.url));
const { default: PocketBase } = require('pocketbase');
const root = new URL('../pocketbase/', import.meta.url);
const files = await readSeedFiles(new URL('seeds/manta-manabi-listings.json', root), new URL('seeds/manta-manabi-search-cases.json', root));
const url = process.env.PUBLIC_POCKETBASE_URL?.trim();
const email = process.env.PB_SUPERUSER_EMAIL?.trim();
const password = process.env.PB_SUPERUSER_PASSWORD;
assert.ok(url && email && password, 'PUBLIC_POCKETBASE_URL, PB_SUPERUSER_EMAIL, and PB_SUPERUSER_PASSWORD are required');

const OPTIONAL_FIELDS = ['location', 'search_terms', 'website', 'phone', 'next_review_at'];
const normalizePayload = (listing, hive) => Object.fromEntries([
  ...Object.entries({ ...listing, hive }),
  ...OPTIONAL_FIELDS.map((field) => [field, listing[field] ?? '']),
]);

const admin = new PocketBase(url);
const createdIds = [];
const snapshots = [];
const rollback = async () => {
  const failures = [];
  for (const id of createdIds) {
    try { await admin.collection('listings').delete(id); } catch (error) { failures.push(`delete ${id}: ${error.message}`); }
  }
  for (const snapshot of snapshots.reverse()) {
    try { await admin.collection('listings').update(snapshot.id, snapshot); } catch (error) { failures.push(`restore ${snapshot.id}: ${error.message}`); }
  }
  if (failures.length) console.error(`rollback failed: ${failures.join('; ')}`);
  return failures;
};

try {
  await admin.collection('_superusers').authWithPassword(email, password);
  const { hive: hiveSlug, listings, searchCases } = files;
  const hive = await admin.collection('hives').getFirstListItem(admin.filter('slug = {:slug} && status = {:status}', { slug: hiveSlug, status: 'active' }));
  const counts = { created: 0, updated: 0, unchanged: 0 };
  for (const listing of listings) {
    const payload = normalizePayload(listing, hive.id);
    const result = await admin.collection('listings').getList(1, 2, { filter: admin.filter('hive = {:hive} && slug = {:slug}', { hive: hive.id, slug: listing.slug }) });
    assert.ok(result.items.length < 2, `duplicate existing slug ${listing.slug}`);
    if (!result.items.length) {
      const created = await admin.collection('listings').create(payload);
      createdIds.push(created.id);
      counts.created++;
      continue;
    }
    const current = result.items[0];
    const same = listingPayloadMatches(current, payload);
    if (same) counts.unchanged++;
    else {
      snapshots.push(structuredClone(current));
      await admin.collection('listings').update(current.id, payload);
      counts.updated++;
    }
  }

  const publicClient = new PocketBase(url);
  for (const test of searchCases) {
    const terms = test.query.trim().toLowerCase().split(/\s+/);
    const clauses = terms.map((_, index) => `(name ~ {:term${index}} || search_terms ~ {:term${index}})`);
    const params = Object.fromEntries(terms.map((term, index) => [`term${index}`, term]));
    const categoryClause = test.category ? ' && category = {:category}' : '';
    const records = await publicClient.collection('listings').getFullList({ filter: publicClient.filter(`hive = {:hive} && status = {:status}${categoryClause} && ${clauses.join(' && ')}`, { ...params, hive: hive.id, status: 'published', ...(test.category ? { category: test.category } : {}) }), sort: 'slug' });
    assert.deepEqual(records.map(({ slug }) => slug), [...test.expected_slugs].sort(), `search acceptance failed: ${test.query}`);
  }
  assert.equal((await publicClient.collection('listings').getFullList({ filter: publicClient.filter('hive = {:hive} && status = {:status}', { hive: hive.id, status: 'published' }) })).length, listings.length);
  console.log(`validated ${listings.length} listings; created ${counts.created}, updated ${counts.updated}, unchanged ${counts.unchanged}; ${searchCases.length} public searches passed`);
} catch (error) {
  console.error(`import failed: ${error.message}`);
  const rollbackFailures = await rollback();
  process.exitCode = rollbackFailures.length ? 2 : 1;
}
