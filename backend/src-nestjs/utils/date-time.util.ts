/**
 * Date and Time Utility Functions for Wavevents Platform
 */

export interface ParsedTime {
  hours: number;
  minutes: number;
}

/**
 * Parses various time representations:
 * - 12-hour: '09:00 AM', '9:30pm', '12:00 PM', '12:15 AM'
 * - 24-hour: '14:30', '09:00', '18:45:00'
 */
export function parseTimeString(timeStr?: string | null): ParsedTime | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const raw = timeStr.trim();
  if (!raw) return null;

  // 12-hour or 24-hour regex with optional seconds and AM/PM
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours > 12) return null; // Invalid 12-hour representation
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return { hours, minutes };
}

/**
 * Combines YYYY-MM-DD date string with optional time into a Date object.
 */
export function parseEventDateTime(
  dateStr: string,
  timeStr?: string | null,
  defaultHour = 0,
  defaultMin = 0,
): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const dateMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1;
  const day = parseInt(dateMatch[3], 10);

  let hours = defaultHour;
  let minutes = defaultMin;

  if (timeStr) {
    const parsedTime = parseTimeString(timeStr);
    if (parsedTime) {
      hours = parsedTime.hours;
      minutes = parsedTime.minutes;
    }
  }

  const d = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns today's date string in YYYY-MM-DD based on local system time.
 */
