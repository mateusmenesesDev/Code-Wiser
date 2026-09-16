# Internal mentorship scheduling

**Status:** accepted

Mentorship scheduling will be owned by the application: each session has an explicit mentor, mentor availability is defined by recurring weekly windows plus date exceptions in the mentor's IANA timezone, and the first version uses one fixed-duration session type. Booking instants are stored independently of display timezones, each user has a saved timezone for presentation, and the weekly entitlement counts future confirmed reservations. Cal.com and external calendar synchronization are outside the first cut; this keeps one internal source of truth at the cost of not automatically blocking external commitments.
