'use client';

import type { DayButtonProps } from 'react-day-picker';
import {
	CalendarDays,
	Clock,
	Globe,
	Lock,
	RefreshCw,
	Video,
	X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Calendar } from '~/common/components/ui/calendar';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import { Skeleton } from '~/common/components/ui/skeleton';
import { Switch } from '~/common/components/ui/switch';
import { env } from '~/env';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';
import { formatSessionDateTime } from '../utils/mentorshipAccess';

// ─── helpers ─────────────────────────────────────────────────────────────────

function toLocalDateKey(date: Date): string {
	return new Intl.DateTimeFormat('en-CA').format(date);
}

function todayStart(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Derive a readable host label from the public Cal.com username slug */
function hostDisplayFromCalUsername(username: string): string {
	return username
		.split(/[-_]/)
		.filter(Boolean)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
		.join(' ');
}

function formatSlotTime(isoString: string, use24Hour: boolean): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		hour12: !use24Hour
	}).format(new Date(isoString));
}

/** Compact header like Cal.com: "Thu 23" */
function formatSlotColumnHeading(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		day: 'numeric'
	}).format(date);
}

// ─── types ────────────────────────────────────────────────────────────────────

type DayState = 'available' | 'fullyBooked' | 'weeklyLocked';

interface SlotOption {
	start: string;
}

// ─── skeleton / error ─────────────────────────────────────────────────────────

function CalendarSkeleton() {
	return (
		<div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-sm">
			<div className="grid grid-cols-1 divide-y lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,280px)] lg:divide-x lg:divide-y-0">
				<div className="space-y-4 p-6">
					<Skeleton className="h-12 w-12 rounded-full" />
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
				</div>
				<div className="flex justify-center p-6">
					<Skeleton className="h-[300px] w-full max-w-[340px]" />
				</div>
				<div className="space-y-3 p-6">
					<Skeleton className="h-6 w-24" />
					{Array.from({ length: 5 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
						<Skeleton key={i} className="h-11 w-full" />
					))}
				</div>
			</div>
		</div>
	);
}

function CalendarError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="mx-auto max-w-lg overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm">
			<p className="text-muted-foreground">
				Failed to load available slots. Please try again.
			</p>
			<Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
				<RefreshCw className="mr-2 h-4 w-4" />
				Retry
			</Button>
		</div>
	);
}

// ─── main component ───────────────────────────────────────────────────────────

const EVENT_TITLE = 'Individual Mentorship';
const DURATION_LABEL = '1h';

