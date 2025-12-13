import type { MentorshipBookingStatus } from '@prisma/client';

export interface AvailableSlot {
	start: string;
	end: string;
}

export interface BookingDetails {
	id: string;
	calBookingId: string;
	scheduledAt: Date;
	status: MentorshipBookingStatus;
	createdAt: Date;
}

export interface MentorshipStatusInfo {
	mentorshipStatus: 'ACTIVE' | 'INACTIVE';
	mentorshipType: string | null;
	weeklyMentorshipSessions: number;
	remainingWeeklySessions: number;
	weeklySessionsResetAt: Date | null;
	mentorshipStartDate: Date | null;
	mentorshipEndDate: Date | null;
}
