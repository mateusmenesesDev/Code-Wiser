import { Resend } from 'resend';
import { env } from '~/env';
import { getBaseUrl } from '~/lib/getBaseUrl';

type FeedbackEmailInput = {
	id: string;
	type: string;
	title: string;
	reporterEmail: string;
	reporterName: string | null;
};

const resend = new Resend(env.RESEND_API_KEY);

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export async function sendFeedbackNotification(report: FeedbackEmailInput) {
	if (!env.SUPPORT_EMAIL) {
		console.warn(
			'Feedback notification skipped: SUPPORT_EMAIL is not configured'
		);
		return;
	}

	const adminUrl = `${getBaseUrl()}/admin/feedback?reportId=${encodeURIComponent(report.id)}`;

	await resend.emails.send({
		from: 'Code-Wiser <notifications@codewise.online>',
		to: env.SUPPORT_EMAIL,
		subject: `[${report.type}] ${report.title}`,
		html: `
			<h2>New ${escapeHtml(report.type.toLowerCase())} report</h2>
			<p><strong>Type:</strong> ${escapeHtml(report.type)}</p>
			<p><strong>Title:</strong> ${escapeHtml(report.title)}</p>
			<p><strong>Reporter:</strong> ${escapeHtml(report.reporterName ?? 'Unknown')} &lt;${escapeHtml(report.reporterEmail)}&gt;</p>
			<p><strong>Admin:</strong> <a href="${escapeHtml(adminUrl)}">Open report</a></p>
		`
	});
}
