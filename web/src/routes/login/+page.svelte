<script lang="ts">
	import { login, resendVerification } from '$lib/auth';
	let email = $state(''), password = $state(''), pending = $state(false), resendPending = $state(false), error = $state(''), status = $state('');
	async function submit() { if (pending) return; pending = true; error = ''; status = ''; try { await login(email, password); window.location.href = '/account'; } catch (e) { error = e instanceof Error ? e.message : 'Your email or password may be incorrect, or your email may not be verified.'; } finally { pending = false; } }
	async function resend() {
		if (resendPending) return;
		resendPending = true; error = ''; status = '';
		try { await resendVerification(email); status = 'If an account uses that email, a verification message is on its way.'; } catch (e) { error = e instanceof Error ? e.message : 'We could not send a verification email right now. Please try again.'; } finally { resendPending = false; }
	}
</script>
<svelte:head><title>Log in | NooBeehood</title></svelte:head>
<section class="form-page wrapper"><h1>Log in</h1>
<form onsubmit={(e) => { e.preventDefault(); submit(); }} aria-describedby="form-status">
<label for="email">Email</label><input id="email" type="email" autocomplete="email" required bind:value={email} />
<label for="password">Password</label><input id="password" type="password" autocomplete="current-password" required bind:value={password} />
<button class="button primary" disabled={pending}>{pending ? 'Logging in…' : 'Log in'}</button>
<p id="form-status" class:error role={error ? 'alert' : 'status'}>{error || status}</p>
</form>
<div class="actions"><button class="button" type="button" disabled={resendPending || !email} onclick={resend}>{resendPending ? 'Sending…' : 'Resend verification'}</button><a href="/forgot-password">Forgot password?</a></div>
<p>New here? <a href="/signup">Create an account</a>.</p></section>
