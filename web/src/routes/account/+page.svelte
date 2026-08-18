<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, logout } from '$lib/auth.svelte';
	import { deleteAccount } from '$lib/auth';

	let confirming = $state(false), pending = $state(false), deleted = $state(false);
	let currentPassword = $state(''), error = $state('');

	$effect(() => { if (!auth.currentUser && !pending && !deleted) void goto('/login', { replaceState: true }); });

	function handleLogout() { logout(); }
	function cancelDelete() { currentPassword = ''; error = ''; confirming = false; }
	async function remove() {
		if (pending) return;
		pending = true; error = '';
		let succeeded = false;
		try { await deleteAccount(currentPassword); deleted = true; succeeded = true; } catch (e) { error = e instanceof Error ? e.message : 'We could not delete your account. Please try again.'; } finally { currentPassword = ''; pending = false; }
		if (succeeded) try { await goto('/'); } catch { /* The deleted state provides a truthful navigation fallback. */ }
	}
</script>
<svelte:head><title>Account | NooBeehood</title></svelte:head>
<section class="form-page wrapper"><h1>Your account</h1>{#if deleted}<p role="status">Your account has been permanently deleted.</p><p><a class="button primary" href="/">Return home</a></p>{:else if auth.currentUser}<dl><dt>Name</dt><dd>{auth.currentUser.name}</dd><dt>Email</dt><dd>{auth.currentUser.email}</dd></dl><div class="actions"><button class="button" type="button" onclick={handleLogout}>Log out</button></div><hr /><h2>Delete account</h2><p>This permanently deletes your account and cannot be undone.</p>{#if !confirming}<button class="button danger" type="button" onclick={() => confirming = true}>Delete my account</button>{:else}<form class="state" aria-describedby="delete-status" onsubmit={(e) => { e.preventDefault(); remove(); }}><p><strong>Are you sure?</strong> This action is irreversible.</p><label for="current-password">Current password</label><input id="current-password" type="password" autocomplete="current-password" required bind:value={currentPassword} /><button class="button danger" disabled={pending || !currentPassword}>{pending ? 'Deleting…' : 'Yes, permanently delete'}</button><button class="button" type="button" disabled={pending} onclick={cancelDelete}>Cancel</button><p id="delete-status" class="error" role={error ? 'alert' : 'status'}>{error}</p></form>{/if}{:else}<p role="status">Redirecting to log in…</p>{/if}</section>
