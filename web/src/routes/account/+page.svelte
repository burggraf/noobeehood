<script lang="ts">
	import { onMount } from 'svelte'; import { auth, logout } from '$lib/auth.svelte'; import { deleteAccount } from '$lib/auth';
	let confirming = $state(false), pending = $state(false), error = $state('');
	onMount(() => { if (!auth.currentUser) window.location.href = '/login'; });
	async function remove() { pending = true; error = ''; try { await deleteAccount(); window.location.href = '/'; } catch (e) { error = e instanceof Error ? e.message : 'We could not delete your account. Please try again.'; pending = false; } }
</script>
<svelte:head><title>Account | NooBeehood</title></svelte:head>
<section class="form-page wrapper"><h1>Your account</h1>{#if auth.currentUser}<dl><dt>Name</dt><dd>{auth.currentUser.name}</dd><dt>Email</dt><dd>{auth.currentUser.email}</dd></dl><div class="actions"><button class="button" type="button" onclick={logout}>Log out</button></div><hr /><h2>Delete account</h2><p>This permanently deletes your account and cannot be undone.</p>{#if !confirming}<button class="button danger" type="button" onclick={() => confirming = true}>Delete my account</button>{:else}<div class="state" aria-describedby="delete-status"><p><strong>Are you sure?</strong> This action is irreversible.</p><button class="button danger" type="button" disabled={pending} onclick={remove}>{pending ? 'Deleting…' : 'Yes, permanently delete'}</button><button class="button" type="button" disabled={pending} onclick={() => confirming = false}>Cancel</button><p id="delete-status" class="error" role="alert">{error}</p></div>{/if}{/if}</section>
