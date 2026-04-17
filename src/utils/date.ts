import {
  endOfDay,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from 'date-fns';

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function toIsoString(value: string | Date): string {
  return toDate(value).toISOString();
}

export function formatLongDate(value: string | Date): string {
  return format(toDate(value), 'EEEE, MMM d');
}

export function formatTimeLabel(value: string | Date): string {
  return format(toDate(value), 'h:mm a');
}

export function formatDateTimeLabel(value: string | Date): string {
  return format(toDate(value), 'EEE, MMM d • h:mm a');
}

export function formatHumanDueLabel(
  value: string | null,
  allDay = false,
  referenceDate = new Date()
): string {
  if (!value) {
    return 'No due date';
  }

  const date = toDate(value);

  if (isToday(date)) {
    return allDay ? 'Today' : `Today • ${formatTimeLabel(date)}`;
  }

  if (isTomorrow(date)) {
    return allDay ? 'Tomorrow' : `Tomorrow • ${formatTimeLabel(date)}`;
  }

  if (isSameDay(date, referenceDate)) {
    return allDay ? 'Today' : `Today • ${formatTimeLabel(date)}`;
  }

  return allDay ? format(date, 'EEE, MMM d') : formatDateTimeLabel(date);
}

export function getLocalDayRange(referenceDate = new Date()): {
  start: string;
  end: string;
} {
  return {
    start: startOfDay(referenceDate).toISOString(),
    end: endOfDay(referenceDate).toISOString(),
  };
}

export function isSameCalendarDay(
  left: string | Date,
  right: string | Date
): boolean {
  return isSameDay(toDate(left), toDate(right));
}

export function formatCommandDateAnswer(
  value: string,
  allDay = false,
  referenceDate = new Date()
): string {
  const date = toDate(value);

  if (isToday(date)) {
    return allDay ? 'today' : `today at ${formatTimeLabel(date)}`;
  }

  if (isTomorrow(date)) {
    return allDay ? 'tomorrow' : `tomorrow at ${formatTimeLabel(date)}`;
  }

  const absolute = format(date, allDay ? 'EEEE, MMMM d' : 'EEEE, MMMM d');
  return allDay ? absolute : `${absolute} at ${formatTimeLabel(date)}`;
}
