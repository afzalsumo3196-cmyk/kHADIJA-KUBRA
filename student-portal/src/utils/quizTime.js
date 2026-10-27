/**
 * quizTime.js
 * Timezone utilities for Quizzes in Pakistan Standard Time (PKT, UTC+5, Asia/Karachi).
 * Pakistan has no Daylight Saving Time (DST). Fixed UTC+5 offset.
 */

const PKT_TIMEZONE = 'Asia/Karachi';

/**
 * Validates whether an input can be parsed into a valid Date.
 */
export const isValidDate = (d) => {
  if (!d) return false;
  const date = new Date(d);
  return !isNaN(date.getTime());
};

/**
 * Formats a Date or ISO string into PKT display: "12 Oct, 12:39 PM"
 * Missing or invalid date returns "—".
 */
export const formatPkt = (isoOrDate) => {
  if (!isoOrDate) return '—';
  const date = new Date(isoOrDate);
  if (isNaN(date.getTime())) return '—';

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: PKT_TIMEZONE,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const parts = formatter.formatToParts(date);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const day = partMap.day;
    const month = partMap.month;
    const hour = partMap.hour;
    const minute = partMap.minute;
    const dayPeriod = (partMap.dayPeriod || '').toUpperCase();

    if (!day || !month || !hour || !minute || !dayPeriod) {
      return '—';
    }

    return `${day} ${month}, ${hour}:${minute} ${dayPeriod}`;
  } catch {
    return '—';
  }
};

/**
 * Formats a Date or ISO string into PKT datetime-local value: "YYYY-MM-DDTHH:mm"
 * Uses Intl.DateTimeFormat with formatToParts to guarantee Asia/Karachi representation.
 * NEVER uses toISOString().slice or local getHours.
 */
export const utcToPktInputValue = (isoOrDate) => {
  if (!isoOrDate) return '';
  const date = new Date(isoOrDate);
  if (isNaN(date.getTime())) return '';

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PKT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(date);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const year = partMap.year;
    const month = partMap.month;
    const day = partMap.day;
    let hour = partMap.hour;
    if (hour === '24') hour = '00';
    const minute = partMap.minute;

    if (!year || !month || !day || !hour || !minute) {
      return '';
    }

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return '';
  }
};

/**
 * Converts a datetime-local input string ("2026-10-12T12:39") representing PKT wall-clock
 * into a UTC ISO string ("2026-10-12T07:39:00.000Z").
 * Handles cases where seconds might be missing. Invalid inputs return null.
 */
export const pktInputValueToIso = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Expected format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const sec = second || '00';

  // Construct explicit PKT ISO offset (+05:00)
  const pktIsoString = `${year}-${month}-${day}T${hour}:${minute}:${sec}+05:00`;
  const parsed = new Date(pktIsoString);

  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

/**
 * Calculates quiz status based on UTC timestamps vs current instant Date.now().
 * Returns 'UPCOMING' | 'LIVE' | 'EXPIRED'.
 */
export const getQuizStatus = (startIso, endIso) => {
  const now = Date.now();
  const hasStart = isValidDate(startIso);
  const hasEnd = isValidDate(endIso);

  if (!hasStart && !hasEnd) {
    return 'LIVE';
  }

  const startTime = hasStart ? new Date(startIso).getTime() : -Infinity;
  const endTime = hasEnd ? new Date(endIso).getTime() : Infinity;

  if (now < startTime) {
    return 'UPCOMING';
  }
  if (now > endTime) {
    return 'EXPIRED';
  }
  return 'LIVE';
};
