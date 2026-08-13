import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
	Resend: class {
		emails = { send };
	}
}));

vi.mock('~/env', () => ({
	env: { RESEND_API_KEY: 'test-key' }
}));

import { sendPRRequestedEmail, sendPRResponseEmail } from './emailService';

describe('email localization', () => {
	beforeEach(() => send.mockReset());

	it('sends a Portuguese PR request when the mentor prefers Portuguese', async () => {
		send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

		await sendPRRequestedEmail({
			mentorEmail: 'mentor@example.com',
			mentorName: 'Mentor',
			memberName: 'Aluno',
			projectName: 'Projeto',
			taskTitle: 'Tarefa',
			prUrl: 'https://github.com/org/repo/pull/1',
			workspaceUrl: 'https://codewise.online/workspace/project',
			locale: 'pt-BR'
		});

		expect(send).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: 'Review de código solicitada: Tarefa',
				html: expect.stringContaining('Review de código solicitada')
			})
		);
	});

	it('falls back to Portuguese for a response without a locale', async () => {
		send.mockResolvedValue({ data: { id: 'email-2' }, error: null });

		await sendPRResponseEmail({
			memberEmail: 'member@example.com',
			memberName: 'Aluno',
			mentorName: 'Mentor',
			projectName: 'Projeto',
			taskTitle: 'Tarefa',
			status: 'APPROVED',
			workspaceUrl: 'https://codewise.online/workspace/project'
		});

		expect(send).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: 'Review de código aprovada: Tarefa',
				html: expect.stringContaining('Esta é uma notificação automática')
			})
		);
	});
});
