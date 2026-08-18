import test from 'node:test';
import assert from 'node:assert/strict';
import { listingPayloadMatches } from '../../scripts/listing-seed.mjs';

test('matches date-only seed values with PocketBase timestamps and empty optionals', () => {
  const payload = {
    hive: 'hive-id',
    location: '',
    phone: '',
    last_verified_at: '2026-08-18',
    next_review_at: '',
  };
  const current = {
    hive: 'hive-id',
    location: null,
    phone: undefined,
    last_verified_at: '2026-08-18 00:00:00.000Z',
    next_review_at: null,
  };

  assert.equal(listingPayloadMatches(current, payload), true);
});

test('does not hide real listing or date changes', () => {
  const payload = { name: 'Original', last_verified_at: '2026-08-18' };

  assert.equal(listingPayloadMatches({ name: 'Changed', last_verified_at: '2026-08-18 00:00:00.000Z' }, payload), false);
  assert.equal(listingPayloadMatches({ name: 'Original', last_verified_at: '2026-08-19 00:00:00.000Z' }, payload), false);
});
