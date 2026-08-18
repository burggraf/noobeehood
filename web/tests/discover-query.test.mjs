import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverUrl, readDiscoverParams } from '../src/lib/discover-query.js';

test('reads only allowlisted directory params', () => {
  const url = new URL('https://example.test/hives/demo/discover?q=parks&category=healthcare-insurance&page=2');
  assert.deepEqual(readDiscoverParams(url), { query: 'parks', category: 'healthcare-insurance', page: 2 });
  assert.deepEqual(readDiscoverParams(new URL('https://example.test/?category=evil&page=-1')), { query: '', category: '', page: 1 });
  assert.deepEqual(readDiscoverParams(new URL('https://example.test/?q=%20%20parks%20')), { query: 'parks', category: '', page: 1 });
});

test('builds shareable links with encoded params', () => {
  assert.equal(discoverUrl('/hives/demo/discover', { query: 'a & b', category: 'food-shopping-dining', page: 2 }), '/hives/demo/discover?q=a+%26+b&category=food-shopping-dining&page=2');
  assert.equal(discoverUrl('/hives/demo/discover', { query: '', category: '', page: 1 }), '/hives/demo/discover');
});
