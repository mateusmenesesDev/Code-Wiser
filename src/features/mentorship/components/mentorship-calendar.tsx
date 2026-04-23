'use client';

import type { DayButtonProps } from 'react-day-picker';
import { Lock, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Calendar } from '~/common/components/ui/calendar';
import {
	Card,
	CardContent,
	CardDescription,
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
import { Skeleton } from '~/common/components/ui/skeleton';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import { formatSessionDateTime } from '../utils/mentorshipAccess';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Format a UTC date to a YYYY-MM-DD key using the browser's local date */
function toLocalDateKey(date: Date): string {
	return new Intl.DateTimeFormat('en-CA').format(date); // en-CA gives YYYY-MM-DD
}

/** Start of today at 00:00:00 local time */
function todayStart(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Format a slot start ISO string into a user-friendly local time label */
function formatSlotTime(isoString: string): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	}).format(new Date(isoString));
}

// ─── types ───────────────────────────────────────────────────────────────────

type DayState = 'available' | 'fullyBooked' | 'weeklyLocked' | 'past';

interface SlotOption {
	start: string;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function CalendarSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-64" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<Skeleton className="h-8 w-full" />
					{Array.from({ length: 5 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
						<Skeleton key={i} className="h-9 w-full" />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

interface CalendarErrorProps {
	onRetry: () => void;
}

function CalendarError({ onRetry }: CalendarErrorProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Book Your Next Session</CardTitle>
				<CardDescription>
					Select an available time slot with your mentor.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
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

// ─── main component ──────────────────────────────────────────────────────────

export function MentorshipCalendar() {
	const { userEmail, userName } = useAuth();
	const utils = api.useUtils();

	const today = todayStart();
	const windowEnd = new Date(today);
	windowEnd.setDate(today.getDate() + 28);

	// Fetch available slots for the 4-week window
	const {
		data: slotsGrouped,
		isLoading: slotsLoading,
		isError: slotsError,
		refetch: refetchSlots
	} = api.mentorship.getAvailableSlots.useQuery({
		startDate: today.toISOString(),
		endDate: windowEnd.toISOString()
	});

	// Fetch week info (includes per-week booking counts)
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
		onError: (err) => {
			toast.error(`Booking failed: ${err.message}`);
		}
	});

	// ── day-state computation ────────────────────────────────────────────────

	const dayStates = new Map<string, DayState>();

	if (slotsGrouped && weekInfo) {
		const cap = weekInfo.weeklyMentorshipSessions;

		// Build a fast set of locked week-start timestamps
		const lockedWeekStarts = new Set<number>(
			weekInfo.weeklyBookingCounts
				.filter((w) => w.scheduledCount >= cap)
				.map((w) => new Date(w.weekStart).getTime())
		);

		for (let d = new Date(today); d < windowEnd; d.setDate(d.getDate() + 1)) {
			const key = toLocalDateKey(d);

			// Slots for this day (Cal.com keys are also YYYY-MM-DD in the event type's timezone,
			// which may differ from local — this is an approximation that works for single-TZ setups)
			const slots = slotsGrouped[key] ?? [];

			if (slots.length > 0) {
				// Check if this day falls in a weekly-locked week
				const weekDay = d.getUTCDay();
				const daysFromMonday = weekDay === 0 ? 6 : weekDay - 1;
				const weekStart = new Date(d);
				weekStart.setUTCDate(d.getUTCDate() - daysFromMonday);
				weekStart.setUTCHours(0, 0, 0, 0);

				if (lockedWeekStarts.has(weekStart.getTime())) {
					dayStates.set(key, 'weeklyLocked');
				} else {
					dayStates.set(key, 'available');
				}
			} else {
				dayStates.set(key, 'fullyBooked');
			}
		}
	}

	// ── modifiers ────────────────────────────────────────────────────────────

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

	// ── slot picker ──────────────────────────────────────────────────────────

	const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : null;
	const slotsForSelectedDay: SlotOption[] =
		selectedDateKey && slotsGrouped ? (slotsGrouped[selectedDateKey] ?? []) : [];

	// ── handlers ─────────────────────────────────────────────────────────────

	const handleDayClick = (day: Date) => {
		const key = toLocalDateKey(day);
		const state = dayStates.get(key);
		if (state === 'available') {
			setSelectedDate(day);
			setSelectedSlot(undefined);
		}
	};

	const handleSlotSelect = (slot: SlotOption) => {
		setSelectedSlot(slot);
		setConfirmOpen(true);
	};

	const handleConfirmBooking = () => {
		if (!selectedSlot || !userEmail || !userName) return;
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		bookMutation.mutate({
			start: selectedSlot.start,
			timeZone: tz,
			attendeeName: userName,
			attendeeEmail: userEmail
		});
		setConfirmOpen(false);
	};

	// ── early states ─────────────────────────────────────────────────────────

	if (slotsLoading) return <CalendarSkeleton />;
	if (slotsError) return <CalendarError onRetry={() => void refetchSlots()} />;

	// ── render ───────────────────────────────────────────────────────────────

	return (
		<Card>
			<CardHeader>
				<CardTitle>Book Your Next Session</CardTitle>
				<CardDescription>
					Select an available date, then choose a time slot.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Legend */}
				<div className='flex flex-wrap gap-4 text-muted-foreground text-xs'>
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-3 w-3 rounded-full bg-primary" />
						Available
					</span>
					<span className="flex items-center gap-1.5">
						<X className="h-3 w-3 text-muted-foreground/60" />
						Fully booked
					</span>
					<span className="flex items-center gap-1.5">
						<Lock className="h-3 w-3 text-amber-500" />
						Weekly limit reached
					</span>
				</div>

				{/* Calendar */}
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={(day) => day && handleDayClick(day)}
					disabled={(day) => day < today || day >= windowEnd}
					fromDate={today}
					toDate={windowEnd}
					modifiers={{ available, fullyBooked, weeklyLocked }}
					modifiersClassNames={{
						available: 'rdp-day_available',
						fullyBooked: 'rdp-day_fullyBooked',
						weeklyLocked: 'rdp-day_weeklyLocked'
					}}
					components={{
						DayButton: ({
							day,
							modifiers,
							...buttonProps
						}: DayButtonProps) => {
							const isFullyBooked = modifiers.fullyBooked as boolean | undefined;
							const isWeeklyLocked =
								modifiers.weeklyLocked as boolean | undefined;
							const isDisabled = modifiers.disabled as boolean | undefined;
							return (
								<button
									{...buttonProps}
									className={[
										buttonProps.className,
										'relative',
										isFullyBooked && !isDisabled
											? 'cursor-not-allowed opacity-40'
											: '',
										isWeeklyLocked && !isDisabled
											? 'cursor-not-allowed opacity-60'
											: ''
									]
										.filter(Boolean)
										.join('')}
									disabled={
										buttonProps.disabled ||
										isFullyBooked ||
										isWeeklyLocked
									}
									title={
										isWeeklyLocked
											? 'Weekly session limit reached'
											: isFullyBooked && !isDisabled
												? 'No available slots'
												: undefined
									}
								>
									{buttonProps.children}
									{isFullyBooked && !isDisabled && (
										<span className="-translate-x-1/2 absolute bottom-0.5 left-1/2 flex h-3 w-3 items-center justify-center">
											<X className="h-2.5 w-2.5 text-muted-foreground/60" />
										</span>
									)}
									{isWeeklyLocked && !isDisabled && (
										<span className="-translate-x-1/2 absolute bottom-0.5 left-1/2 flex h-3 w-3 items-center justify-center">
											<Lock className="h-2.5 w-2.5 text-amber-500" />
										</span>
									)}
								</button>
							);
						}
					}}
					className="rounded-md border"
				/>

				{/* Time slot list */}
				{selectedDate && (
					<div className="space-y-2">
						<p className="font-medium text-sm">
							Available times on{' '}
							{new Intl.DateTimeFormat(undefined, {
								weekday: 'long',
								month: 'long',
								day: 'numeric'
							}).format(selectedDate)}
						</p>
						{slotsForSelectedDay.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No slots available for this day.
							</p>
						) : (
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
								{slotsForSelectedDay.map((slot) => (
									<Button
										key={slot.start}
										variant="outline"
										size="sm"
										onClick={() => handleSlotSelect(slot)}
									>
										{formatSlotTime(slot.start)}
									</Button>
								))}
							</div>
						)}
					</div>
				)}

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
			</CardContent>
		</Card>
	);
}
