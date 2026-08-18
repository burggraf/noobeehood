<script lang="ts">
	import { onMount } from 'svelte'; import { confirmPasswordReset } from '$lib/auth';
	let token = $state(''), password = $state(''), passwordConfirm = $state(''), pending = $state(false), error = $state(''), done = $state(false);
	onMount(() => { token = new URLSearchParams(window.location.search).get('token') ?? ''; if (!token) error = 'This reset link is missing its token.'; });
	async function submit() {
		error = '';
		if (password !== passwordConfirm) { error = 'Passwords do not match.'; return; }
		pending = true;
		try { await confirmPasswordReset(token, password, passwordConfirm); done = true; } catch (e) { error = e instanceof Error ? e.message : 'This reset link is invalid or has expired.'; } finally { pending = false; }
	}
</script>
<svelte:head><title>Choose a new password | NooBeehood</title></svelte:head><section class="form-page wrapper"><h1>Choose a new password</h1>{#if done}<p role="status">Your password was updated. <a href="/login">Log in</a>.</p>{:else if error && !token}<p class="error" role="alert">{error}</p><a href="/forgot-password">Request a new link</a>{:else}<form onsubmit={(e) => { e.preventDefault(); submit(); }} aria-describedby="reset-status"><label for="password">New password</label><input id="password" type="password" autocomplete="new-password" minlength="8" required bind:value={password} /><label for="confirm">Confirm password</label><input id="confirm" type="password" autocomplete="new-password" minlength="8" required bind:value={passwordConfirm} /><button class="button primary" disabled={pending}>{pending ? 'Updating…' : 'Update password'}</button><p id="reset-status" class:error role={error ? 'alert' : 'status'}>{error}</p></form>{/if}</section>
