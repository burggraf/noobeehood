import { pb } from './pocketbase';
import { createListingQuery } from './listing-filter.js';
import type { Hive, Listing } from './types';

type ListingPage = {
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
	items: Listing[];
};

export class DirectoryNotFoundError extends Error {
	constructor() {
		super('The requested directory entry was not found.');
		this.name = 'DirectoryNotFoundError';
	}
}

export class DirectoryUnavailableError extends Error {
	constructor() {
		super('The directory is currently unavailable. Please try again.');
		this.name = 'DirectoryUnavailableError';
	}
}

function translateDirectoryError(error: unknown): never {
	if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) {
		throw new DirectoryNotFoundError();
	}
	throw new DirectoryUnavailableError();
}

export async function getActiveHive(slug: string, requestKey?: string): Promise<Hive> {
	const filter = pb.filter('slug = {:slug} && status = {:status}', {
		slug,
		status: 'active',
	});
	try {
		return await pb.collection('hives').getFirstListItem<Hive>(filter, requestKey ? { requestKey } : undefined);
	} catch (error) {
		translateDirectoryError(error);
	}
}

export async function listListings(input: {
	hiveId: string;
	query: string;
	category: string;
	page: number;
	requestKey?: string;
}): Promise<ListingPage> {
	const { expression, params, page, perPage } = createListingQuery(input);
	const filter = pb.filter(expression, params);
	try {
		return await pb.collection('listings').getList<Listing>(page, perPage, {
			filter,
			sort: 'name',
			...(input.requestKey ? { requestKey: input.requestKey } : {}),
		});
	} catch (error) {
		translateDirectoryError(error);
	}
}

export async function getListing(hiveId: string, slug: string, requestKey?: string): Promise<Listing> {
	const filter = pb.filter('hive = {:hive} && slug = {:slug} && status = {:status}', {
		hive: hiveId,
		slug,
		status: 'published'
	});
	try {
		return await pb.collection('listings').getFirstListItem<Listing>(filter, requestKey ? { requestKey } : undefined);
	} catch (error) {
		translateDirectoryError(error);
	}
}
