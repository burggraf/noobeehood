import test from 'node:test';
import assert from 'node:assert/strict';
import { createListingQuery } from '../src/lib/listing-filter.js';

const hiveId = 'hive-id';

test('always requires a hive', () => {
  const result = createListingQuery({ hiveId, query: '', category: '', page: 1 });
  assert.match(result.expression, /^hive = \{:hive\}/);
  assert.equal(result.params.hive, hiveId);
  assert.equal(result.perPage, 20);
});

test('omits blank search', () => {
  const result = createListingQuery({ hiveId, query: '  \t', category: '', page: 1 });
  assert.equal(result.expression, 'hive = {:hive}');
  assert.equal(result.params.query, '');
});

test('searches all five listing fields', () => {
  const result = createListingQuery({ hiveId, query: 'market', category: '', page: 1 });
  for (const field of ['name', 'listing_type', 'summary', 'location', 'search_terms']) {
    assert.match(result.expression, new RegExp(`${field} ~ \{:query\}`));
  }
  assert.equal(result.params.query, 'market');
});

test('includes allowlisted categories and omits unknown categories', () => {
  const allowed = createListingQuery({ hiveId, query: '', category: 'healthcare-insurance', page: 1 });
  assert.match(allowed.expression, /category = \{:category\}/);
  assert.equal(allowed.params.category, 'healthcare-insurance');

  const unknown = createListingQuery({ hiveId, query: '', category: 'category\' || true', page: 1 });
  assert.equal(unknown.expression, 'hive = {:hive}');
  assert.equal(unknown.params.category, '');
});

test('keeps malicious query text out of the expression', () => {
  const query = "x' || status != 'draft";
  const result = createListingQuery({ hiveId, query, category: '', page: 1 });
  assert.equal(result.expression.includes(query), false);
  assert.equal(result.params.query, query);
});

test('normalizes invalid pages to page one', () => {
  for (const page of [0, -2, NaN, Infinity, '3', undefined]) {
    const result = createListingQuery({ hiveId, query: '', category: '', page });
    assert.equal(result.page, 1);
  }
  assert.equal(createListingQuery({ hiveId, query: '', category: '', page: 3 }).page, 3);
});
