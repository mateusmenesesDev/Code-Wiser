# Mentorship Scheduling Feature

This feature allows users with active mentorship subscriptions to schedule one-on-one sessions with their mentor through Cal.com Embed integration.

## Features

- **Weekly Session Management**: Users can have 1-3 mentorship sessions per week (configurable per user)
- **Cal.com Embed Integration**: iframe-based booking with Cal.com's full interface
- **Seamless Booking Experience**: Native Cal.com UI with full calendar, time slot selection, and confirmation
- **Zero Dependencies**: Simple iframe embed without complex package dependencies
- **Automatic Weekly Reset**: Sessions reset every Monday at midnight UTC
- **Session Tracking**: View upcoming and past sessions
- **Booking Cancellation**: Cancel sessions with automatic session count restoration
- **Admin Controls**: Admins can manage user weekly session limits and manually reset sessions

## Architecture

### Database Schema

- **User Model Extensions**:

  - `weeklyMentorshipSessions`: Number of sessions allowed per week (1-3)
  - `remainingWeeklySessions`: Current week's available sessions
  - `weeklySessionsResetAt`: Next reset date

- **MentorshipBooking Model**:
  - Tracks all scheduled, completed, and cancelled sessions
  - Links to Cal.com booking IDs for synchronization

### Providers

- **Cal Provider** (`src/providers/CalProvider.tsx`):
  - Wraps the app with Cal.com Atoms CalProvider
  - Configures Cal.com API connection
  - Enables Cal.com Atoms components throughout the app

### Services

- **Cal.com Service** (`src/server/services/calcom/calcomService.ts`):

  - API client for Cal.com v2
  - Handles booking cancellation and fetching
  - Note: Booking creation is handled by Cal.com Atoms on the client side

- **Mentorship Service** (`src/server/services/mentorship/mentorshipService.ts`):
  - Business logic for session management
  - Weekly reset functionality
  - Session count tracking

### API Routes

- **tRPC Router** (`src/server/api/routers/mentorship/mentorship.ts`):

  - `getMyMentorshipStatus`: Get user's mentorship info
  - `getAvailableSlots`: Fetch Cal.com availability
  - `getMyBookings`: List user's bookings
  - `bookSession`: Create new booking
  - `cancelBooking`: Cancel existing booking

- **Cron Endpoint** (`src/app/api/cron/reset-weekly-sessions/route.ts`):
  - Automated weekly reset (runs every Monday at midnight UTC)
  - Protected by CRON_SECRET

## Environment Variables

Required environment variables:

```env
# Cal.com Integration
CALCOM_API_KEY=your_calcom_api_key
CALCOM_EVENT_TYPE_ID=your_event_type_id
NEXT_PUBLIC_CALCOM_USERNAME=mentor_username
NEXT_PUBLIC_CALCOM_CLIENT_ID=your_calcom_client_id (optional for Atoms)

# Cron Job Security
CRON_SECRET=your_secure_secret
```

## Usage

### For Users

1. Navigate to `/mentorship` (only visible with active mentorship)
2. View remaining sessions for the week
3. Click "Book New Session" to schedule
4. Select date and time from available slots
5. Confirm booking
6. Manage bookings from the dashboard

### For Admins

1. Go to "User Management" in admin panel
2. Edit user to set `weeklyMentorshipSessions` (1-3)
3. Use "Reset Weekly Sessions" button if mentor couldn't attend
4. View session usage in the users table

## Components

- **MentorshipDashboard**: Main dashboard with overview and booking list
- **BookSessionDialog**: Cal.com Atoms Booker component with native Cal.com UI
- **MyBookingsList**: Table of upcoming and past sessions
- **SessionLimitAlert**: Warning when weekly limit is reached
- **MentorshipSkeleton**: Loading state
- **MentorshipError**: Error handling with retry

### Cal.com Atoms Integration

The booking interface uses Cal.com's official Atoms library (`@calcom/atoms`), which provides:

- Pre-built, production-ready booking UI
- Automatic availability checking
- Native Cal.com experience
- Customizable styling
- Built-in form validation
- Responsive design out of the box

## Hooks

- **useMentorshipStatus**: Get mentorship status and session info

## Utilities

- **mentorshipAccess**: Helper functions for access control and date formatting

## Weekly Reset

The weekly reset runs automatically via Vercel Cron:

- Schedule: Every Monday at 00:00 UTC
- Resets `remainingWeeklySessions` to `weeklyMentorshipSessions`
- Updates `weeklySessionsResetAt` to next Monday
- Only affects users with `mentorshipStatus: ACTIVE`

## Navigation

The Mentorship menu item is conditionally displayed:

- Only shown to users with `mentorshipStatus: ACTIVE`
- Appears in both desktop navigation and mobile menu
- Redirects to home if accessed without active mentorship

## Future Enhancements

- Multiple mentors support
- Session feedback/ratings
- Recurring session scheduling
- Calendar integration (Google Calendar, Outlook)
- Session reminders via email/SMS
- Session notes and recordings
