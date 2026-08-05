import type { ExerciseChallengeDifficulty } from '@prisma/client';

type SeedChallenge = {
	title: string;
	slug: string;
	difficulty: ExerciseChallengeDifficulty;
	description: string;
	setupInstructions: string;
	acceptanceCriteria: string;
	sortOrder: number;
};

export type SeedExerciseTrack = {
	name: string;
	slug: string;
	description: string;
	repoUrl: string;
	sortOrder: number;
	isPublished: boolean;
	challenges: SeedChallenge[];
};

/**
 * Launch track set for Exercises.
 * Repo URLs are placeholders — replace with real cloneable repos before / after publish.
 */
export const EXERCISE_TRACKS: SeedExerciseTrack[] = [
	{
		name: 'React',
		slug: 'react',
		description:
			'Practice React fundamentals with small, testable UI challenges.',
		repoUrl: 'https://github.com/code-wiser/react-exercises',
		sortOrder: 0,
		isPublished: true,
		challenges: [
			{
				title: 'Counter',
				slug: 'counter',
				difficulty: 'EASY',
				description:
					'Build a counter component with increment, decrement, and reset actions.',
				setupInstructions:
					'Clone the track repo, open the counter challenge folder, install dependencies, and run the challenge tests.',
				acceptanceCriteria:
					'Increment/decrement update the displayed value, reset returns to zero, and the challenge tests pass.',
				sortOrder: 0
			},
			{
				title: 'Todo List',
				slug: 'todo-list',
				difficulty: 'MEDIUM',
				description:
					'Build a todo list that can add, complete, and remove items.',
				setupInstructions:
					'Work in the todo-list challenge folder. Keep state local and follow the provided test IDs.',
				acceptanceCriteria:
					'Users can add items, toggle completion, remove items, and all challenge tests pass.',
				sortOrder: 0
			}
		]
	},
	{
		name: 'JavaScript',
		slug: 'javascript',
		description:
			'Strengthen core JavaScript skills with focused language exercises.',
		repoUrl: 'https://github.com/code-wiser/javascript-exercises',
		sortOrder: 1,
		isPublished: true,
		challenges: [
			{
				title: 'Array Utilities',
				slug: 'array-utilities',
				difficulty: 'EASY',
				description:
					'Implement helper functions for mapping, filtering, and reducing arrays without relying on the built-in methods in the exercise files.',
				setupInstructions:
					'Clone the track repo, open the array-utilities challenge, and run the unit tests.',
				acceptanceCriteria:
					'All required utility functions are implemented and the challenge tests pass.',
				sortOrder: 0
			},
			{
				title: 'Async Fetch Wrapper',
				slug: 'async-fetch-wrapper',
				difficulty: 'MEDIUM',
				description:
					'Create a small async wrapper that handles success and failure paths for HTTP requests.',
				setupInstructions:
					'Work in the async-fetch-wrapper challenge folder and use the provided mocks in tests.',
				acceptanceCriteria:
					'Successful responses return parsed data, failures surface clear errors, and tests pass.',
				sortOrder: 0
			}
		]
	},
	{
		name: 'TypeScript',
		slug: 'typescript',
		description:
			'Practice typing real-world TypeScript patterns used in product code.',
		repoUrl: 'https://github.com/code-wiser/typescript-exercises',
		sortOrder: 2,
		isPublished: true,
		challenges: [
			{
				title: 'Typed API Client',
				slug: 'typed-api-client',
				difficulty: 'EASY',
				description:
					'Type a small API client so request and response payloads are checked by the compiler.',
				setupInstructions:
					'Clone the track repo, open typed-api-client, and run typecheck plus the unit tests.',
				acceptanceCriteria:
					'The client is fully typed without unsafe casts and the challenge tests pass.',
				sortOrder: 0
			},
			{
				title: 'Discriminated Unions',
				slug: 'discriminated-unions',
				difficulty: 'MEDIUM',
				description:
					'Model a set of domain events with discriminated unions and narrow them safely.',
				setupInstructions:
					'Work in the discriminated-unions challenge folder and keep the provided event shapes.',
				acceptanceCriteria:
					'All event variants are handled exhaustively and the challenge tests pass.',
				sortOrder: 0
			}
		]
	},
	{
		name: 'Lógica de programação',
		slug: 'logica-de-programacao',
		description:
			'Algorithm and problem-solving practice with progressively harder puzzles.',
		repoUrl: 'https://github.com/code-wiser/logic-exercises',
		sortOrder: 3,
		isPublished: true,
		challenges: [
			{
				title: 'Two Sum',
				slug: 'two-sum',
				difficulty: 'EASY',
				description:
					'Given an array of numbers and a target, return the indices of the two numbers that add up to the target.',
				setupInstructions:
					'Clone the track repo, open the two-sum challenge, and run the unit tests.',
				acceptanceCriteria:
					'The solution returns correct index pairs for the sample cases and the challenge tests pass.',
				sortOrder: 0
			},
			{
				title: 'Valid Parentheses',
				slug: 'valid-parentheses',
				difficulty: 'MEDIUM',
				description:
					'Determine whether a string of brackets is valid using proper nesting and matching rules.',
				setupInstructions:
					'Work in the valid-parentheses challenge folder and implement the required function signature.',
				acceptanceCriteria:
					'Valid and invalid bracket strings are classified correctly and the challenge tests pass.',
				sortOrder: 0
			}
		]
	},
	{
		name: 'Next.js',
		slug: 'nextjs',
		description:
			'Practice Next.js app patterns used in modern full-stack React apps.',
		repoUrl: 'https://github.com/code-wiser/nextjs-exercises',
		sortOrder: 4,
		isPublished: true,
		challenges: [
			{
				title: 'Server Component Page',
				slug: 'server-component-page',
				difficulty: 'EASY',
				description:
					'Build a simple App Router page that fetches data in a server component and renders it.',
				setupInstructions:
					'Clone the track repo, open the server-component-page challenge, install dependencies, and run the tests.',
				acceptanceCriteria:
					'The page renders fetched data on the server and the challenge tests pass.',
				sortOrder: 0
			},
			{
				title: 'Route Handler CRUD',
				slug: 'route-handler-crud',
				difficulty: 'MEDIUM',
				description:
					'Implement route handlers for listing and creating resources with basic validation.',
				setupInstructions:
					'Work in the route-handler-crud challenge folder and follow the provided API contract.',
				acceptanceCriteria:
					'GET and POST handlers behave as specified and the challenge tests pass.',
				sortOrder: 0
			}
		]
	},
	{
		name: 'Python',
		slug: 'python',
		description:
			'Practice Python fundamentals and clean problem-solving with tests.',
		repoUrl: 'https://github.com/code-wiser/python-exercises',
		sortOrder: 5,
		isPublished: true,
		challenges: [
			{
				title: 'FizzBuzz',
				slug: 'fizzbuzz',
				difficulty: 'EASY',
				description:
					'Implement FizzBuzz for a given range using clear, readable Python.',
				setupInstructions:
					'Clone the track repo, open the fizzbuzz challenge, create a virtualenv if needed, and run pytest.',
				acceptanceCriteria:
					'Multiples of 3, 5, and 15 are handled correctly and the challenge tests pass.',
				sortOrder: 0
			},
			{
				title: 'Word Frequency',
				slug: 'word-frequency',
				difficulty: 'MEDIUM',
				description:
					'Count word frequencies in a text, ignoring punctuation and normalizing case.',
				setupInstructions:
					'Work in the word-frequency challenge folder and run the provided pytest suite.',
				acceptanceCriteria:
					'Frequencies match the expected counts for sample texts and the challenge tests pass.',
				sortOrder: 0
			}
		]
	}
];
