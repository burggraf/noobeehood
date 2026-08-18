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

export type ListingCategory =
	| 'food-shopping-dining'
	| 'healthcare-insurance'
	| 'housing-household-services'
	| 'transport-travel-experiences';

export type ListingStatus = 'draft' | 'published' | 'archived';
export type VerificationMethod = 'source_checked' | 'provider_confirmed' | 'editor_checked';

export type Listing = {
	id: string;
	hive: string;
	name: string;
	slug: string;
	category: ListingCategory;
	listing_type: string;
	summary: string;
	location: string;
	search_terms: string;
	website: string;
	phone: string;
	source_url: string;
	verification_method: VerificationMethod;
	last_verified_at: string;
	next_review_at: string;
	status: ListingStatus;
};
