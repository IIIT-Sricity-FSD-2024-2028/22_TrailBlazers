/**
 * Event Manager Capacity and Workload Configuration
 *
 * Distinct Constraints:
 * 1. Workload Threshold (Rule A): Threshold of 15 workload points (derived from active operational tasks).
 * 2. Maximum Active Assigned Events (Rule B): Hard ceiling of 7 active assigned events per Event Manager.
 *
 * An Event Manager is eligible for another assignment only if:
 * 1. Current workload remains below 15 under the workload calculation.
 * 2. Active assigned-event count remains below 7.
 * 3. Schedule and operational eligibility requirements are satisfied.
 */

export const DEFAULT_EVENT_MANAGER_MAX_ASSIGNED_EVENTS = 7;
export const DEFAULT_EVENT_MANAGER_WORKLOAD_THRESHOLD = 15;

export const getEventManagerMaxAssignedEvents = (): number => {
  const envVal = process.env.EVENT_MANAGER_MAX_ASSIGNED_EVENTS || process.env.EVENT_MANAGER_MAX_CAPACITY;
  const parsed = envVal ? parseInt(envVal, 10) : NaN;
  return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_EVENT_MANAGER_MAX_ASSIGNED_EVENTS;
};

export const getEventManagerWorkloadThreshold = (): number => {
  const envVal = process.env.EVENT_MANAGER_WORKLOAD_THRESHOLD;
  const parsed = envVal ? parseInt(envVal, 10) : NaN;
  return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_EVENT_MANAGER_WORKLOAD_THRESHOLD;
};

// Backwards-compatible alias for maximum assigned events
export const getEventManagerMaxCapacity = (): number => {
  return getEventManagerMaxAssignedEvents();
};
