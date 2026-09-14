'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/ui/form';
import { Label } from '~/common/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/common/components/ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import {
	type DiagnosisInput,
	diagnosisSchema,
	learningGoalValues,
	selfReportedLevelValues,
	technologyValues,
	weeklyAvailabilityBandValues
} from '../schemas/diagnosis.schema';

type LearnerDiagnosisFormProps = {
	returnTo: string;
};

export function LearnerDiagnosisForm({ returnTo }: LearnerDiagnosisFormProps) {
	const t = useTranslations('diagnosis');
	const router = useRouter();
	const { user } = useAuth();
	const utils = api.useUtils();
	const statusQuery = api.onboarding.getStatus.useQuery(undefined, {
		enabled: Boolean(user)
	});
	const saveDiagnosis = api.onboarding.saveDiagnosis.useMutation({
		onSuccess: async () => {
			await utils.onboarding.getStatus.invalidate();
			toast.success(t('saved'));
			router.push(returnTo);
		},
		onError: (error) => toast.error(error.message)
	});
	const form = useForm<DiagnosisInput>({
		resolver: zodResolver(diagnosisSchema),
		defaultValues: {
			learningGoal: 'GET_FIRST_JOB',
			selfReportedLevel: 'BEGINNER',
			interestedTechnologies: [],
			weeklyAvailabilityBand: 'FROM_4_TO_7',
			priorExperience: ''
		}
	});

	useEffect(() => {
		const status = statusQuery.data;
		if (!status) return;

		const learningGoal = learningGoalValues.find(
			(value) => value === status.learningGoal
		);
		const selfReportedLevel = selfReportedLevelValues.find(
			(value) => value === status.selfReportedLevel
		);
		const weeklyAvailabilityBand = weeklyAvailabilityBandValues.find(
			(value) => value === status.weeklyAvailabilityBand
		);
		const interestedTechnologies = status.interestedTechnologies.filter(
			(value): value is (typeof technologyValues)[number] =>
				technologyValues.includes(value as (typeof technologyValues)[number])
		);

		if (!learningGoal || !selfReportedLevel || !weeklyAvailabilityBand) return;

		form.reset({
			learningGoal,
			selfReportedLevel,
			interestedTechnologies,
			weeklyAvailabilityBand,
			priorExperience: status.priorExperience ?? ''
		});
	}, [form, statusQuery.data]);

	if (!user) {
		return (
			<Card className="mx-auto max-w-2xl">
				<CardContent className="py-12 text-center text-muted-foreground">
					{t('signInRequired')}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="mx-auto max-w-3xl">
			<CardHeader className="space-y-3">
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{t('badge')}</Badge>
					<span className="text-muted-foreground text-sm">
						{t('timeEstimate')}
					</span>
				</div>
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t('title')}
					</h1>
					<p className="mt-2 text-muted-foreground">{t('description')}</p>
				</div>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((values) =>
							saveDiagnosis.mutate(values)
						)}
						className="space-y-8"
					>
						<FormField
							control={form.control}
							name="learningGoal"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('learningGoal.label')}</FormLabel>
									<FormDescription>
										{t('learningGoal.description')}
									</FormDescription>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{learningGoalValues.map((value) => (
												<SelectItem key={value} value={value}>
													{t(`learningGoal.options.${value}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="selfReportedLevel"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('level.label')}</FormLabel>
									<FormDescription>{t('level.description')}</FormDescription>
									<FormControl>
										<RadioGroup
											value={field.value}
											onValueChange={field.onChange}
											className="grid gap-3 sm:grid-cols-3"
										>
											{selfReportedLevelValues.map((value) => (
												<Label
													key={value}
													className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal hover:bg-muted/50"
												>
													<RadioGroupItem value={value} />
													<span>{t(`level.options.${value}`)}</span>
												</Label>
											))}
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="interestedTechnologies"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('technologies.label')}</FormLabel>
									<FormDescription>
										{t('technologies.description')}
									</FormDescription>
									<div className="grid gap-3 sm:grid-cols-2">
										{technologyValues.map((value) => {
											const checked = field.value.includes(value);
											const inputId = `diagnosis-technology-${value}`;
											return (
												<label
													key={value}
													htmlFor={inputId}
													className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
												>
													<Checkbox
														id={inputId}
														checked={checked}
														onCheckedChange={(nextChecked) =>
															field.onChange(
																nextChecked
																	? [...field.value, value]
																	: field.value.filter((item) => item !== value)
															)
														}
													/>
													<span>{t(`technologies.options.${value}`)}</span>
												</label>
											);
										})}
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="weeklyAvailabilityBand"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('availability.label')}</FormLabel>
									<FormDescription>
										{t('availability.description')}
									</FormDescription>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{weeklyAvailabilityBandValues.map((value) => (
												<SelectItem key={value} value={value}>
													{t(`availability.options.${value}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="priorExperience"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('experience.label')}</FormLabel>
									<FormDescription>
										{t('experience.description')}
									</FormDescription>
									<FormControl>
										<Textarea
											maxLength={1000}
											placeholder={t('experience.placeholder')}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex flex-col-reverse justify-between gap-3 border-border border-t pt-6 sm:flex-row sm:items-center">
							<p className="text-muted-foreground text-sm">{t('privacy')}</p>
							<Button type="submit" disabled={saveDiagnosis.isPending}>
								{saveDiagnosis.isPending ? t('saving') : t('submit')}
								{saveDiagnosis.isPending ? (
									<Check className="ml-2 h-4 w-4" />
								) : (
									<ArrowRight className="ml-2 h-4 w-4" />
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
