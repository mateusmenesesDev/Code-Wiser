import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "~/lib/utils";

interface ErrorMessageProps {
	message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
	const [parent] = useAutoAnimate();


	return (
		<div ref={parent}>
			{message && (
				<p className={cn("text-sm text-red-500")}>{message}</p>
			)}
		</div>
	);
}