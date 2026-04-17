import { addDays, set } from 'date-fns';

const weekdayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export interface TemporalExtraction {
  dateTime: Date | null;
  isoString: string | null;
  allDay: boolean;
  matchedDateText: string | null;
  matchedTimeText: string | null;
}

export function normalizeCommandText(value: string): string {
  return value.toLowerCase().replace(/[?.!,]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function extractTemporalExpression(
  source: string,
  now = new Date(),
  defaults?: { defaultHour?: number; defaultMinute?: number }
): TemporalExtraction {
  const normalized = normalizeCommandText(source);
  let baseDate: Date | null = null;
  let matchedDateText: string | null = null;
  let matchedTimeText: string | null = null;
  let hours: number | null = null;
  let minutes = 0;

  if (/\btomorrow\b/.test(normalized)) {
    baseDate = addDays(now, 1);
    matchedDateText = 'tomorrow';
  } else if (/\btoday\b/.test(normalized)) {
    baseDate = now;
    matchedDateText = 'today';
  } else {
    const nextWeekdayMatch = normalized.match(
      /\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
    );

    if (nextWeekdayMatch) {
      matchedDateText = nextWeekdayMatch[0];
      baseDate = nextWeekday(now, nextWeekdayMatch[1], true);
    } else {
      const weekdayMatch = normalized.match(
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
      );

      if (weekdayMatch) {
        matchedDateText = weekdayMatch[1];
        baseDate = nextWeekday(now, weekdayMatch[1], false);
      }
    }
  }

  const timeMatch = normalized.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);

  if (timeMatch) {
    matchedTimeText = timeMatch[0];
    const parsedHour = Number(timeMatch[1]);
    const parsedMinutes = Number(timeMatch[2] ?? '0');
    const meridiem = timeMatch[3];

    if (meridiem === 'pm' && parsedHour < 12) {
      hours = parsedHour + 12;
    } else if (meridiem === 'am' && parsedHour === 12) {
      hours = 0;
    } else {
      hours = parsedHour;
    }

    minutes = parsedMinutes;
  }

  if (!baseDate) {
    return {
      dateTime: null,
      isoString: null,
      allDay: hours === null,
      matchedDateText,
      matchedTimeText,
    };
  }

  const dateTime = set(baseDate, {
    hours: hours ?? defaults?.defaultHour ?? 9,
    minutes: hours === null ? defaults?.defaultMinute ?? 0 : minutes,
    seconds: 0,
    milliseconds: 0,
  });

  return {
    dateTime,
    isoString: dateTime.toISOString(),
    allDay: hours === null,
    matchedDateText,
    matchedTimeText,
  };
}

export function stripTemporalText(
  source: string,
  extraction: TemporalExtraction
): string {
  let value = source;

  if (extraction.matchedDateText) {
    value = value.replace(
      new RegExp(escapeRegExp(extraction.matchedDateText), 'i'),
      ' '
    );
  }

  if (extraction.matchedTimeText) {
    value = value.replace(
      new RegExp(escapeRegExp(extraction.matchedTimeText), 'i'),
      ' '
    );
  }

  return value.replace(/\s+/g, ' ').trim();
}

function nextWeekday(
  referenceDate: Date,
  weekdayName: string,
  forceNextWeek: boolean
): Date {
  const targetDay = weekdayMap[weekdayName];
  const currentDay = referenceDate.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;

  if (daysUntil === 0 || forceNextWeek) {
    daysUntil += 7;
  }

  return addDays(referenceDate, daysUntil);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
