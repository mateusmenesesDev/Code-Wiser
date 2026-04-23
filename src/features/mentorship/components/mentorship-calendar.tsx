'use client';

import type { DayButtonProps } from 'react-day-picker';
import { CalendarDays, Lock, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Calendar } from '~/common/components/ui/calendar';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
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
import { useAuth } from '~/features/auth/hooks/useAuth';
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

function formatSlotTime(isoString: string): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	}).format(new Date(isoString));
}

function formatSelectedDate(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'long',
		month: 'long',
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
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-6 md:flex-row md:divide-x">
					<div className="flex-1 space-y-3">
						<Skeleton className="h-8 w-full" />
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
					<div className="space-y-2 md:w-72">
						<Skeleton className="h-6 w-40" />
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function CalendarError({ onRetry }: { onRetry: () => void }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Book Your Next Session</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
					<p>Failed to load available slots. Please try again.</p>
					<Button variant="outline" size="sm" onClick={onRetry}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── main component ───────────────────────────────────────────────────────────

export function MentorshipCalendar() {
	const { userEmail, userName } = useAuth();
	const utils = api.useUtils();

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

	// ── modifiers ─────────────────────────────────────────────────────────────

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

	// ── slot picker ───────────────────────────────────────────────────────────

	const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : null;
	const slotsForSelectedDay: SlotOption[] =
		selectedDateKey && slotsGrouped ? (slotsGrouped[selectedDateKey] ?? []) : [];

	// ── handlers ──────────────────────────────────────────────────────────────

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
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			attendeeName: userName,
			attendeeEmail: userEmail
		});
		setConfirmOpen(false);
	};

	// ── early states ──────────────────────────────────────────────────────────

	if (slotsLoading) return <CalendarSkeleton />;
	if (slotsError) return <CalendarError onRetry={() => void refetchSlots()} />;

	// ── render ────────────────────────────────────────────────────────────────

	return (
		<Card className="overflow-hidden">
			<CardHeader className="border-b pb-4">
				<CardTitle>Book Your Next Session</CardTitle>

				{/* Legend */}
				<div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-3 w-3 rounded-full bg-primary" />
						Available
					</span>
					<span className="flex items-center gap-1.5">
						<X className="h-3 w-3 text-muted-foreground/60" />
						No slots
					</span>
					<span className="flex items-center gap-1.5">
						<Lock className="h-3 w-3 text-amber-500" />
						Weekly limit reached
					</span>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<div className="flex flex-col divide-y md:flex-row md:divide-x md:divide-y-0">

					{/* ── Left: Calendar ─────────────────────────────────────── */}
					<div className="flex flex-1 items-start justify-center p-6">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={(day) => day && handleDayClick(day)}
							disabled={(day) => day < today || day >= windowEnd}
							fromDate={today}
							toDate={windowEnd}
							modifiers={{ available, fullyBooked, weeklyLocked }}
							classNames={{
								// Override cell sizes to be larger than the default w-9/h-9
								weekday:
									'w-12 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground',
								day: 'relative h-12 w-12 p-0 text-center text-sm focus-within:relative focus-within:z-20',
								day_button:
									'h-12 w-12 rounded-md p-0 font-normal transition-colors hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100'
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

									const extraClasses = [
										isFullyBooked && !isDisabled && 'cursor-not-allowed opacity-40',
										isWeeklyLocked && !isDisabled && 'cursor-not-allowed opacity-60'
									]
										.filter(Boolean)
										.join(' ');

									return (
										<button
											{...btnProps}
											className={[btnProps.className, 'relative', extraClasses]
												.filter(Boolean)
												.join('')}
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

					{/* ── Right: Slot picker ─────────────────────────────────── */}
					<div className="flex flex-col gap-3 p-6 md:w-72">
						{selectedDate ? (
							<>
								<p className="font-semibold text-sm">
									{formatSelectedDate(selectedDate)}
								</p>

								{slotsForSelectedDay.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No available times for this date.
									</p>
								) : (
									<ScrollArea className="h-[320px] pr-2">
										<div className="flex flex-col gap-2">
											{slotsForSelectedDay.map((slot) => (
												<Button
													key={slot.start}
													variant="outline"
													className="w-full justify-center font-normal"
													onClick={() => {
														setSelectedSlot(slot);
														setConfirmOpen(true);
													}}
												>
													{formatSlotTime(slot.start)}
												</Button>
											))}
										</div>
									</ScrollArea>
								)}
							</>
						) : (
							<div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
								<CalendarDays className="h-8 w-8 opacity-40" />
								<p className="text-sm">
									Select a date on the calendar to see available times.
								</p>
							</div>
						)}
					</div>
				</div>
			</CardContent>

			{/* Confirmation dialog */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Booking</DialogTitle>
						<DialogDescription>
							{selectedSlot && (
								<>
									You are about to book a session on{' '}
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
		</Card>
	);
}