export function MentorshipCalendar() {
	const { userEmail, userName } = useAuth();
	const utils = api.useUtils();

	const hostName = useMemo(
		() => hostDisplayFromCalUsername(env.NEXT_PUBLIC_CALCOM_USERNAME),
		[]
	);
	const hostInitial = hostName.charAt(0).toUpperCase() || 'M';
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	const today = todayStart();
	const windowEnd = new Date(today);
	windowEnd.setDate(today.getDate() + 28);

	const {
		data: slotsGrouped,
		isLoading: slotsLoading,
		isError: slotsError,
		refetch: refetchSlots
	} = api.mentorship.getAvailableSlots.useQuery({
		startDate: today.toISOString(),
		endDate: windowEnd.toISOString()
	});

	const { data: weekInfo } = api.mentorship.getMyMentorshipWeekInfo.useQuery();

	const [selectedDate, setSelectedDate] = useState<Date | undefined>();
	const [selectedSlot, setSelectedSlot] = useState<SlotOption | undefined>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [use24Hour, setUse24Hour] = useState(false);

	const bookMutation = api.mentorship.bookSession.useMutation({
		onSuccess: async () => {
			toast.success('Session booked! Check your email for the meeting link.');
			setSelectedDate(undefined);
			setSelectedSlot(undefined);
			await utils.mentorship.getAvailableSlots.invalidate();
			await utils.mentorship.getMyMentorshipWeekInfo.invalidate();
			await utils.mentorship.getMyBookings.invalidate();
		},
		onError: (err) => toast.error(`Booking failed: ${err.message}`)
	});

	// ── day-state computation ─────────────────────────────────────────────────

	const dayStates = new Map<string, DayState>();

	if (slotsGrouped && weekInfo) {
		const cap = weekInfo.weeklyMentorshipSessions;
		const lockedWeekStarts = new Set<number>(
			weekInfo.weeklyBookingCounts
				.filter((w) => w.scheduledCount >= cap)
				.map((w) => new Date(w.weekStart).getTime())
		);

		for (let d = new Date(today); d < windowEnd; d.setDate(d.getDate() + 1)) {
			const key = toLocalDateKey(d);
			const slots = slotsGrouped[key] ?? [];

			if (slots.length > 0) {
				const weekDay = d.getUTCDay();
				const daysFromMonday = weekDay === 0 ? 6 : weekDay - 1;
				const weekStart = new Date(d);
				weekStart.setUTCDate(d.getUTCDate() - daysFromMonday);
				weekStart.setUTCHours(0, 0, 0, 0);

				dayStates.set(
					key,
					lockedWeekStarts.has(weekStart.getTime()) ? 'weeklyLocked' : 'available'
				);
			} else {
				dayStates.set(key, 'fullyBooked');
			}
		}
	}

	const available: Date[] = [];
	const fullyBooked: Date[] = [];
	const weeklyLocked: Date[] = [];

	for (const [key, state] of dayStates) {
		const [year, month, day] = key.split('-').map(Number) as [
			number,
			number,
			number
		];
		const d = new Date(year, month - 1, day);
		if (state === 'available') available.push(d);
		else if (state === 'fullyBooked') fullyBooked.push(d);
		else if (state === 'weeklyLocked') weeklyLocked.push(d);
	}

	const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : null;
	const slotsForSelectedDay: SlotOption[] =
		selectedDateKey && slotsGrouped ? (slotsGrouped[selectedDateKey] ?? []) : [];

	const handleDayClick = (day: Date) => {
		const state = dayStates.get(toLocalDateKey(day));
		if (state === 'available') {
			setSelectedDate(day);
			setSelectedSlot(undefined);
		}
	};

	const handleConfirmBooking = () => {
		if (!selectedSlot || !userEmail || !userName) return;
		bookMutation.mutate({
			start: selectedSlot.start,
			timeZone,
			attendeeName: userName,
			attendeeEmail: userEmail
		});
		setConfirmOpen(false);
	};

	if (slotsLoading) return <CalendarSkeleton />;
	if (slotsError) return <CalendarError onRetry={() => void refetchSlots()} />;

	return (
		<div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
			{/* Cal.com–style 3-column embed */}
			<div className="grid grid-cols-1 divide-y lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,280px)] lg:divide-x lg:divide-y-0">
				{/* ── Left: event summary (like Cal.com embed sidebar) ───────── */}
				<aside className="flex flex-col gap-6 bg-muted/15 p-6 lg:min-h-[420px]">
					<div className="flex items-start gap-4">
						<div
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-lg text-primary-foreground"
							aria-hidden
						>
							{hostInitial}
						</div>
						<div className="min-w-0 space-y-1">
							<p className="truncate text-muted-foreground text-sm">{hostName}</p>
							<h2 className="font-semibold text-foreground text-xl leading-tight tracking-tight">
								{EVENT_TITLE}
							</h2>
						</div>
					</div>

					<ul className="space-y-3 text-muted-foreground text-sm">
						<li className="flex items-center gap-2.5">
							<Clock className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
							<span>{DURATION_LABEL}</span>
						</li>
						<li className="flex items-center gap-2.5">
							<Video className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
							<span>Video call</span>
						</li>
						<li className="flex items-start gap-2.5">
							<Globe className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
							<span className="break-all">{timeZone}</span>
						</li>
					</ul>

					<div className="mt-auto flex flex-wrap gap-3 border-border/60 border-t pt-4 text-[11px] text-muted-foreground">
						<span className="inline-flex items-center gap-1">
							<span className="h-2 w-2 rounded-full bg-primary" /> Available
						</span>
						<span className="inline-flex items-center gap-1">
							<X className="h-2.5 w-2.5 opacity-60" /> No slots
						</span>
						<span className="inline-flex items-center gap-1">
							<Lock className="h-2.5 w-2.5 text-amber-500" /> Weekly cap
						</span>
					</div>
				</aside>

				{/* ── Center: calendar ─────────────────────────────────────────── */}
				<div className="flex justify-center p-5 sm:p-6">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={(day) => day && handleDayClick(day)}
						disabled={(day) => day < today || day >= windowEnd}
						fromDate={today}
						toDate={windowEnd}
						modifiers={{ available, fullyBooked, weeklyLocked }}
						modifiersClassNames={{
							available: '[&_button]:bg-muted/50 [&_button]:font-medium',
							fullyBooked: 'rdp-day_fullyBooked',
							weeklyLocked: 'rdp-day_weeklyLocked'
						}}
						classNames={{
							root: 'w-full max-w-[360px]',
							weekday:
								'w-10 text-center font-medium text-[0.7rem] uppercase tracking-wide text-muted-foreground',
							day: 'relative h-10 w-10 p-0 text-center text-sm focus-within:relative focus-within:z-20',
							day_button:
								'h-10 w-10 rounded-lg p-0 font-normal transition-colors hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100',
							selected:
								'!bg-foreground !text-background hover:!bg-foreground hover:!text-background focus:!bg-foreground focus:!text-background rounded-lg font-semibold shadow-sm'
						}}
						components={{
							DayButton: ({
								day,
								modifiers,
								...btnProps
							}: DayButtonProps) => {
								const isFullyBooked =
									modifiers.fullyBooked as boolean | undefined;
								const isWeeklyLocked =
									modifiers.weeklyLocked as boolean | undefined;
								const isDisabled = modifiers.disabled as boolean | undefined;

								return (
									<button
										{...btnProps}
										className={cn(
											btnProps.className,
											'relative',
											isFullyBooked &&
												!isDisabled &&
												'cursor-not-allowed opacity-40',
											isWeeklyLocked &&
												!isDisabled &&
												'cursor-not-allowed opacity-60'
										)}
										disabled={
											btnProps.disabled || isFullyBooked || isWeeklyLocked
										}
										title={
											isWeeklyLocked
												? 'Weekly session limit reached'
												: isFullyBooked && !isDisabled
													? 'No available slots'
													: undefined
										}
									>
										{btnProps.children}
										{isFullyBooked && !isDisabled && (
											<span className="-translate-x-1/2 absolute bottom-1 left-1/2">
												<X className="h-2 w-2 text-muted-foreground/50" />
											</span>
										)}
										{isWeeklyLocked && !isDisabled && (
											<span className="-translate-x-1/2 absolute bottom-1 left-1/2">
												<Lock className="h-2 w-2 text-amber-500" />
											</span>
										)}
									</button>
								);
							}
						}}
					/>
				</div>

				{/* ── Right: times (Cal.com slot column) ───────────────────────── */}
				<div className="flex flex-col border-border/60 bg-muted/10 p-5 sm:p-6 lg:min-h-[420px]">
					{selectedDate ? (
						<>
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<p className="font-semibold text-foreground text-lg tracking-tight">
									{formatSlotColumnHeading(selectedDate)}
								</p>
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-xs">12h</span>
									<Switch
										id="time-format"
										checked={use24Hour}
										onCheckedChange={setUse24Hour}
										aria-label="Use 24-hour time"
									/>
									<span className="text-muted-foreground text-xs">24h</span>
								</div>
							</div>

							{slotsForSelectedDay.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No available times for this date.
								</p>
							) : (
								<ScrollArea className="min-h-0 flex-1 pr-2 lg:h-[min(340px,60vh)]">
									<div className="flex flex-col gap-2 pb-1">
										{slotsForSelectedDay.map((slot) => (
											<Button
												key={slot.start}
												variant="outline"
												className="h-11 w-full justify-center rounded-lg border-border/80 bg-background/50 font-normal text-base hover:bg-accent"
												onClick={() => {
													setSelectedSlot(slot);
													setConfirmOpen(true);
												}}
											>
												{formatSlotTime(slot.start, use24Hour)}
											</Button>
										))}
									</div>
								</ScrollArea>
							)}
						</>
					) : (
						<div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center text-muted-foreground">
							<CalendarDays className="h-10 w-10 opacity-35" aria-hidden />
							<p className="max-w-[220px] text-sm leading-relaxed">
								Select a date in the calendar to see available times.
							</p>
						</div>
					)}
				</div>
			</div>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm booking</DialogTitle>
						<DialogDescription>
							{selectedSlot && (
								<>
									You are about to book{' '}
									<strong>
										{formatSessionDateTime(new Date(selectedSlot.start))}
									</strong>{' '}
									(your local time).
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmOpen(false)}
							disabled={bookMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmBooking}
							disabled={bookMutation.isPending}
						>
							{bookMutation.isPending ? 'Booking…' : 'Confirm'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
