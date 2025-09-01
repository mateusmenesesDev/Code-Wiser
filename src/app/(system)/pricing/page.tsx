'use client';

import { Calendar, Check, CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { EXTERNAL_LINKS } from '~/common/constants/externalLinks';
import { useUser } from '~/common/hooks/useUser';
import { useAuth } from '~/features/auth/hooks/useAuth';
import type {
	CheckoutInput,
	CreditOptions
} from '~/features/checkout/types/Checkout.type';

const PricingPage = () => {
	const { user } = useAuth();
	const { userCredits } = useUser();

	const creditPackages = [
		{
			id: 'credits_500' as CreditOptions,
			credits: 500,
			price: 25,
			popular: false
		},
		{
			id: 'credits_1500' as CreditOptions,
			credits: 1500,
			price: 67,
			popular: true,
			savings: 'Save 10%'
		},
		{
			id: 'credits_3000' as CreditOptions,
			credits: 3000,
			price: 120,
			popular: false,
			savings: 'Save 20%'
		}
	];

	const handleBuyCredits = async (data: CheckoutInput) => {
		if (!user) {
			toast.error('Authentication Required');
			return;
		}

		try {
			toast.info('Payment Processing');
			const response = await fetch('/api/checkout_sessions', {
				method: 'POST',
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				throw new Error('Failed to create checkout session');
			}

			const responseData = await response.json();

			window.location.href = responseData.url;
		} catch (error) {
			console.error(error);
			toast.error('Payment Failed');
		}
	};

	const handleScheduleMentorship = () => {
		window.open(EXTERNAL_LINKS.MENTORSHIP, '_blank');
		toast.info('Scheduling Discovery Call');
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-6xl">
				<div className="mb-12 text-center">
					<h1 className="mb-4 font-bold text-4xl text-foreground">
						Upgrade Your Experience
					</h1>
					<p className="mb-6 text-muted-foreground text-xl">
						Get more credits or work directly with a mentor to accelerate your
						growth
					</p>

					{user && (
						<div className="flex justify-center">
							<Badge variant="purple-gradient" className="px-4 py-2 text-lg ">
								<Sparkles className="mr-2 h-4 w-4" />
								Current Balance: {userCredits} credits
							</Badge>
						</div>
					)}
				</div>

				<div className="grid gap-12 lg:grid-cols-2">
					{/* Credits Section */}
					<div>
						<div className="mb-8 text-center">
							<CreditCard className="mx-auto mb-4 h-12 w-12 text-dev-blue-600" />
							<h2 className="mb-3 font-bold text-3xl text-foreground">
								Need more credits?
							</h2>
							<p className="text-muted-foreground">
								Credits unlock premium features, advanced project tools, and
								enhanced AI assistance to boost your development workflow.
							</p>
						</div>

						<div className="space-y-4">
							{creditPackages.map((pkg) => (
								<Card
									key={pkg.id}
									className={`relative ${pkg.popular ? 'border-dev-blue-500 shadow-lg' : ''}`}
								>
									{pkg.popular && (
										<div className="-top-3 -translate-x-1/2 absolute left-1/2 transform">
											<Badge variant="default">Most Popular</Badge>
										</div>
									)}

									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div>
												<div className="mb-2 flex items-center gap-2">
													<h2 className="font-bold text-2xl">
														{pkg.credits} Credits
													</h2>
													{pkg.savings && (
														<Badge variant="success">{pkg.savings}</Badge>
													)}
												</div>
												<p className="font-bold text-3xl text-dev-blue-600">
													${pkg.price}
												</p>
												<p className="text-muted-foreground text-sm">
													${(pkg.price / pkg.credits).toFixed(2)} per credit
												</p>
											</div>

											<Button
												onClick={() =>
													handleBuyCredits({
														credit: pkg.id,
														mode: 'payment'
													})
												}
												variant="primary"
											>
												Buy Now
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<div className="mt-6 rounded-lg bg-dev-blue-50 p-4 dark:bg-dev-blue-900/20">
							<h4 className="mb-2 font-semibold text-dev-blue-700 dark:text-dev-blue-300">
								What can you do with credits?
							</h4>
							<ul className="space-y-1 text-dev-blue-600 text-sm dark:text-dev-blue-400">
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Unlock premium project templates
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Access advanced AI code assistance
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Generate detailed project documentation
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Priority support and faster processing
								</li>
							</ul>
						</div>
					</div>

					{/* Mentorship Section */}
					<div>
						<div className="mb-8 text-center">
							<Calendar className="mx-auto mb-4 h-12 w-12 text-dev-purple-600" />
							<h2 className="mb-3 font-bold text-3xl text-foreground">
								Want direct mentorship?
							</h2>
							<p className="text-muted-foreground">
								Get personalized guidance from experienced developers. Perfect
								for code reviews, career planning, and accelerating your
								learning journey.
							</p>
						</div>

						<Card className="border-dev-purple-200 dark:border-dev-purple-700">
							<CardHeader>
								<CardTitle
									level={3}
									className="text-center text-dev-purple-700 dark:text-dev-purple-300"
								>
									1-on-1 Mentorship
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<h4 className="font-semibold">What you'll get:</h4>
									<ul className="space-y-3">
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
											<span>Personalized code reviews and feedback</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
											<span>Career guidance and industry insights</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
											<span>Technical interview preparation</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
											<span>Architecture and best practices guidance</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
											<span>Project planning and roadmap development</span>
										</li>
									</ul>
								</div>

								<div className="rounded-lg bg-gradient-to-r from-dev-purple-50 to-dev-blue-50 p-4 dark:from-dev-purple-900/20 dark:to-dev-blue-900/20">
									<h5 className="mb-2 font-semibold text-dev-purple-700 dark:text-dev-purple-300">
										Discovery Call - Free
									</h5>
									<p className="mb-4 text-dev-purple-600 text-sm dark:text-dev-purple-400">
										Start with a 30-minute discovery call to discuss your goals
										and see if mentorship is right for you.
									</p>

									<Button
										onClick={handleScheduleMentorship}
										className="w-full"
										variant="primary"
									>
										<Calendar className="mr-2 h-4 w-4" />
										Schedule Discovery Call
									</Button>
								</div>

								<div className="border-t pt-4 text-center">
									<p className="text-muted-foreground text-sm">
										After the discovery call, we'll create a custom mentorship
										plan tailored to your needs and goals.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PricingPage;
