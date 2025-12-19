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
					'border-epic-border bg-gradient-to-r from-epic-muted to-info-muted text-epic-muted-foreground',
				success:
					'border-transparent bg-success-muted text-success-muted-foreground',
				warning:
					'border-transparent bg-warning-muted text-warning-muted-foreground',
				'purple-solid': 'border-transparent bg-epic text-epic-foreground'
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
