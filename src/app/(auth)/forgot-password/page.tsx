import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/common/components/card';
import ForgotPasswordForm from '~/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = {
	title: 'Forgot Password',
	description: 'Forgot your password? Enter your email below to reset it.'
};

export default function ForgotPasswordPage() {
	return (
		<div className="flex min-h-screen">
			<div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
				<div className="mx-auto w-full max-w-sm lg:w-96">
					<div className="mb-11 text-center">
						<h2 className="mt-6 font-extrabold text-3xl text-primary">
							Forgot your password?
						</h2>
						<p className="mt-2 text-balance text-muted-foreground">
							No worries, we&apos;ll send you reset instructions.
						</p>
					</div>
					<Card>
						<CardHeader>
							<CardTitle className="text-center font-bold text-2xl">
								Reset Password
							</CardTitle>
							<CardDescription className="text-center">
								Enter your email to receive a reset link
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ForgotPasswordForm />
						</CardContent>
						<CardFooter className="flex flex-col space-y-4">
							<div className="text-center text-sm">
								<Link href="/login">
									<Button variant="link" className="h-fit p-0">
										<ArrowLeftIcon className="mr-2 h-4 w-4" />
										Back to Login
									</Button>
								</Link>
							</div>
						</CardFooter>
					</Card>
				</div>
			</div>
			<div className="relative hidden w-0 flex-1 lg:block">
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
