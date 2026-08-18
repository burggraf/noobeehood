import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVerificationDate } from '../src/lib/date.js';

test('formats date-only verification values in UTC', () => {
	assert.equal(formatVerificationDate('2024-08-18', 'en-US'), 'Aug 18, 2024');
});

test('returns a stable fallback for invalid dates', () => {
	assert.equal(formatVerificationDate('not-a-date', 'en-US'), 'Date unavailable');
});
