import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loadFixture } from './setup/database';

test('completes the main project and code-review journey', async ({
	page,
	browser
}) => {
	const fixture = await loadFixture();

	await page.goto('/projects');
	await expect(page.getByRole('button', { name: /test user/i })).toBeVisible({
		timeout: 30_000
	});
	const projectCard = page
		.getByTestId('project-card')
		.filter({ hasText: fixture.templateTitle });
	await expect(projectCard).toBeVisible();
	const onboardingDialog = page.locator('#driver-popover-content');
	if (await onboardingDialog.isVisible()) {
		await page.evaluate(() => {
			(
				document.querySelector('.driver-popover-close-btn') as HTMLElement
			)?.click();
		});
		await expect(onboardingDialog).toBeHidden();
	}
	await projectCard.getByRole('button', { name: 'Start Project' }).click();
	await expect(page).toHaveURL(/\/workspace\/[^/]+$/, { timeout: 30_000 });
	await expect(
		page.getByRole('heading', { name: fixture.projectTitle })
	).toBeVisible();
	await page.evaluate(() => {
		(
			document.querySelector('.driver-popover-close-btn') as HTMLElement
		)?.click();
	});
	await expect(page.locator('#driver-popover-content')).toBeHidden();

	await page.getByTestId('create-task-button').click();
	const taskDialog = page.getByTestId('task-dialog');
	await expect(taskDialog).toBeVisible();
	await taskDialog.getByTestId('task-title-input').fill(fixture.taskTitle);
	await taskDialog.getByTestId('save-task-button').click();
	await expect(taskDialog).toBeHidden();

	const taskCard = page.locator(
		`[data-testid="task-card"][data-task-title="${fixture.taskTitle}"]`
	);
	await expect(taskCard).toBeVisible();
	await taskCard.click();
	await expect(taskDialog).toBeVisible();

	await taskDialog.getByRole('combobox', { name: 'Task assignees' }).click();
	await page
		.getByRole('option', { name: fixture.userName, exact: true })
		.click();
	await taskDialog.getByRole('combobox', { name: 'Task status' }).click();
	await page.getByRole('option', { name: 'In Progress', exact: true }).click();
	await taskDialog.getByTestId('save-task-button').click();
	await expect(taskDialog).toBeHidden();
	await taskCard.click();
	await expect(taskDialog).toBeVisible();

	await taskDialog
		.getByTestId('new-comment-input')
		.last()
		.fill(fixture.comment);
	await taskDialog.getByTestId('add-comment-button').first().click();
	await expect(
		taskDialog.getByText(fixture.comment, { exact: true })
	).toBeVisible();

	await expect(taskDialog.getByTestId('pr-url-input')).toBeVisible();
	await taskDialog.getByTestId('pr-url-input').fill(fixture.prUrl);
	await taskDialog.getByTestId('request-code-review-button').click();
	await expect(
		taskDialog.getByText('Pending Review', { exact: true })
	).toBeVisible();

	const adminContext = await browser.newContext({
		storageState: path.resolve(process.cwd(), 'playwright/.auth/admin.json')
	});
	try {
		const adminPage = await adminContext.newPage();
		await adminPage.goto('/');
		await expect(
			adminPage.getByRole('button', { name: /ADMIN user/i })
		).toBeVisible({ timeout: 30_000 });
		await adminPage.goto('/admin/pr-reviews');
		await expect(adminPage).toHaveURL(/\/admin\/pr-reviews$/, {
			timeout: 30_000
		});
		await expect(
			adminPage.getByRole('heading', { name: 'PR Reviews' })
		).toBeVisible({ timeout: 30_000 });
		const reviewRow = adminPage
			.getByTestId('review-row')
			.filter({ hasText: fixture.taskTitle });
		await expect(reviewRow).toBeVisible();
		await reviewRow.getByRole('button', { name: 'Approve' }).click();
		await expect(
			reviewRow.getByText('Approved', { exact: true })
		).toBeVisible();
	} finally {
		await adminContext.close();
	}

	await page.reload();
	await expect(taskDialog).toBeVisible();
	await expect(
		taskDialog.getByText('Your pull request has been approved!', {
			exact: true
		})
	).toBeVisible();
});
