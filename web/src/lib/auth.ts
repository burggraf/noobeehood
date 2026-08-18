import { pb } from '$lib/pocketbase';

const safeError = 'Something went wrong. Please try again.';
const invalidLoginError = 'Your email or password may be incorrect, or your email may not be verified.';

function loginMessage(error: unknown) {
	const status = (error as { status?: number })?.status;
	return status === 400 || status === 401 || status === 403 ? invalidLoginError : safeError;
}

export async function signup(name: string, email: string, password: string, passwordConfirm: string) {
	try {
		const user = await pb.collection('users').create({ name, email, password, passwordConfirm });
		await pb.collection('users').requestVerification(user.email);
		return user;
	} catch {
		throw new Error('We could not create your account. Check your details and try again.');
	}
}

export async function verifyEmail(token: string) {
	try {
		await pb.collection('users').confirmVerification(token);
	} catch {
		throw new Error('This verification link is invalid or has expired.');
	}
}

export async function login(email: string, password: string) {
	try {
		return await pb.collection('users').authWithPassword(email, password);
	} catch (error) {
		throw new Error(loginMessage(error));
	}
}

export async function resendVerification(email: string) {
	try {
		await pb.collection('users').requestVerification(email);
	} catch {
		// Keep the response deliberately indistinguishable for unknown accounts.
	}
}

export async function requestPasswordReset(email: string) {
	try {
		await pb.collection('users').requestPasswordReset(email);
	} catch {
		// Keep the response deliberately indistinguishable for unknown accounts.
	}
}

export async function confirmPasswordReset(token: string, password: string, passwordConfirm: string) {
	try {
		await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
	} catch {
		throw new Error('This reset link is invalid or has expired.');
	}
}

export async function deleteAccount() {
	const id = pb.authStore.record?.id;
	if (!id) throw new Error('You must be signed in to delete your account.');
	try {
		await pb.collection('users').delete(id);
		pb.authStore.clear();
	} catch {
		throw new Error('We could not delete your account. Please try again.');
	}
}
