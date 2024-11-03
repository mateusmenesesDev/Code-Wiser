export {};

declare global {
	interface ClerkAuthorization {
		permission:
			| 'org:project:create'
			| 'org:project:update'
			| 'org:project:read_approval';
		role: 'org:admin' | 'org:mentor' | 'org:member';
	}
}

declare global {
	interface CustomJwtSessionClaims {
		membership?: Record<string, string>;
	}
}
