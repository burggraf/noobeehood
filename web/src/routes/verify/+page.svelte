<script lang="ts">
	import { onMount } from 'svelte'; import { verifyEmail } from '$lib/auth';
	let status = $state('Checking your verification link…'), error = $state(false);
	onMount(async () => { const token = new URLSearchParams(window.location.search).get('token'); if (!token) { status = 'This verification link is missing its token.'; error = true; return; } try { await verifyEmail(token); status = 'Your email is verified. You can now log in.'; } catch (e) { status = e instanceof Error ? e.message : 'This verification link is invalid or has expired.'; error = true; } });
</script>
<svelte:head><title>Verify email | NooBeehood</title></svelte:head><section class="form-page wrapper"><h1>Verify your email</h1><p class:error role={error ? 'alert' : 'status'}>{status}</p>{#if !error}<p><a class="button primary" href="/login">Log in</a></p>{:else}<p><a href="/login">Return to log in</a></p>{/if}</section>
