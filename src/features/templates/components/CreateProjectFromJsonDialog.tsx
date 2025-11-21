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
import { createProjectTemplateSchema } from '../schemas/template.schema';
import { TEMPLATE_JSON_EXAMPLE } from '../constants';

interface CreateProjectFromJsonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onTemplateCreated?: () => void;
}

export function CreateProjectFromJsonDialog({
	open,
	onOpenChange,
	onTemplateCreated
}: CreateProjectFromJsonDialogProps) {
	const [jsonInput, setJsonInput] = useState('');
	const [validationError, setValidationError] = useState<string | null>(null);
	const [showExample, setShowExample] = useState(false);

	const createTemplateMutation = api.projectTemplate.create.useMutation({
		onSuccess: () => {
			toast.success('Template created successfully from JSON');
			setJsonInput('');
			setValidationError(null);
			onOpenChange(false);
			onTemplateCreated?.();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to create template from JSON');
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
		const validationResult = createProjectTemplateSchema.safeParse(parsedData);

		if (!validationResult.success) {
			const errors = validationResult.error.errors
				.map((err) => `${err.path.join('.')}: ${err.message}`)
				.join('\n');
			setValidationError(`Validation errors:\n${errors}`);
			toast.error('JSON validation failed. Please check the errors.');
			return;
		}

		// Create template
		createTemplateMutation.mutate(validationResult.data);
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
				JSON.stringify(TEMPLATE_JSON_EXAMPLE, null, 2)
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
					<DialogTitle>Create Project Template from JSON</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* JSON Example Section */}
					<Collapsible open={showExample} onOpenChange={setShowExample}>
						<div className="rounded-lg border bg-muted/50">
							<div className="flex items-center justify-between p-4">
								<div>
									<h3 className="font-semibold text-sm">JSON Example</h3>
									<p className="text-muted-foreground text-xs">
										Copy this example to use as a template for creating your
										project
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
										{JSON.stringify(TEMPLATE_JSON_EXAMPLE, null, 2)}
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
							placeholder='{"title": "My Project", "description": "...", "category": "...", ...}'
							value={jsonInput}
							onChange={(e) => {
								setJsonInput(e.target.value);
								setValidationError(null);
							}}
							className="min-h-[400px] font-mono text-sm"
						/>
						<p className="text-muted-foreground text-xs">
							Paste your project template JSON here. The JSON must match the
							project template schema.
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
							disabled={createTemplateMutation.isPending || !jsonInput.trim()}
							className="bg-blue-600 hover:bg-blue-700"
						>
							{createTemplateMutation.isPending
								? 'Creating...'
								: 'Create Template'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
