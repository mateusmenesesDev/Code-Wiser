import { Resend } from 'resend';
import { env } from '~/env';

const resend = new Resend(env.RESEND_API_KEY);

interface PRRequestedEmailData {
	mentorEmail: string;
	mentorName: string | null;
	memberName: string | null;
	projectName: string;
	taskTitle: string;
	prUrl: string;
	workspaceUrl: string;
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
}

export async function sendPRRequestedEmail(
	data: PRRequestedEmailData
): Promise<void> {
	const {
		mentorEmail,
		mentorName,
		memberName,
		projectName,
		taskTitle,
		prUrl,
		workspaceUrl
	} = data;

	try {
		await resend.emails.send({
			from: 'Code-Wiser <notifications@codewise.online>',
			to: mentorEmail,
			subject: `Code Review Requested: ${taskTitle}`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Code Review Requested</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
						<h1 style="color: white; margin: 0; font-size: 24px;">Code Review Requested</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
						<p style="font-size: 16px; margin-bottom: 20px;">
							Hello ${mentorName ?? 'Mentor'},
						</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							<strong>${memberName ?? 'A member'}</strong> has requested a code review for the task <strong>"${taskTitle}"</strong> in the project <strong>"${projectName}"</strong>.
						</p>
						<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
							<p style="margin: 0 0 10px 0;"><strong>Project:</strong> ${projectName}</p>
							<p style="margin: 0 0 10px 0;"><strong>Task:</strong> ${taskTitle}</p>
							<p style="margin: 0;"><strong>Pull Request:</strong> <a href="${prUrl}" style="color: #667eea; text-decoration: none;">${prUrl}</a></p>
						</div>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${workspaceUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Review in Workspace</a>
						</div>
						<p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
							This is an automated notification from Code-Wiser.
						</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		console.error('Failed to send PR requested email:', error);
		throw error;
	}
}

export async function sendPRResponseEmail(
	data: PRResponseEmailData
): Promise<void> {
	const {
		memberEmail,
		memberName,
		mentorName,
		projectName,
		taskTitle,
		status,
		comment,
		workspaceUrl
	} = data;

	const statusText =
		status === 'APPROVED' ? 'approved' : 'requested changes on';
	const statusColor = status === 'APPROVED' ? '#10b981' : '#f59e0b';

	try {
		await resend.emails.send({
			from: 'Code-Wiser <notifications@codewise.online>',
			to: memberEmail,
			subject: `Code Review ${status === 'APPROVED' ? 'Approved' : 'Changes Requested'}: ${taskTitle}`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Code Review ${status === 'APPROVED' ? 'Approved' : 'Changes Requested'}</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, ${statusColor} 0%, ${status === 'APPROVED' ? '#059669' : '#d97706'} 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
						<h1 style="color: white; margin: 0; font-size: 24px;">Code Review ${status === 'APPROVED' ? 'Approved' : 'Changes Requested'}</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
						<p style="font-size: 16px; margin-bottom: 20px;">
							Hello ${memberName ?? 'Member'},
						</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							<strong>${mentorName ?? 'Your mentor'}</strong> has ${statusText} your code review for the task <strong>"${taskTitle}"</strong> in the project <strong>"${projectName}"</strong>.
						</p>
						${
							comment
								? `
							<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${statusColor};">
								<p style="margin: 0 0 10px 0; font-weight: 600;">Comment:</p>
								<p style="margin: 0; white-space: pre-wrap;">${comment}</p>
							</div>
						`
								: ''
						}
						<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${statusColor};">
							<p style="margin: 0 0 10px 0;"><strong>Project:</strong> ${projectName}</p>
							<p style="margin: 0;"><strong>Task:</strong> ${taskTitle}</p>
						</div>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${workspaceUrl}" style="display: inline-block; background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View in Workspace</a>
						</div>
						<p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
							This is an automated notification from Code-Wiser.
						</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		console.error('Failed to send PR response email:', error);
		throw error;
	}
}
