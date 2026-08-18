<script lang="ts">
	import { signup } from '$lib/auth';
	let name = $state(''), email = $state(''), password = $state(''), passwordConfirm = $state('');
	let pending = $state(false), error = $state(''), success = $state('');
	async function submit() { if (pending) return; pending = true; error = ''; success = ''; try { await signup(name, email, password, passwordConfirm); success = 'Account created. Check your email to verify it before logging in.'; } catch (e) { error = e instanceof Error ? e.message : 'We could not create your account. Please try again.'; } finally { pending = false; } }
</script>
<svelte:head><title>Create account | NooBeehood</title></svelte:head>
<section class="form-page wrapper"><h1>Create your account</h1><p>Join your neighborhood.</p>
<form onsubmit={(e) => { e.preventDefault(); submit(); }} aria-describedby="form-status">
<label for="name">Name</label><input id="name" name="name" autocomplete="name" required bind:value={name} />
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required bind:value={email} />
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required bind:value={password} />
<label for="passwordConfirm">Confirm password</label><input id="passwordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required bind:value={passwordConfirm} />
<button class="button primary" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
<p id="form-status" class:error role={error ? 'alert' : 'status'}>{error || success}</p>
</form><p>Already a member? <a href="/login">Log in</a>.</p></section>
