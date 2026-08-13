import { Resend } from 'resend';
import { env } from '~/env';
import type { Locale } from '~/i18n/locales';
import en from '~/i18n/messages/en.json';
import ptBR from '~/i18n/messages/pt-BR.json';

function getResend() {
	return new Resend(env.RESEND_API_KEY);
}
const emailMessages = { en: en.email, 'pt-BR': ptBR.email } as const;
type EmailKey = keyof typeof en.email;

type EmailValues = Record<string, string>;

function text(
	locale: Locale | undefined,
	key: EmailKey,
	values: EmailValues = {}
) {
	let message = emailMessages[locale ?? 'pt-BR'][key];
	for (const [name, value] of Object.entries(values)) {
		message = message.replaceAll(`{${name}}`, value);
	}
	return message;
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function emailLayout(
	title: string,
	body: string,
	color: string,
	locale: Locale
) {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${escapeHtml(title)}</title>
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background: linear-gradient(135deg, ${color} 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
				<h1 style="color: white; margin: 0; font-size: 24px;">${escapeHtml(title)}</h1>
			</div>
			<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
				${body}
				<p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
					${escapeHtml(text(locale, 'automated'))}
				</p>
			</div>
		</body>
		</html>
	`;
}

interface PRRequestedEmailData {
	mentorEmail: string;
	mentorName: string | null;
	memberName: string | null;
	projectName: string;
	taskTitle: string;
	prUrl: string;
	workspaceUrl: string;
	locale?: Locale;
}

interface PRResponseEmailData {
	memberEmail: string;
	memberName: string | null;
	mentorName: string | null | undefined;
	projectName: string;
	taskTitle: string;
	status: 'APPROVED' | 'CHANGES_REQUESTED';
	comment?: string | null;
	workspaceUrl: string;
	locale?: Locale;
}

export async function sendPRRequestedEmail(
	data: PRRequestedEmailData
): Promise<void> {
	const locale = data.locale ?? 'pt-BR';
	const title = text(locale, 'requestedTitle');
	const body = `
			<p style="font-size: 16px; margin-bottom: 20px;">
				${escapeHtml(text(locale, 'helloMentor', { name: data.mentorName ?? 'Mentor' }))}
			</p>
			<p style="font-size: 16px; margin-bottom: 20px;">
				<strong>${escapeHtml(data.memberName ?? 'A member')}</strong> ${escapeHtml(text(locale, 'requestedBody', { member: '', task: data.taskTitle, project: data.projectName }))}
			</p>
			<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
				<p style="margin: 0 0 10px 0;"><strong>${escapeHtml(text(locale, 'project'))}:</strong> ${escapeHtml(data.projectName)}</p>
				<p style="margin: 0 0 10px 0;"><strong>${escapeHtml(text(locale, 'task'))}:</strong> ${escapeHtml(data.taskTitle)}</p>
				<p style="margin: 0;"><strong>${escapeHtml(text(locale, 'pullRequest'))}:</strong> <a href="${escapeHtml(data.prUrl)}" style="color: #667eea; text-decoration: none;">${escapeHtml(data.prUrl)}</a></p>
			</div>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${escapeHtml(data.workspaceUrl)}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${escapeHtml(text(locale, 'reviewWorkspace'))}</a>
			</div>
	`;

	try {
		await getResend().emails.send({
			from: 'Code-Wiser <notifications@codewise.online>',
			to: data.mentorEmail,
			subject: text(locale, 'requestedSubject', { taskTitle: data.taskTitle }),
			html: emailLayout(title, body, '#667eea', locale)
		});
	} catch (error) {
		console.error('Failed to send PR requested email:', error);
		throw error;
	}
}

export async function sendPRResponseEmail(
	data: PRResponseEmailData
): Promise<void> {
	const locale = data.locale ?? 'pt-BR';
	const approved = data.status === 'APPROVED';
	const color = approved ? '#10b981' : '#f59e0b';
	const title = text(
		locale,
		approved ? 'responseApprovedTitle' : 'responseChangesTitle'
	);
	const body = `
			<p style="font-size: 16px; margin-bottom: 20px;">
				${escapeHtml(text(locale, 'helloMember', { name: data.memberName ?? 'Member' }))}
			</p>
			<p style="font-size: 16px; margin-bottom: 20px;">
				${escapeHtml(
					text(
						locale,
						approved ? 'responseApprovedBody' : 'responseChangesBody',
						{
							mentor: data.mentorName ?? 'Your mentor',
							task: data.taskTitle,
							project: data.projectName
						}
					)
				)}
			</p>
			${data.comment ? `<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${color};"><p style="margin: 0 0 10px 0; font-weight: 600;">${escapeHtml(text(locale, 'comment'))}:</p><p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.comment)}</p></div>` : ''}
			<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${color};">
				<p style="margin: 0 0 10px 0;"><strong>${escapeHtml(text(locale, 'project'))}:</strong> ${escapeHtml(data.projectName)}</p>
				<p style="margin: 0;"><strong>${escapeHtml(text(locale, 'task'))}:</strong> ${escapeHtml(data.taskTitle)}</p>
			</div>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${escapeHtml(data.workspaceUrl)}" style="display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${escapeHtml(text(locale, 'viewWorkspace'))}</a>
			</div>
	`;

	try {
		await getResend().emails.send({
			from: 'Code-Wiser <notifications@codewise.online>',
			to: data.memberEmail,
			subject: text(
				locale,
				approved ? 'responseApprovedSubject' : 'responseChangesSubject',
				{ taskTitle: data.taskTitle }
			),
			html: emailLayout(title, body, color, locale)
		});
	} catch (error) {
		console.error('Failed to send PR response email:', error);
		throw error;
	}
}
