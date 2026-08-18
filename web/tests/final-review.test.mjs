import assert from 'node:assert/strict';
import test from 'node:test';
import { searchResultsAccepted } from '../../scripts/listing-seed.mjs';
import { phoneLinks } from '../src/lib/phone.js';

test('search acceptance requires expected matches but allows additional results', () => {
  assert.equal(searchResultsAccepted(['wanted', 'extra'], ['wanted']), true);
  assert.equal(searchResultsAccepted(['other'], ['wanted']), false);
  assert.equal(searchResultsAccepted([], []), true);
  assert.equal(searchResultsAccepted(['extra'], []), false);
});

test('phone extensions are separate RFC-style tel parameters and labels stay unchanged', () => {
  assert.deepEqual(phoneLinks('593 2 2947400 ext. 2335 / 555 x2335 / 444 ext 2335'), [
    { label: '593 2 2947400 ext. 2335', href: 'tel:59322947400;ext=2335' },
    { label: '555 x2335', href: 'tel:555;ext=2335' },
    { label: '444 ext 2335', href: 'tel:444;ext=2335' },
  ]);
});
