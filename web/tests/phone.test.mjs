import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneLinks } from '../src/lib/phone.js';

test('splits slash-separated phone numbers and sanitizes each dial target', () => {
  assert.deepEqual(phoneLinks('(05) 292-3500 / (05) 292-3400'), [
    { label: '(05) 292-3500', href: 'tel:052923500' },
    { label: '(05) 292-3400', href: 'tel:052923400' },
  ]);
});

test('keeps a leading plus and ignores empty phone entries', () => {
  assert.deepEqual(phoneLinks(' +593 99-123-4567 /  / '), [
    { label: '+593 99-123-4567', href: 'tel:+593991234567' },
  ]);
});
