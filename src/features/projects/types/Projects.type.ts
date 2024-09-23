export type Project = {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  participants: number;
  status?: 'Active' | 'Completed';
  credits: number;
};
