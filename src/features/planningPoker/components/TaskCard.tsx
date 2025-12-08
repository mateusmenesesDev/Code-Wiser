interface TaskCardProps {
	task: {
		id: string;
		title: string;
		description: string | null;
	};
}

export function TaskCard({ task }: TaskCardProps) {
	return (
		<div className="rounded-lg border bg-card p-6 shadow-sm">
			<h2 className="mb-2 font-semibold text-xl">{task.title}</h2>
			{task.description && (
				<div
					className="text-muted-foreground text-sm"
					dangerouslySetInnerHTML={{
						__html: task.description
					}}
				/>
			)}
		</div>
	);
}
