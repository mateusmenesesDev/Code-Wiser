import { useAnimate } from '~/common/hooks/useAnimate';
import { cn } from '~/lib/utils';

interface ErrorMessageProps {
	message?: string;
	className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
	const [animateRef] = useAnimate<HTMLDivElement>();

	return (
		<div ref={animateRef}>
			{message && (
				<p className={cn('text-red-500 text-sm', className)}>{message}</p>
			)}
		</div>
	);
}
