import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SignUpForm from '~/features/auth/components/SignUpForm';

export const metadata: Metadata = {
	title: 'Sign Up',
	description:
		'Create a new account at Code Wise for the best coding experience.'
};

export default function SignUpPage() {
	return (
		<div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-6">
					<div className="grid gap-2 text-center">
						<h1 className="font-bold text-3xl text-primary">
							Create an account
						</h1>
						<p className="text-balance text-muted-foreground">
							Enter your details below to create your account
						</p>
					</div>
					<SignUpForm />
					<div className="mt-4 text-center text-sm">
						Already have an account?{' '}
						<Link href="/login" className="underline">
							Log in
						</Link>
					</div>
				</div>
			</div>
			<div className="hidden bg-muted lg:block">
				<Image
					src="/placeholder.svg"
					alt="Image"
					width="1920"
					height="1080"
					className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
}
