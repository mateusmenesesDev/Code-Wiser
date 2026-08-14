import { describe, expect, it } from 'vitest';
import { createTaskSchema, updateTaskSchema } from './task.schema';

describe('task schema product versions', () => {
	it('accepts a product version on create and clearing it on update', () => {
		const createResult = createTaskSchema.safeParse({
			projectId: 'project-1',
			title: 'Versioned User Story',
			isTemplate: false,
			productVersionId: 'version-1'
		});
		const updateResult = updateTaskSchema.safeParse({
			id: 'task-1',
			isTemplate: false,
			productVersionId: null
		});

		expect(createResult.success).toBe(true);
		expect(updateResult.success).toBe(true);
	});
});

describe('task schema assignees', () => {
	it('accepts multiple assigneeIds on create', () => {
		const result = createTaskSchema.safeParse({
			projectId: 'project-1',
			title: 'Task with multiple assignees',
			isTemplate: false,
			assigneeIds: ['user-1', 'user-2']
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.assigneeIds).toEqual(['user-1', 'user-2']);
		}
	});

	it('accepts empty assigneeIds on update', () => {
		const result = updateTaskSchema.safeParse({
			id: 'task-1',
			isTemplate: false,
			assigneeIds: []
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.assigneeIds).toEqual([]);
		}
	});

	it('rejects assigneeId in favor of assigneeIds', () => {
		const result = createTaskSchema.safeParse({
			projectId: 'project-1',
			title: 'Legacy field',
			isTemplate: false,
			assigneeId: 'user-1'
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(
				'assigneeId' in result.data ? result.data.assigneeId : undefined
			).toBeUndefined();
			expect(result.data.assigneeIds).toBeUndefined();
		}
	});
});
