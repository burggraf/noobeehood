import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

if (!PUBLIC_POCKETBASE_URL) {
	throw new Error('PUBLIC_POCKETBASE_URL is required to connect to PocketBase');
}

try {
	const url = new URL(PUBLIC_POCKETBASE_URL);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
} catch {
	throw new Error(`PUBLIC_POCKETBASE_URL is invalid: ${PUBLIC_POCKETBASE_URL}`);
}

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
