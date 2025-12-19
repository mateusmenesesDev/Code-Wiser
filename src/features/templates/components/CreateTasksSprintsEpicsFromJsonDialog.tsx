'use client';

import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '~/common/components/ui/collapsible';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';
import { bulkCreateSchema } from '../schemas/bulkCreate.schema';
import { TASKS_SPRINTS_EPICS_JSON_EXAMPLE } from '../constants';

interface CreateTasksSprintsEpicsFromJsonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectTemplateId: string;
	onSuccess?: () => void;
}

export function CreateTasksSprintsEpicsFromJsonDialog({
	open,
	onOpenChange,
	projectTemplateId,
	onSuccess
}: CreateTasksSprintsEpicsFromJsonDialogProps) {
	const [jsonInput, setJsonInput] = useState('');
	const [validationError, setValidationError] = useState<string | null>(null);
	const [showExample, setShowExample] = useState(false);

	const bulkCreateMutation =
		api.projectTemplate.bulkCreateTasksSprintsEpics.useMutation({
			onSuccess: (data) => {
				const successMessage = `Successfully created ${data.epicsCreated} epics, ${data.sprintsCreated} sprints, and ${data.tasksCreated} tasks!`;

				if (data.warnings && data.warnings.length > 0) {
					toast.warning(successMessage, {
						description: `${data.warnings.length} warning(s): ${data.warnings.join('; ')}`
					});
				} else {
					toast.success(successMessage);
				}

				setJsonInput('');
				setValidationError(null);
				onOpenChange(false);
				onSuccess?.();
			},
			onError: (error) => {
				toast.error(
					error.message || 'Failed to create tasks, sprints, and epics'
				);
			}
		});

	const handleCreate = () => {
		setValidationError(null);

		// Parse JSON
		let parsedData: unknown;
		try {
			parsedData = JSON.parse(jsonInput);
		} catch {
			setValidationError('Invalid JSON format. Please check your JSON syntax.');
			toast.error('Invalid JSON format');
			return;
		}

		// Validate against schema
		const validationResult = bulkCreateSchema.safeParse(parsedData);

		if (!validationResult.success) {
			const errors = validationResult.error.issues
				.map((err) => `${err.path.join('.')}: ${err.message}`)
				.join('\n');
			setValidationError(`Validation errors:\n${errors}`);
			toast.error('JSON validation failed. Please check the errors.');
			return;
		}

		// Create tasks, sprints, and epics
		bulkCreateMutation.mutate({
			projectTemplateId,
			data: validationResult.data
		});
	};

	const handleClose = () => {
		setJsonInput('');
		setValidationError(null);
		setShowExample(false);
		onOpenChange(false);
	};

	const handleCopyExample = async () => {
		try {
			await navigator.clipboard.writeText(
				JSON.stringify(TASKS_SPRINTS_EPICS_JSON_EXAMPLE, null, 2)
			);
			toast.success('JSON example copied to clipboard!');
		} catch {
			toast.error('Failed to copy to clipboard');
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Tasks, Sprints & Epics from JSON</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* JSON Example Section */}
					<Collapsible open={showExample} onOpenChange={setShowExample}>
						<div className="rounded-lg border bg-muted/50">
							<div className="flex items-center justify-between p-4">
								<div>
									<h3 className="font-semibold text-sm">JSON Example</h3>
									<p className="text-muted-foreground text-xs">
										Copy this example to use as a template. Tasks can reference
										epics and sprints by title.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleCopyExample}
									>
										<Copy className="mr-2 h-4 w-4" />
										Copy JSON Example
									</Button>
									<CollapsibleTrigger asChild>
										<Button type="button" variant="ghost" size="sm">
											{showExample ? (
												<ChevronUp className="h-4 w-4" />
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
										</Button>
									</CollapsibleTrigger>
								</div>
							</div>
							<CollapsibleContent>
								<div className="border-t p-4">
									<pre className="max-h-[300px] overflow-x-auto overflow-y-auto rounded-md bg-background p-4 font-mono text-xs">
										{JSON.stringify(TASKS_SPRINTS_EPICS_JSON_EXAMPLE, null, 2)}
									</pre>
								</div>
							</CollapsibleContent>
						</div>
					</Collapsible>

					{/* JSON Input Section */}
					<div className="space-y-2">
						<label
							htmlFor="json-input"
							className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							JSON Input *
						</label>
						<Textarea
							id="json-input"
							placeholder='{"epics": [...], "sprints": [...], "tasks": [...]}'
							value={jsonInput}
							onChange={(e) => {
								setJsonInput(e.target.value);
								setValidationError(null);
							}}
							className="min-h-[400px] font-mono text-sm"
						/>
						<p className="text-muted-foreground text-xs">
							Paste your JSON here. Tasks can reference epics and sprints by
							their title using <code>epicTitle</code> and{' '}
							<code>sprintTitle</code> fields.
						</p>
					</div>

					{validationError && (
						<div className="rounded-md bg-destructive/10 p-4">
							<pre className="whitespace-pre-wrap break-words text-destructive text-sm">
								{validationError}
							</pre>
						</div>
					)}

					<div className="flex justify-end gap-4 pt-4">
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleCreate}
							disabled={bulkCreateMutation.isPending || !jsonInput.trim()}
							className="bg-info text-info-foreground hover:bg-info/90"
						>
							{bulkCreateMutation.isPending
								? 'Creating...'
								: 'Create Tasks, Sprints & Epics'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
