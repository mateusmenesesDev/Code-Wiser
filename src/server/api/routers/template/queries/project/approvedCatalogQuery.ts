/** Shared lean catalog include for getApproved and performance benches. */
export const approvedCatalogInclude = {
	category: true,
	technologies: true,
	images: {
		orderBy: {
			order: 'asc' as const
		},
		select: {
			url: true,
			alt: true
		}
	},
	_count: {
		select: {
			tasks: true
		}
	}
};

export const approvedCatalogOrderBy = [
	{ sortOrder: 'asc' as const },
	{ createdAt: 'asc' as const }
];