export function getTodayDateString(refDate: Date = new Date()): string {
  const y = refDate.getFullYear();
  const m = String(refDate.getMonth() + 1).padStart(2, '0');
  const d = String(refDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Validates event request date and time range according to business rules:
 * 1. Event start date cannot be in the past.
 * 2. Event end date cannot be earlier than start date.
 * 3. If the start date is today, start time must be in the future.
 * 4. If the end date is today, end time must be in the future.
 * 5. If start and end dates are the same, end time must be later than start time.
 * 6. If dates are different, ensure complete date-time range is valid.
 */
export function validateEventDateTimeRange(
  startDateStr: string,
  endDateStr: string,
  startTimeStr?: string | null,
  endTimeStr?: string | null,
  now: Date = new Date(),
): { valid: boolean; error?: string; field?: 'startDate' | 'endDate' | 'startTime' | 'endTime' } {
  const todayStr = getTodayDateString(now);

  const sDate = (startDateStr || '').trim();
  const eDate = (endDateStr || '').trim();

  if (!sDate) {
    return { valid: false, error: 'Start Date is required.', field: 'startDate' };
  }
  if (!eDate) {
    return { valid: false, error: 'End Date is required.', field: 'endDate' };
  }

  // 1. Event start date cannot be in the past
  if (sDate < todayStr) {
    return {
      valid: false,
      error: 'Event start date cannot be in the past.',
      field: 'startDate',
    };
  }

  // 2. Event end date cannot be earlier than the start date
  if (eDate < sDate) {
    return {
      valid: false,
      error: 'Event end date cannot be earlier than the start date.',
      field: 'endDate',
    };
  }

  const parsedStartTime = parseTimeString(startTimeStr);
  const parsedEndTime = parseTimeString(endTimeStr);

  const startDateTime = parseEventDateTime(
    sDate,
    startTimeStr,
    parsedStartTime ? parsedStartTime.hours : 0,
    parsedStartTime ? parsedStartTime.minutes : 0,
  );

  const endDateTime = parseEventDateTime(
    eDate,
    endTimeStr,
    parsedEndTime ? parsedEndTime.hours : 23,
    parsedEndTime ? parsedEndTime.minutes : 59,
  );

  if (!startDateTime || !endDateTime) {
    return { valid: false, error: 'Invalid date or time format provided.' };
  }

  // 3. If the start date is today, the start time must be in the future
  if (sDate === todayStr) {
    if (parsedStartTime) {
      if (startDateTime.getTime() <= now.getTime()) {
        return {
          valid: false,
          error: 'Since the event starts today, the start time must be in the future.',
          field: 'startTime',
        };
      }
    }
  }

  // 4. If the end date is today, the end time must be in the future
  if (eDate === todayStr) {
    if (parsedEndTime) {
      if (endDateTime.getTime() <= now.getTime()) {
        return {
          valid: false,
          error: 'Since the event ends today, the end time must be in the future.',
          field: 'endTime',
        };
      }
    }
  }

  // 5. If the start and end dates are the same, the end time must be later than the start time
  if (sDate === eDate) {
    if (parsedStartTime && parsedEndTime) {
      const startMinutes = parsedStartTime.hours * 60 + parsedStartTime.minutes;
      const endMinutes = parsedEndTime.hours * 60 + parsedEndTime.minutes;
      if (endMinutes <= startMinutes) {
        return {
          valid: false,
          error: 'Event end time must be later than start time for same-day events.',
          field: 'endTime',
        };
      }
    }
  }

  // 6. If the dates are different, ensure the complete event date-time range is valid
  if (endDateTime.getTime() <= startDateTime.getTime()) {
    return {
      valid: false,
      error: 'Complete event end date and time must be after the start date and time.',
      field: 'endDate',
    };
  }

  return { valid: true };
}

export interface ClientCancellationTierInfo {
  isPermitted: boolean;
  restrictionReason?: string;
  hoursRemaining: number;
  daysRemaining: number;
  tierName: string;
  refundPercentage: number;
  deductionPercentage: number;
  totalPaidAmount: number;
  deductionAmount: number;
  refundableAmount: number;
  policyTiers: Array<{
    period: string;
    refundPercent: number;
    deductionPercent: number;
    description: string;
    isActive: boolean;
  }>;
}

/**
 * Calculates client cancellation refund tier based on event start time and total paid:
 * - More than 30 days before event: 90% Refund
 * - 15–30 days before event: 75% Refund
 * - 7–14 days before event: 50% Refund
 * - 3–6 days before event: 25% Refund
 * - Less than 72 hours: 0% Refund
 * - Event already started: Cancellation not permitted
 */
export function computeClientCancellationTier(
  eventDateTime: Date,
  totalPaidAmount: number,
  now: Date = new Date(),
): ClientCancellationTierInfo {
  const diffMs = eventDateTime.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.floor(hoursRemaining / 24));

  let tierKey: 'PAST' | 'LESS_THAN_72H' | '3_TO_6_DAYS' | '7_TO_14_DAYS' | '15_TO_30_DAYS' | 'MORE_THAN_30_DAYS';
  let isPermitted = true;
  let restrictionReason = '';
  let refundPercentage = 0;
  let deductionPercentage = 100;
  let tierName = '';

  if (diffMs <= 0) {
    tierKey = 'PAST';
    isPermitted = false;
    restrictionReason = 'This event cannot be cancelled because it has already started or has been completed.';
    refundPercentage = 0;
    deductionPercentage = 100;
    tierName = 'Event already started';
  } else if (hoursRemaining < 72) {
    tierKey = 'LESS_THAN_72H';
    refundPercentage = 0;
    deductionPercentage = 100;
    tierName = 'Less than 72 hours before event';
  } else if (hoursRemaining < 168) {
    tierKey = '3_TO_6_DAYS';
    refundPercentage = 25;
    deductionPercentage = 75;
    tierName = '3–6 days before event';
  } else if (hoursRemaining < 360) {
    tierKey = '7_TO_14_DAYS';
    refundPercentage = 50;
    deductionPercentage = 50;
    tierName = '7–14 days before event';
  } else if (hoursRemaining <= 720) {
    tierKey = '15_TO_30_DAYS';
    refundPercentage = 75;
    deductionPercentage = 25;
    tierName = '15–30 days before event';
  } else {
    tierKey = 'MORE_THAN_30_DAYS';
    refundPercentage = 90;
    deductionPercentage = 10;
    tierName = 'More than 30 days before event';
  }

  const refundableAmount = Math.round((totalPaidAmount * refundPercentage) / 100);
  const deductionAmount = totalPaidAmount - refundableAmount;

  const policyTiers = [
    {
      period: 'More than 30 days before event',
      refundPercent: 90,
      deductionPercent: 10,
      description: '90% Refund (10% standard reservation & administrative fee)',
      isActive: tierKey === 'MORE_THAN_30_DAYS',
    },
    {
      period: '15–30 days before event',
      refundPercent: 75,
      deductionPercent: 25,
      description: '75% Refund (25% operational setup & scheduling charge)',
      isActive: tierKey === '15_TO_30_DAYS',
    },
    {
      period: '7–14 days before event',
      refundPercent: 50,
      deductionPercent: 50,
      description: '50% Refund (50% vendor commitment & reservation charge)',
      isActive: tierKey === '7_TO_14_DAYS',
    },
    {
      period: '3–6 days before event',
      refundPercent: 25,
      deductionPercent: 75,
      description: '25% Refund (75% advanced logistics expenses retained)',
      isActive: tierKey === '3_TO_6_DAYS',
    },
    {
      period: 'Less than 72 hours',
      refundPercent: 0,
      deductionPercent: 100,
      description: '0% Refund (100% full logistics and vendor commitment retained)',
      isActive: tierKey === 'LESS_THAN_72H',
    },
    {
      period: 'Event already started',
      refundPercent: 0,
      deductionPercent: 100,
      description: 'Cancellation not permitted through normal client cancellation',
      isActive: tierKey === 'PAST',
    },
  ];

  return {
    isPermitted,
    restrictionReason: isPermitted ? undefined : restrictionReason,
    hoursRemaining,
    daysRemaining,
    tierName,
    refundPercentage,
    deductionPercentage,
    totalPaidAmount,
    deductionAmount,
    refundableAmount,
    policyTiers,
  };
}
