'use client';

import type { PlanningPokerStoryPoint } from '~/features/planningPoker/types/planningPoker.types';
import { cn } from '~/lib/utils';

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
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
			{FIBONACCI_VALUES.map((value) => {
				const isSelected = selectedValue === value;
				const displayValue = value === null ? '?' : value;
				const isQuestionMark = value === null;

				return (
					<button
						key={value ?? 'unknown'}
						type="button"
						onClick={() => !disabled && onSelect(value)}
						disabled={disabled}
						className={cn(
							'group relative flex aspect-[2/3] min-h-[120px] flex-col items-center justify-center rounded-xl border-2 transition-all duration-200',
							// Base card styling - poker card look
							'bg-gradient-to-br from-background to-muted shadow-md',
							// Hover effects
							!disabled &&
								'hover:scale-105 hover:shadow-primary/20 hover:shadow-xl',
							// Selected state
							isSelected
								? 'border-primary bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/30 shadow-xl ring-2 ring-primary/20'
								: 'border-border',
							// Disabled state
							disabled && 'cursor-not-allowed opacity-50'
						)}
					>
						{/* Corner decoration (like poker cards) */}
						<div
							className={cn(
								'absolute top-2 left-2 font-bold text-xs',
								isSelected
									? 'text-primary-foreground/60'
									: 'text-muted-foreground'
							)}
						>
							{displayValue}
						</div>
						<div
							className={cn(
								'absolute right-2 bottom-2 rotate-180 font-bold text-xs',
								isSelected
									? 'text-primary-foreground/60'
									: 'text-muted-foreground'
							)}
						>
							{displayValue}
						</div>

						{/* Center value */}
						<div
							className={cn(
								'flex items-center justify-center',
								isQuestionMark ? 'font-bold text-4xl' : 'font-bold text-5xl'
							)}
						>
							{displayValue}
						</div>

						{/* Shine effect on hover */}
						{!disabled && !isSelected && (
							<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 via-white/0 to-white/20 opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/0 dark:via-white/0 dark:to-white/10" />
						)}
					</button>
				);
			})}
		</div>
	);
}
