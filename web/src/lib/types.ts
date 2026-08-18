export type Hive = {
	id: string;
	name: string;
	slug: string;
	status: 'active' | 'inactive';
};

export type User = {
	id: string;
	name: string;
	email: string;
	is_beekeeper: boolean;
};

export type MembershipRole = 'queen' | 'worker' | 'member';
export type MembershipStatus = 'active' | 'invited' | 'suspended';
