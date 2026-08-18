<script lang="ts">
	import { requestPasswordReset } from '$lib/auth';
	let email = $state(''), pending = $state(false), sent = $state(false), error = $state('');
	async function submit() {
		if (pending) return;
		pending = true; error = '';
		try { await requestPasswordReset(email); sent = true; } catch (e) { error = e instanceof Error ? e.message : 'We could not send reset instructions right now. Please try again.'; } finally { pending = false; }
	}
</script>
<svelte:head><title>Forgot password | NooBeehood</title></svelte:head><section class="form-page wrapper"><h1>Reset your password</h1>{#if sent}<p role="status">If an account uses that email, you’ll receive reset instructions shortly.</p><p><a href="/login">Return to log in</a></p>{:else}<p>Enter your email and we’ll send instructions if there’s an account.</p><form onsubmit={(e) => { e.preventDefault(); submit(); }} aria-describedby="reset-request-status"><label for="email">Email</label><input id="email" type="email" autocomplete="email" required bind:value={email} /><button class="button primary" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</button><p id="reset-request-status" class="error" role={error ? 'alert' : 'status'}>{error}</p></form>{/if}</section>
