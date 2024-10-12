'use client';

import { useState } from 'react';
import { Card, CardContent } from '~/common/components/card';
import { ProjectHeader } from '~/features/projects/components/ProjectHeader';
import { ProjectMentor } from '~/features/projects/components/ProjectMentor';
import { ProjectProgress } from '~/features/projects/components/ProjectProgress';
import { ProjectStats } from '~/features/projects/components/ProjectStats';
import { ProjectTabs } from '~/features/projects/components/ProjectTabs';
import type { Project } from '~/features/projects/types/Projects.type';

const project: Project = {
	id: 1,
	title: 'E-commerce Platform',
	description: 'Build a full-stack e-commerce platform with React and Node.js',
	category: 'Web Development',
	difficulty: 'Intermediate',
	mentor: 'Alice Johnson',
	participants: 3,
	maxParticipants: 5,
	status: 'Active',
	credits: 50,
	completionRate: 65,
	details: {
		details:
			'This project involves creating a scalable e-commerce platform using React for the frontend and Node.js for the backend. Participants will learn about state management, API integration, and database design.',
		technologies: [
			'React',
			'Node.js',
			'MongoDB',
			'Express',
			'Redux',
			'Stripe API'
		],
		learningOutcomes: [
			'Implement user authentication and authorization',
			'Create product catalog with search and filter functionality',
			'Develop shopping cart and checkout process',
			'Integrate payment gateway',
			'Build admin panel for product and order management',
			'Implement responsive design principles'
		],
		startDate: '2023-07-01',
		endDate: '2023-08-26',
		timeline: '8 weeks'
	},
	milestones: [
		{ id: 1, title: 'Project Setup', completed: true },
		{ id: 2, title: 'User Authentication', completed: true },
		{ id: 3, title: 'Product Catalog', completed: true },
		{ id: 4, title: 'Shopping Cart', completed: false },
		{ id: 5, title: 'Checkout Process', completed: false },
		{ id: 6, title: 'Admin Panel', completed: false },
		{ id: 7, title: 'Final Testing and Deployment', completed: false }
	],
	discussions: [
		{
			id: 1,
			user: 'John Doe',
			message:
				'Excited to start this project! Any suggestions on which state management library to use?',
			timestamp: '2023-06-28T10:30:00Z'
		},
		{
			id: 2,
			user: 'Alice Johnson',
			message:
				"Great question, John! We'll be using Redux for state management in this project.",
			timestamp: '2023-06-28T11:15:00Z'
		},
		{
			id: 3,
			user: 'Emma Wilson',
			message:
				'Has anyone started working on the product catalog component yet?',
			timestamp: '2023-06-29T09:45:00Z'
		}
	],
	resources: [
		{
			id: 1,
			title: 'Project Repository',
			description: 'GitHub repository for the project',
			link: '#'
		},
		{
			id: 2,
			title: 'Project Documentation',
			description: 'Detailed project documentation',
			link: '#'
		},
		{
			id: 3,
			title: 'Recommended Tutorials',
			description: 'Curated list of helpful tutorials',
			link: '#'
		},
		{
			id: 4,
			title: 'Best Practices Guide',
			description: 'Guide for best practices in this project',
			link: '#'
		},
		{
			id: 5,
			title: 'Project Timeline',
			description: 'Detailed project timeline',
			link: '#'
		}
	],
	images: [
		{ id: 1, src: '/images/project1.jpg', alt: 'Project 1' },
		{ id: 2, src: '/images/project2.jpg', alt: 'Project 2' },
		{ id: 3, src: '/images/project3.jpg', alt: 'Project 3' }
	]
};

export default function ProjectPage() {
	const [activeTab, setActiveTab] = useState('overview');

	return (
		<div className="container mx-auto bg-background py-8 text-foreground">
			<div className="px-4">
				<Card className="mb-8">
					<ProjectHeader
						title={project.title}
						description={project.description}
					/>
					<CardContent>
						<ProjectStats
							category={project.category}
							difficulty={project.difficulty}
							participants={project.participants}
							maxParticipants={project.maxParticipants}
							timeline={project.details.timeline}
							credits={project.credits}
						/>
						<ProjectProgress completionRate={project.completionRate} />
						<ProjectMentor mentor={project.mentor} />
					</CardContent>
				</Card>

				<ProjectTabs
					project={project}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
			</div>
		</div>
	);
}
