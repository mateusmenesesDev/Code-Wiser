import type { ProjectCard } from '../types/Projects.type';

export const projects: ProjectCard[] = [
	{
		id: '1',
		title: 'E-commerce Platform',
		description:
			'Build a full-stack e-commerce platform with React and Node.js',
		category: 'Web Development',
		difficulty: 'Intermediate',
		mentor: 'John Doe',
		participants: 3,
		maxParticipants: 5,
		status: 'Started',
		completionRate: 30,
		credits: 50,
		details:
			'This project involves creating a fully functional e-commerce platform...',
		startDate: new Date('2023-06-01'),
		endDate: new Date('2023-08-31'),
		technologies: ['React', 'Node.js', 'MongoDB'],
		learningOutcomes: [
			{
				projectTemplateId: '1',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: '1',
				id: '1',
				value: 'Learn React'
			}
		],
		images: [],
		discussions: [],
		milestones: [],
		resources: []
	},
	{
		id: '2',
		title: 'Machine Learning Image Classifier',
		description: 'Develop an image classification model using TensorFlow',
		category: 'Machine Learning',
		difficulty: 'Advanced',
		mentor: 'Jane Smith',
		participants: 2,
		maxParticipants: 3,
		status: 'Not Started',
		completionRate: 0,
		credits: 75,
		details: 'In this project, you will build an image classification model...',
		startDate: new Date('2023-07-01'),
		endDate: new Date('2023-09-30'),
		technologies: ['Python', 'TensorFlow', 'Keras'],
		learningOutcomes: [
			{
				id: '1',
				value: 'Understand image classification',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: '2',
				projectTemplateId: '1'
			}
		],
		images: [],
		discussions: [],
		milestones: [],
		resources: []
	},
	{
		id: '3',
		title: 'Mobile Weather App',
		description:
			'Create a weather application for iOS and Android using React Native',
		category: 'Mobile Development',
		difficulty: 'Beginner',
		mentor: 'Alice Johnson',
		participants: 4,
		maxParticipants: 6,
		status: 'Completed',
		completionRate: 100,
		credits: 0,
		details:
			'Develop a cross-platform mobile app that displays weather information...',
		startDate: new Date('2023-05-01'),
		endDate: new Date('2023-06-30'),
		technologies: ['React Native', 'JavaScript', 'API Integration'],
		learningOutcomes: [
			{
				id: '1',
				value: 'Learn React Native',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: '3',
				projectTemplateId: '1'
			}
		],
		images: [],
		discussions: [],
		milestones: [],
		resources: []
	},
	{
		id: '4',
		title: 'Blockchain Voting System',
		description: 'Implement a secure voting system using blockchain technology',
		category: 'Blockchain',
		difficulty: 'Advanced',
		mentor: 'Bob Williams',
		participants: 3,
		maxParticipants: 4,
		status: 'Not Started',
		completionRate: 0,
		credits: 100,
		details:
			'Create a decentralized voting system using blockchain technology...',
		startDate: new Date('2023-08-01'),
		endDate: new Date('2023-11-30'),
		technologies: ['Solidity', 'Ethereum', 'Web3.js'],
		learningOutcomes: [
			{
				id: '1',
				value: 'Understand blockchain concepts',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: '4',
				projectTemplateId: '1'
			},
			{
				id: '2',
				value: 'Develop smart contracts',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: '4',
				projectTemplateId: '1'
			}
		],
		images: [],
		discussions: [],
		milestones: [],
		resources: []
	},
	{
		id: '5',
		title: 'Task Management API',
		description:
			'Design and build a RESTful API for a task management application',
		category: 'Backend Development',
		difficulty: 'Intermediate',
		mentor: 'Charlie Brown',
		participants: 2,
		maxParticipants: 3,
		status: 'Completed',
		completionRate: 100,
		credits: 0,
		details: 'Develop a robust API for managing tasks, users, and projects...',
		startDate: new Date('2023-04-01'),
		endDate: new Date('2023-05-31'),
		technologies: ['Node.js', 'Express.js', 'MongoDB'],
		learningOutcomes: [
			{
				id: '1',
				value: 'Design RESTful APIs',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: '5',
				projectTemplateId: '1'
			}
		],
		images: [],
		discussions: [],
		milestones: [],
		resources: []
	}
];

export const technologies = [
	'React',
	'Node.js',
	'Python',
	'JavaScript',
	'TypeScript',
	'Angular',
	'Vue.js',
	'Django',
	'Flask',
	'Express.js',
	'MongoDB',
	'PostgreSQL',
	'MySQL',
	'GraphQL',
	'Docker',
	'Kubernetes',
	'AWS',
	'Azure',
	'Google Cloud',
	'TensorFlow',
	'PyTorch',
	'Scikit-learn',
	'Pandas',
	'NumPy',
	'Swift',
	'Kotlin',
	'Flutter',
	'React Native'
];

export const categories = [
	'Web Development',
	'Mobile Development',
	'Machine Learning',
	'Data Science',
	'DevOps',
	'Blockchain',
	'Internet of Things',
	'Cybersecurity',
	'Cloud Computing',
	'Artificial Intelligence',
	'Game Development',
	'Augmented Reality',
	'Virtual Reality',
	'Robotics',
	'Embedded Systems'
];
