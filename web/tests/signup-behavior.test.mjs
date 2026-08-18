import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const auth = await readFile(new URL('../src/lib/auth.ts', import.meta.url), 'utf8');
const signup = await readFile(new URL('../src/routes/signup/+page.svelte', import.meta.url), 'utf8');

assert.match(auth, /verificationSent: true/);
assert.match(auth, /verificationSent: false/);
assert.match(signup, /verificationSent/);
assert.match(signup, /Account created, but we could not send a verification email/);
assert.match(signup, /href="\/login"/);
