<script lang="ts">
	import { getActiveHive, listListings, DirectoryNotFoundError } from '$lib/listings';
	import { discoverUrl, DISCOVER_CATEGORIES, readDiscoverParams } from '$lib/discover-query.js';
	import type { Hive, Listing } from '$lib/types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';

	const categoryLabels: Record<string, string> = {
		'food-shopping-dining': 'Food, shopping & dining',
		'healthcare-insurance': 'Healthcare & insurance',
		'housing-household-services': 'Housing & household services',
		'transport-travel-experiences': 'Transport, travel & experiences'
	};

	let status = $state<'loading' | 'success' | 'empty' | 'no-results' | 'invalid-hive' | 'error'>('loading');
	let hive = $state<Hive | null>(null);
	let listings = $state<Listing[]>([]);
	let totalPages = $state(1);
	let totalItems = $state(0);
	let currentParams = $derived(readDiscoverParams(page.url));
	let hiveSlug = $derived(page.params.hive ?? '');
	let loadGeneration = 0;

	$effect(() => {
		const params = currentParams;
		const slug = hiveSlug;
		let disposed = false;
		const generation = ++loadGeneration;
		const hiveRequestKey = `discover-hive-${generation}`;
		const listingsRequestKey = `discover-listings-${generation}`;
		status = 'loading';
		hive = null;
		listings = [];
		totalPages = 1;
		totalItems = 0;

		(async () => {
			try {
				const activeHive = await getActiveHive(slug, hiveRequestKey);
				if (disposed || generation !== loadGeneration) return;
				const result = await listListings({ hiveId: activeHive.id, ...params, requestKey: listingsRequestKey });
				if (disposed || generation !== loadGeneration) return;
				if (params.page > result.totalPages && result.totalPages > 0) {
					await goto(discoverUrl(`/hives/${encodeURIComponent(slug)}/discover`, { ...params, page: result.totalPages }), {
						replaceState: true,
						keepFocus: true,
						noScroll: true,
					});
					return;
				}
				hive = activeHive;
				listings = [...result.items].sort((a, b) => a.name.localeCompare(b.name));
				totalItems = result.totalItems;
				totalPages = result.totalPages;
				status = listings.length ? 'success' : (params.query || params.category ? 'no-results' : 'empty');
			} catch (error) {
				if (disposed || generation !== loadGeneration) return;
				status = error instanceof DirectoryNotFoundError ? 'invalid-hive' : 'error';
			}
		})();

		return () => {
			disposed = true;
			pb.cancelRequest(hiveRequestKey);
			pb.cancelRequest(listingsRequestKey);
		};
	});

	function resultUrl(targetPage: number) {
		return discoverUrl(`/hives/${encodeURIComponent(hiveSlug)}/discover`, { ...currentParams, page: targetPage });
	}

	function verifiedDate(value: string) {
		const date = new Date(value);
		return Number.isNaN(date.valueOf()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
	}
</script>

<svelte:head>
	<title>{hive ? `${hive.name} directory | NooBeehood` : 'Discover | NooBeehood'}</title>
</svelte:head>

<section class="discover-page wrapper" aria-labelledby="discover-heading">
	{#if status === 'invalid-hive'}
		<div class="state error" role="alert">
			<h1 id="discover-heading">Directory not found</h1>
			<p>That neighborhood directory does not exist or is no longer active.</p>
			<a href="/">Return home</a>
		</div>
	{:else if status === 'error'}
		<div class="state error" role="alert">
			<h1 id="discover-heading">Directory unavailable</h1>
			<p>We couldn’t load this directory right now. Please try again later.</p>
		</div>
	{:else}
		<header class="discover-header">
			<p class="eyebrow">{hive?.name ?? 'Neighborhood directory'}</p>
			<h1 id="discover-heading">Discover local services</h1>
			<p>Search trusted services and resources in your neighborhood.</p>
		</header>

		<form class="discover-search" method="GET" aria-label="Search directory">
			<div>
				<label for="directory-search">Search</label>
				<input id="directory-search" name="q" value={currentParams.query} placeholder="Search by name, type, or location" aria-describedby="search-help" />
			<p id="search-help">Search by name, type, or location.</p>
			</div>
			<div>
				<label for="directory-category">Category</label>
				<select id="directory-category" name="category" value={currentParams.category}>
					<option value="">All categories</option>
					{#each DISCOVER_CATEGORIES as category}
						<option value={category}>{categoryLabels[category]}</option>
					{/each}
				</select>
			</div>
			<button class="button primary" type="submit">Search directory</button>
		</form>

		{#if status === 'loading'}
			<p class="state" role="status" aria-live="polite">Loading services…</p>
		{:else if status === 'empty'}
			<p class="state" role="status" aria-live="polite">No services have been added to this directory yet.</p>
		{:else if status === 'no-results'}
			<p class="state" role="status" aria-live="polite">No services match your search. Try a different term or category.</p>
		{:else}
			<p class="results-summary" role="status">{totalItems} {totalItems === 1 ? 'service' : 'services'} found</p>
			<div class="listing-grid">
				{#each listings as listing (listing.id)}
					<article class="listing-card">
						<div class="listing-card-heading"><h2>{listing.name}</h2><span class="listing-type">{listing.listing_type}</span></div>
						<p>{listing.summary}</p>
						<dl>
							{#if listing.location}<div><dt>Location</dt><dd>{listing.location}</dd></div>{/if}
							<div><dt>Verified</dt><dd>{verifiedDate(listing.last_verified_at)}</dd></div>
						</dl>
						<a class="detail-link" href={`/hives/${encodeURIComponent(hiveSlug)}/discover/${encodeURIComponent(listing.slug)}`}>View service details<span aria-hidden="true"> →</span></a>
					</article>
				{/each}
			</div>
			{#if totalPages > 1}
				<nav class="pagination" aria-label="Directory pages">
					{#if currentParams.page > 1}<a class="button" href={resultUrl(currentParams.page - 1)}>Previous</a>{/if}
					<span aria-current="page">Page {currentParams.page} of {totalPages}</span>
					{#if currentParams.page < totalPages}<a class="button" href={resultUrl(currentParams.page + 1)}>Next</a>{/if}
				</nav>
			{/if}
		{/if}
	{/if}
</section>
