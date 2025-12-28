import { Calendar, Check, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge } from '~/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	BuyCreditsButton,
	PricingClient
} from '~/features/checkout/components/PricingClient';
import { MentorshipClient } from '~/features/checkout/components/MentorshipClient';
import type { CreditOptions } from '~/features/checkout/types/Checkout.type';

export const dynamic = 'force-static';

export const metadata: Metadata = {
	title: 'Pricing | Code-Wiser',
	description:
		'Upgrade your experience with credits or work directly with a mentor to accelerate your growth.'
};

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

export default function PricingPage() {
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
				</div>

				<div className="grid gap-12 lg:grid-cols-2">
					{/* Credits Section */}
					<div>
						<div className="mb-8 text-center">
							<CreditCard className="mx-auto mb-4 h-12 w-12 text-info" />
							<h2 className="mb-3 font-bold text-3xl text-foreground">
								Need more credits?
							</h2>
							<p className="text-muted-foreground">
								Credits unlock premium features, advanced project tools, and
								enhanced AI assistance to boost your development workflow.
							</p>
						</div>

						<PricingClient />

						<div className="space-y-4">
							{creditPackages.map((pkg) => (
								<Card
									key={pkg.id}
									className={`relative ${pkg.popular ? 'border-info shadow-lg' : ''}`}
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
												<p className="font-bold text-3xl text-info">
													${pkg.price}
												</p>
												<p className="text-muted-foreground text-sm">
													${(pkg.price / pkg.credits).toFixed(2)} per credit
												</p>
											</div>

											<BuyCreditsButton creditId={pkg.id} />
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<div className="mt-6 rounded-lg bg-info-muted p-4">
							<h4 className="mb-2 font-semibold text-info-muted-foreground">
								What can you do with credits?
							</h4>
							<ul className="space-y-1 text-info-muted-foreground text-sm">
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Unlock premium project templates
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Priority support and faster processing
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4" />
									Code reviews and feedback
								</li>
							</ul>
						</div>
					</div>

					{/* Mentorship Section */}
					<div>
						<div className="mb-8 text-center">
							<Calendar className="mx-auto mb-4 h-12 w-12 text-epic" />
							<h2 className="mb-3 font-bold text-3xl text-foreground">
								Want direct mentorship?
							</h2>
							<p className="text-muted-foreground">
								Get personalized guidance from experienced developers. Perfect
								for code reviews, career planning, and accelerating your
								learning journey.
							</p>
						</div>

						<Card className="border-epic-border">
							<CardHeader>
								<CardTitle
									level={3}
									className="text-center text-epic-muted-foreground"
								>
									1-on-1 Mentorship
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<h4 className="font-semibold">What you'll get:</h4>
									<ul className="space-y-3">
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
											<span>Personalized code reviews and feedback</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
											<span>Career guidance and industry insights</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
											<span>Technical interview preparation</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
											<span>Architecture and best practices guidance</span>
										</li>
										<li className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
											<span>Project planning and roadmap development</span>
										</li>
									</ul>
								</div>

								<MentorshipClient />

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
}
