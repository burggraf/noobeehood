import { pb } from '$lib/pocketbase';
import type { User } from '$lib/types';

export const auth = $state<{ currentUser: User | null }>({
	currentUser: pb.authStore.record as User | null
});

const unsubscribe = pb.authStore.onChange((_token, record) => {
	auth.currentUser = record as User | null;
});

import.meta.hot?.dispose(unsubscribe);

export function logout() {
	pb.authStore.clear();
}
