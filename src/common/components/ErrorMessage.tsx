import { useAnimate } from '~/common/hooks/useAnimate';
import { cn } from '~/lib/utils';

interface ErrorMessageProps {
	message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
	const [animateRef] = useAnimate<HTMLDivElement>();

	return (
		<div ref={animateRef}>
			{message && <p className={cn('text-red-500 text-sm')}>{message}</p>}
		</div>
	);
}
