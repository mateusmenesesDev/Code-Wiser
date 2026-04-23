'use client';

import type { DayButtonProps } from 'react-day-picker';
import { Lock, X } from 'lucide-react';
import { useState } from 'react';
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
import { api } from '~/trpc/react';
import { formatSessionDateTime } from '../utils/mentorshipAccess';

// ─── helpers (duplicated from mentorship-calendar to keep components self-contained)

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

// ─── types ────────────────────────────────────────────────────────────────────

interface SlotOption {
	start: string;
}

interface RescheduleModalProps {
	bookingId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function RescheduleModal({
	bookingId,
	open,
	onOpenChange,
	onSuccess
}: RescheduleModalProps) {
	const today = todayStart();
	const windowEnd = new Date(today);
	windowEnd.setDate(today.getDate() + 28);

	const { data: slotsGrouped, isLoading: slotsLoading } =
		api.mentorship.getAvailableSlots.useQuery(
			{
				startDate: today.toISOString(),
				endDate: windowEnd.toISOString()
			},
			{ enabled: open }
		);

	const { data: weekInfo } = api.mentorship.getMyMentorshipWeekInfo.useQuery(
		undefined,
		{ enabled: open }
	);

	const [selectedDate, setSelectedDate] = useState<Date | undefined>();
	const [selectedSlot, setSelectedSlot] = useState<SlotOption | undefined>();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const rescheduleMutation = api.mentorship.rescheduleBooking.useMutation({
		onSuccess: () => {
			onSuccess();
			onOpenChange(false);
			setSelectedDate(undefined);
			setSelectedSlot(undefined);
		}
	});

	// ── day-state computation (mirrors MentorshipCalendar) ───────────────────

	const dayStates = new Map<string, 'available' | 'fullyBooked' | 'weeklyLocked'>();

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

	const handleConfirmReschedule = () => {
		if (!selectedSlot) return;
		rescheduleMutation.mutate({
			bookingId,
			newStart: selectedSlot.start
		});
		setConfirmOpen(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Reschedule Session</DialogTitle>
						<DialogDescription>
							Pick a new date and time for your mentorship session.
						</DialogDescription>
					</DialogHeader>

					{slotsLoading ? (
						<div className="flex justify-center py-8">
							<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
						</div>
					) : (
						<div className="space-y-4">
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
										const isFullyBooked =
											modifiers.fullyBooked as boolean | undefined;
										const isWeeklyLocked =
											modifiers.weeklyLocked as boolean | undefined;
										const isDisabled =
											modifiers.disabled as boolean | undefined;
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
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={rescheduleMutation.isPending}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Nested confirmation dialog */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Reschedule</DialogTitle>
						<DialogDescription>
							{selectedSlot && (
								<>
									Move your session to{' '}
									<strong>
										{formatSessionDateTime(new Date(selectedSlot.start))}
									</strong>{' '}
									(your local time)?
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmOpen(false)}
							disabled={rescheduleMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmReschedule}
							disabled={rescheduleMutation.isPending}
						>
							{rescheduleMutation.isPending ? 'Rescheduling…' : 'Confirm'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
