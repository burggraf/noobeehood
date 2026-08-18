<script lang="ts">
	import { page } from '$app/state';
	import { getActiveHive, getListing, DirectoryNotFoundError } from '$lib/listings';
	import { pb } from '$lib/pocketbase';
	import type { Hive, Listing } from '$lib/types';

	const categoryLabels: Record<string, string> = {
		'food-shopping-dining': 'Food, shopping & dining',
		'healthcare-insurance': 'Healthcare & insurance',
		'housing-household-services': 'Housing & household services',
		'transport-travel-experiences': 'Transport, travel & experiences'
	};
	const verificationLabels: Record<string, string> = {
		source_checked: 'Source checked',
		provider_confirmed: 'Provider confirmed',
		editor_checked: 'Editor checked'
	};

	let status = $state<'loading' | 'success' | 'missing' | 'error'>('loading');
	let hive = $state<Hive | null>(null);
	let listing = $state<Listing | null>(null);
	let loadGeneration = 0;

	$effect(() => {
		const slug = page.params.hive ?? '';
		const listingSlug = page.params.listing ?? '';
		let disposed = false;
		const generation = ++loadGeneration;
		const requestKey = `listing-detail-${generation}`;
		status = 'loading';
		hive = null;
		listing = null;

		(async () => {
			try {
				const activeHive = await getActiveHive(slug, requestKey);
				if (disposed || generation !== loadGeneration) return;
				const record = await getListing(activeHive.id, listingSlug, requestKey);
				if (disposed || generation !== loadGeneration) return;
				hive = activeHive;
				listing = record;
				status = 'success';
			} catch (error) {
				if (disposed || generation !== loadGeneration) return;
				status = error instanceof DirectoryNotFoundError ? 'missing' : 'error';
			}
		})();

		return () => {
			disposed = true;
			pb.cancelRequest(requestKey);
		};
	});

	function verifiedDate(value: string) {
		const date = new Date(value);
		return Number.isNaN(date.valueOf()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
	}
</script>

<svelte:head>
	<title>{listing ? `${listing.name} | NooBeehood` : 'Service details | NooBeehood'}</title>
</svelte:head>

<section class="detail-page wrapper" aria-labelledby="detail-heading">
	{#if status === 'loading'}
		<p class="state" role="status" aria-live="polite">Loading service details…</p>
	{:else if status === 'missing'}
		<div class="state error" role="alert">
			<h1 id="detail-heading">Service not found</h1>
			<p>That service is not available in this neighborhood directory.</p>
			<div class="actions"><a class="button" href={`/hives/${encodeURIComponent(page.params.hive ?? '')}/discover`}>Back to directory</a><a class="button" href="/">Home</a></div>
		</div>
	{:else if status === 'error'}
		<div class="state error" role="alert">
			<h1 id="detail-heading">Service unavailable</h1>
			<p>We couldn’t load this service right now. Please try again later.</p>
			<a class="button" href={`/hives/${encodeURIComponent(page.params.hive ?? '')}/discover`}>Back to directory</a>
		</div>
	{:else if listing}
		<a class="back-link" href={`/hives/${encodeURIComponent(hive?.slug ?? '')}/discover`}>← Back to directory</a>
		<header class="detail-header">
			<p class="eyebrow">{hive?.name}</p>
			<h1 id="detail-heading">{listing.name}</h1>
			<p class="listing-type">{listing.listing_type}</p>
			<p class="detail-category">{categoryLabels[listing.category] ?? listing.category}</p>
		</header>
		<div class="detail-content">
			<p class="detail-summary">{listing.summary}</p>
			<dl class="detail-facts">
				{#if listing.location}<div><dt>Location</dt><dd>{listing.location}</dd></div>{/if}
				{#if listing.phone}<div><dt>Phone</dt><dd><a href={`tel:${listing.phone}`}>{listing.phone}</a></dd></div>{/if}
				{#if listing.website}<div><dt>Website</dt><dd><a href={listing.website} rel="noopener noreferrer">{listing.website}</a></dd></div>{/if}
				<div><dt>Verified</dt><dd>{verificationLabels[listing.verification_method] ?? listing.verification_method}, {verifiedDate(listing.last_verified_at)}</dd></div>
				{#if listing.source_url}<div><dt>Source</dt><dd><a href={listing.source_url} rel="noopener noreferrer">{listing.source_url}</a></dd></div>{/if}
			</dl>
			<aside class="detail-reminder"><strong>Confirm directly</strong><p>Details can change. Please confirm hours, availability, and contact information directly before you visit.</p><p>Inclusion in this directory is not an endorsement or recommendation.</p></aside>
		</div>
	{/if}
</section>
