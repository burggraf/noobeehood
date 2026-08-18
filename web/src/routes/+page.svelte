<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import type { Hive } from '$lib/types';

	let hives = $state<Hive[]>([]);
	let status = $state<'loading' | 'success' | 'empty' | 'error'>('loading');
	let errorMessage = $state('');

	onMount(() => {
		let disposed = false;
		const requestKey = `homepage-hives-${Date.now()}`;

		pb.collection('hives').getFullList<Hive>({ filter: 'status = "active"', requestKey }).then((records) => {
			if (disposed) return;
			hives = records;
			status = records.length ? 'success' : 'empty';
		}).catch((error: unknown) => {
			if (disposed) return;
			status = 'error';
			errorMessage = error instanceof Error ? error.message : 'We could not load neighborhoods right now.';
		});

		return () => {
			disposed = true;
			pb.cancelRequest(requestKey);
		};
	});
</script>

<section class="hero">
	<div class="wrapper">
		<p class="eyebrow">Welcome to NooBeehood</p>
		<h1>Your new neighborhood.</h1>
		<p class="hero-copy">Find your footing, your people, and your place in a new community.</p>
		<div class="actions" aria-label="Account actions">
			<a class="button primary" href="/signup">Create an account</a>
			<a class="button" href="/login">Log in</a>
		</div>
	</div>
</section>

<section class="hives" aria-labelledby="hives-heading">
	<div class="wrapper">
		<h2 id="hives-heading">Find your hive</h2>
		{#if status === 'loading'}
			<p class="state" role="status">Loading neighborhoods…</p>
		{:else if status === 'error'}
			<p class="state error" role="alert">We could not load neighborhoods. {errorMessage}</p>
		{:else if status === 'empty'}
			<p class="state">No active neighborhoods yet. Check back soon.</p>
		{:else}
			<div class="hive-card">
				<h3>Manta + Manabí</h3>
				<p>A first place to find local answers, useful guides, and community life.</p>
			</div>
		{/if}
	</div>
</section>
