import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = 'Input';

interface PasswordInputProps extends InputProps {
	showPasswordToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	({ showPasswordToggle = true, ...props }, ref) => {
		const [showPassword, setShowPassword] = React.useState(false);

		return (
			<div className="relative">
				<Input type={showPassword ? 'text' : 'password'} {...props} ref={ref} />
				{showPasswordToggle && (
					<button
						type="button"
						className="-translate-y-1/2 absolute top-1/2 right-3"
						onClick={() => setShowPassword(!showPassword)}
					>
						{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
					</button>
				)}
			</div>
		);
	}
);

PasswordInput.displayName = 'PasswordInput';

export { Input, PasswordInput };
