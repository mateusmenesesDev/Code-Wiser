interface TaskCardProps {
	task: {
		id: string;
		title: string;
		description: string | null;
	};
}

export function TaskCard({ task }: TaskCardProps) {
	// Strip HTML tags and convert to plain text
	const plainDescription = task.description
		? task.description.replace(/<[^>]*>/g, '').trim()
		: null;

	return (
		<div className="rounded-lg border bg-card p-6 shadow-sm">
			<h2 className="mb-2 font-semibold text-xl">{task.title}</h2>
			{plainDescription && (
				<div className="whitespace-pre-wrap text-muted-foreground text-sm">
					{plainDescription}
				</div>
			)}
		</div>
	);
}
