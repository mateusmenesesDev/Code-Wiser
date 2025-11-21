export const TEMPLATE_JSON_EXAMPLE = {
	title: 'E-Commerce Platform',
	description:
		'Build a full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.',
	category: 'Web Development',
	difficulty: 'INTERMEDIATE',
	accessType: 'FREE',
	technologies: [
		'React',
		'Node.js',
		'PostgreSQL',
		'TypeScript',
		'Tailwind CSS'
	],
	figmaProjectUrl: 'https://figma.com/file/example',
	minParticipants: 1,
	maxParticipants: 4,
	credits: 0,
	expectedDuration: '8-12 weeks',
	methodology: 'SCRUM',
	milestones: [
		'User authentication and authorization',
		'Product catalog and search functionality',
		'Shopping cart and checkout process',
		'Payment integration',
		'Order management system'
	],
	learningOutcomes: [
		'Full-stack development with React and Node.js',
		'Database design and management',
		'Payment gateway integration',
		'State management and API design',
		'Deployment and DevOps practices'
	],
	preRequisites: [
		'Basic knowledge of JavaScript/TypeScript',
		'Understanding of React fundamentals',
		'Familiarity with REST APIs',
		'Basic database concepts'
	],
	images: [
		{
			url: 'https://example.com/image1.png',
			alt: 'Project homepage',
			order: 0
		}
	]
};

export const TASKS_SPRINTS_EPICS_JSON_EXAMPLE = {
	epics: [
		{
			title: 'User Authentication',
			description: 'Implement user registration, login, and authentication flow'
		},
		{
			title: 'Product Management',
			description: 'Create product catalog with search and filtering'
		}
	],
	sprints: [
		{
			title: 'Sprint 1: Foundation',
			description: 'Set up project structure and authentication',
			startDate: '2024-01-01',
			endDate: '2024-01-14',
			order: 0
		},
		{
			title: 'Sprint 2: Core Features',
			description: 'Implement product catalog and shopping cart',
			startDate: '2024-01-15',
			endDate: '2024-01-28',
			order: 1
		}
	],
	tasks: [
		{
			title: 'Set up authentication API',
			description: 'Create endpoints for user registration and login',
			type: 'USER_STORY',
			priority: 'HIGH',
			status: 'BACKLOG',
			epicTitle: 'User Authentication',
			sprintTitle: 'Sprint 1: Foundation',
			storyPoints: 5,
			tags: ['backend', 'auth'],
			order: 0
		},
		{
			title: 'Design login UI',
			description: 'Create login and registration forms',
			type: 'TASK',
			priority: 'MEDIUM',
			status: 'BACKLOG',
			epicTitle: 'User Authentication',
			sprintTitle: 'Sprint 1: Foundation',
			storyPoints: 3,
			tags: ['frontend', 'ui'],
			order: 1
		},
		{
			title: 'Create product model',
			description: 'Design database schema for products',
			type: 'TASK',
			priority: 'HIGH',
			status: 'BACKLOG',
			epicTitle: 'Product Management',
			sprintTitle: 'Sprint 2: Core Features',
			storyPoints: 8,
			tags: ['backend', 'database'],
			order: 0
		}
	]
};
