export enum Role {
  SUPERUSER = 'superuser',      // Top of hierarchy — full access to ALL APIs
  EVENTMANAGER = 'eventmanager', // Formerly: superuser — manages events, approves requests
  CLIENT = 'client',             // New role — creates events, polls, answers attendee Q&A
  OSC = 'osc',                   // On-Site Coordinator — manages team & scanner
  ATTENDEE = 'attendee',         // Formerly: enduser — browse events, RSVP, Q&A
}
