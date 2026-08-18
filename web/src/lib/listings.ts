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

export async function getActiveHive(slug: string): Promise<Hive> {
	const filter = pb.filter('slug = {:slug} && status = {:status}', {
		slug,
		status: 'active',
	});
	return pb.collection('hives').getFirstListItem<Hive>(filter);
}

export async function listListings(input: {
	hiveId: string;
	query: string;
	category: string;
	page: number;
}): Promise<ListingPage> {
	const { expression, params, page, perPage } = createListingQuery(input);
	const filter = pb.filter(expression, params);
	return pb.collection('listings').getList<Listing>(page, perPage, {
		filter,
		sort: 'name',
	});
}

export async function getListing(hiveId: string, slug: string): Promise<Listing> {
	const filter = pb.filter('hive = {:hive} && slug = {:slug}', { hive: hiveId, slug });
	return pb.collection('listings').getFirstListItem<Listing>(filter);
}
