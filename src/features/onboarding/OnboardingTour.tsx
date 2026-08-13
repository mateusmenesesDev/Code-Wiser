'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import {
	getLocalizedOnboardingTours,
	getPresentOnboardingSteps,
	type OnboardingFlow
} from './onboardingTours';

type OnboardingTourProps = {
	flow: OnboardingFlow;
	replayLabel?: string;
};

const completionField = {
	normal: 'normalOnboardingCompletedAt',
	mentorship: 'mentorshipOnboardingCompletedAt'
} as const;

function canAutoStartOnThisDevice() {
	return !window.matchMedia('(max-width: 767px)').matches;
}

export function OnboardingTour({ flow, replayLabel }: OnboardingTourProps) {
	const t = useTranslations('common');
	const onboardingT = useTranslations('onboarding');
	const tours = useMemo(
		() => getLocalizedOnboardingTours(onboardingT),
		[onboardingT]
	);
	const { user } = useAuth();
	const isLoggedIn = !!user;
	const utils = api.useUtils();
	const { data: status } = api.onboarding.getStatus.useQuery(undefined, {
		enabled: isLoggedIn
	});
	const complete = api.onboarding.complete.useMutation({
		onSuccess: async () => {
			await utils.onboarding.getStatus.invalidate();
		}
	});
	const [driverModule, setDriverModule] = useState<
		typeof import('driver.js') | null
	>(null);
	const autoStarted = useRef(false);

	useEffect(() => {
		if (!isLoggedIn) {
			return;
		}

		void import('driver.js').then(setDriverModule);
	}, [isLoggedIn]);

	const startTour = useCallback(
		(mode: 'auto' | 'replay') => {
			if (!driverModule) {
				return false;
			}

			const steps = getPresentOnboardingSteps(flow, tours);
			if (steps.length !== tours[flow].length) {
				return false;
			}

			const driverObj = driverModule.driver({
				steps,
				showProgress: true,
				progressText: '{{current}} of {{total}}',
				nextBtnText: t('next'),
				prevBtnText: t('back'),
				doneBtnText: t('finish'),
				disableActiveInteraction: true,
				overlayClickBehavior: 'close',
				onDestroyed: () => {
					if (mode === 'auto' && !complete.isPending) {
						complete.mutate({ flow });
					}
				}
			});

			driverObj.drive();
			return true;
		},
		[complete, driverModule, flow, t, tours]
	);

	const isFlowEligible =
		flow === 'normal' ? status?.mentorshipStatus !== 'ACTIVE' : true;

	useEffect(() => {
		if (
			!isLoggedIn ||
			!driverModule ||
			!status ||
			!isFlowEligible ||
			autoStarted.current
		) {
			return;
		}

		if (status[completionField[flow]]) {
			return;
		}

		if (!canAutoStartOnThisDevice()) {
			return;
		}

		let attempts = 0;
		const timer = window.setInterval(() => {
			attempts += 1;
			if (startTour('auto')) {
				autoStarted.current = true;
				window.clearInterval(timer);
			}

			if (attempts >= 24) {
				window.clearInterval(timer);
			}
		}, 250);

		return () => window.clearInterval(timer);
	}, [driverModule, flow, isFlowEligible, isLoggedIn, startTour, status]);

	if (!isLoggedIn || !driverModule || !status || !isFlowEligible) {
		return null;
	}

	const hasCompleted = Boolean(status[completionField[flow]]);

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={() => startTour(hasCompleted ? 'replay' : 'auto')}
		>
			<RotateCcw className="mr-2 h-4 w-4" />
			{hasCompleted ? (replayLabel ?? t('replayTour')) : t('startTour')}
		</Button>
	);
}
