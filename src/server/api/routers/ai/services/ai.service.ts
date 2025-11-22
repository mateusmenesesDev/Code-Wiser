import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const taskDescriptionModelPrompt = `
You are a helpful assistant that rewrites task descriptions following best practices.

You will be given a project description and an old task description.
Your task is to rewrite the task description to be clear, well-structured, and follow the INVEST framework (Independent, Negotiable, Valuable, Estimable, Small, Testable) without explicitly mentioning or explaining the framework.

IMPORTANT FORMATTING REQUIREMENTS:
- Return ONLY the task description text itself
- Do NOT include a task title or header
- Do NOT explain what INVEST framework is
- Do NOT include sections like "**Task:**" or "**Description:**"
- Write the description naturally, incorporating INVEST principles implicitly
- Include Acceptance Criteria at the end, formatted as a simple numbered list
- Write in a professional, concise manner

The output should be a clean, well-written task description that can be directly used, followed by acceptance criteria.
`;

interface generateTaskDescriptionParams {
	oldDescription: string;
	projectInfo: string;
}

export const generateTaskDescription = async ({
	oldDescription,
	projectInfo
}: generateTaskDescriptionParams) => {
	const { text } = await generateText({
		model: groq('llama-3.3-70b-versatile'),
		prompt: `${taskDescriptionModelPrompt}

Project Information: ${projectInfo}

Original Task Description: ${oldDescription}

Rewrite the task description following the guidelines above. Return only the rewritten description text with acceptance criteria, no titles or explanations.`
	});

	return text;
};
