<script lang="ts">
	import { requestPasswordReset } from '$lib/auth'; let email = $state(''), pending = $state(false), sent = $state(false);
	async function submit() { pending = true; await requestPasswordReset(email); sent = true; pending = false; }
</script>
<svelte:head><title>Forgot password | NooBeehood</title></svelte:head><section class="form-page wrapper"><h1>Reset your password</h1>{#if sent}<p role="status">If an account uses that email, you’ll receive reset instructions shortly.</p><p><a href="/login">Return to log in</a></p>{:else}<p>Enter your email and we’ll send instructions if there’s an account.</p><form onsubmit={(e) => { e.preventDefault(); submit(); }}><label for="email">Email</label><input id="email" type="email" autocomplete="email" required bind:value={email} /><button class="button primary" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</button></form>{/if}</section>
