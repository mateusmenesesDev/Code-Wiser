import type { Project } from '../types/Projects.type';

export const projects: Project[] = [
  {
    id: 1,
    title: 'E-commerce Platform',
    description:
      'Build a full-stack e-commerce platform with React and Node.js',
    category: 'Web Development',
    difficulty: 'Intermediate',
    participants: 3,
    status: 'Started',
    credits: 50
  },
  {
    id: 2,
    title: 'Machine Learning Image Classifier',
    description: 'Develop an image classification model using TensorFlow',
    category: 'Machine Learning',
    difficulty: 'Advanced',
    participants: 2,
    credits: 75
  },
  {
    id: 3,
    title: 'Mobile Weather App',
    description:
      'Create a weather application for iOS and Android using React Native',
    category: 'Mobile Development',
    difficulty: 'Beginner',
    participants: 4,
    status: 'Completed',
    credits: 0
  },
  {
    id: 4,
    title: 'Blockchain Voting System',
    description: 'Implement a secure voting system using blockchain technology',
    category: 'Blockchain',
    difficulty: 'Advanced',
    participants: 3,
    status: 'Not Started',
    credits: 100
  },
  {
    id: 5,
    title: 'Task Management API',
    description:
      'Design and build a RESTful API for a task management application',
    category: 'Backend Development',
    difficulty: 'Intermediate',
    participants: 2,
    status: 'Completed',
    credits: 0
  }
];
