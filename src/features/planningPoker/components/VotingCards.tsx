'use client';

import { cn } from '~/lib/utils';
import type { PlanningPokerStoryPoint } from '~/features/planningPoker/types/planningPoker.types';

interface VotingCardsProps {
	selectedValue: PlanningPokerStoryPoint | undefined;
	onSelect: (value: PlanningPokerStoryPoint) => void;
	disabled?: boolean;
}

const FIBONACCI_VALUES: PlanningPokerStoryPoint[] = [
	1,
	2,
	3,
	5,
	8,
	13,
	21,
	null
];

export function VotingCards({
	selectedValue,
	onSelect,
	disabled = false
}: VotingCardsProps) {
	return (
		<div className="grid grid-cols-4 gap-4 md:grid-cols-8">
			{FIBONACCI_VALUES.map((value) => {
				const isSelected = selectedValue === value;
				const displayValue = value === null ? '?' : value;

				return (
					<button
						key={value ?? 'unknown'}
						type="button"
						onClick={() => !disabled && onSelect(value)}
						disabled={disabled}
						className={cn(
							'flex h-20 items-center justify-center rounded-lg border-2 font-bold text-lg transition-all hover:scale-105',
							isSelected
								? 'border-primary bg-primary text-primary-foreground shadow-lg'
								: 'border-border bg-card hover:border-primary/50',
							disabled && 'cursor-not-allowed opacity-50'
						)}
					>
						{displayValue}
					</button>
				);
			})}
		</div>
	);
}
