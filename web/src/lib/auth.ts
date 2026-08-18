import { pb } from '$lib/pocketbase';

const safeError = 'Something went wrong. Please try again.';
const invalidLoginError = 'Your email or password may be incorrect, or your email may not be verified.';

function loginMessage(error: unknown) {
	const status = (error as { status?: number })?.status;
	return status === 400 || status === 401 || status === 403 ? invalidLoginError : safeError;
}

function isOperationalEmailFailure(error: unknown) {
	const status = (error as { status?: unknown })?.status;
	return typeof status !== 'number' || status === 0 || status === 429 || status >= 500;
}

export async function signup(name: string, email: string, password: string, passwordConfirm: string) {
	let user;
	try {
		user = await pb.collection('users').create({ name, email, password, passwordConfirm });
	} catch {
		throw new Error('We could not create your account. Check your details and try again.');
	}

	try {
		await pb.collection('users').requestVerification(user.email);
		return { user, verificationSent: true };
	} catch {
		return { user, verificationSent: false };
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
	} catch (error) {
		if (isOperationalEmailFailure(error)) throw new Error('We could not send a verification email right now. Please try again.');
	}
}

export async function requestPasswordReset(email: string) {
	try {
		await pb.collection('users').requestPasswordReset(email);
	} catch (error) {
		if (isOperationalEmailFailure(error)) throw new Error('We could not send reset instructions right now. Please try again.');
	}
}

export async function confirmPasswordReset(token: string, password: string, passwordConfirm: string) {
	try {
		await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
	} catch {
		throw new Error('This reset link is invalid or has expired.');
	}
}

export async function deleteAccount(password: string) {
	const user = pb.authStore.record;
	if (!user?.id || !user.email) throw new Error('You must be signed in to delete your account.');
	try {
		await pb.collection('users').authWithPassword(user.email, password);
	} catch (error) {
		const status = (error as { status?: number })?.status;
		if (status === 400 || status === 401 || status === 403) throw new Error('Your password is incorrect. Your account was not deleted.');
		throw new Error('We could not verify your password. Please try again.');
	}
	try {
		await pb.collection('users').delete(user.id);
		pb.authStore.clear();
	} catch {
		throw new Error('We could not delete your account. Please try again.');
	}
}
