<script lang="ts">
	import '../app.css';
	import { auth, logout } from '$lib/auth.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>NooBeehood | Your new neighborhood</title>
	<meta name="description" content="Find your footing, your people, and your place in a new community." />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to main content</a>

<header class="site-header">
	<div class="wrapper header-inner">
		<a href="/" aria-label="NooBeehood home"><img class="logo" src="/brand/logos/noobeehood-horizontal-full-color.svg" alt="NooBeehood" /></a>
		<nav aria-label="Main navigation">
			<ul>
				<li><a href="/">Home</a></li>
				{#if auth.currentUser}
					<li><a href="/account">Account</a></li>
					<li><button class="link-button" type="button" onclick={logout}>Log out</button></li>
				{:else}
					<li><a href="/login">Log in</a></li>
				{/if}
			</ul>
		</nav>
	</div>
</header>

<main id="main-content">{@render children()}</main>

<footer class="site-footer"><div class="wrapper"><small>Your new neighborhood.</small></div></footer>
