import * as React from 'react';

import { cn } from '~/lib/utils';

const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'rounded-xl bg-card text-card-foreground',
			'border border-border/40',
			'shadow-sm',
			'transition-all duration-200',

			'dark:border-0',
			'dark:bg-gradient-to-b dark:from-card dark:to-card/80',
			'dark:shadow-background/10 dark:shadow-xl',
			'dark:backdrop-blur-3xl',

			'hover:shadow-foreground/5 hover:shadow-md',
			'dark:hover:shadow-2xl dark:hover:shadow-primary/5',
			'dark:hover:bg-gradient-to-b dark:hover:from-card/95 dark:hover:to-card/75',

			className
		)}
		{...props}
	/>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex flex-col space-y-1.5',
			'p-6',
			'transition-all duration-200',
			className
		)}
		{...props}
	/>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn(
			'font-semibold text-2xl tracking-tight',
			'bg-gradient-to-br from-foreground to-foreground/80',
			'dark:from-foreground dark:to-foreground/90',
			'bg-clip-text text-transparent',
			'transition-all duration-200',
			className
		)}
		{...props}
	/>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn(
			'text-muted-foreground/80 text-sm',
			'leading-relaxed',
			'transition-colors duration-200',
			className
		)}
		{...props}
	/>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'p-6 pt-0',
			'relative',
			'transition-all duration-200',
			className
		)}
		{...props}
	/>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex items-center p-6 pt-0',
			'mt-auto',
			'transition-all duration-200',
			className
		)}
		{...props}
	/>
));
CardFooter.displayName = 'CardFooter';

export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
};
