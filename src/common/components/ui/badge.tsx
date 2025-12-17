import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '~/lib/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	{
		variants: {
			variant: {
				default:
					'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
				secondary:
					'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
				destructive:
					'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
				outline: 'text-foreground',
				'purple-gradient':
					'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 dark:border-purple-700 dark:from-purple-900/20 dark:to-blue-900/20 dark:text-purple-300',
				success:
					'border-transparent bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
				warning:
					'border-transparent bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
				'purple-solid':
					'border-transparent bg-purple-600 text-white dark:bg-purple-500 dark:text-white'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
