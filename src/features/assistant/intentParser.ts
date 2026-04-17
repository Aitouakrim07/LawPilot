import { addHours } from 'date-fns';
import type { Client, ParsedVoiceCommand } from '../../types/models';
import {
  extractTemporalExpression,
  normalizeCommandText,
  stripTemporalText,
} from './dateParser';

export function parseVoiceCommand(
  transcript: string,
  clients: Client[],
  now = new Date()
): ParsedVoiceCommand {
  const normalized = normalizeCommandText(transcript);
  const matchedClient = findMentionedClient(normalized, clients);

  if (
    /\bwhat reminder did i ask you to create\b/.test(normalized) ||
    /\bwhat did i ask you to remind me about\b/.test(normalized)
  ) {
    const queryText = extractAboutSubject(transcript) ?? matchedClient?.name ?? null;

    return {
      intent: 'query_reminder_history',
      entities: {
        queryText,
        clientId: matchedClient?.id ?? null,
        clientName: matchedClient?.name ?? null,
      },
    };
  }

  if (/\bwhat do i have today\b/.test(normalized)) {
    return {
      intent: 'query_today',
      entities: {
        referenceDate: now.toISOString(),
      },
    };
  }

  if (
    /\bshow pending follow[ -]?ups\b/.test(normalized) ||
    /\bpending follow[ -]?ups\b/.test(normalized)
  ) {
    return {
      intent: 'query_pending_followups',
      entities: {},
    };
  }

  if (/\bmark\b.*\breminder\b.*\bdone\b/.test(normalized)) {
    const queryText =
      extractReminderCompletionTarget(transcript) ??
      matchedClient?.name ??
      extractAboutSubject(transcript) ??
      null;

    return {
      intent: 'mark_reminder_done',
      entities: {
        queryText,
        clientId: matchedClient?.id ?? null,
        clientName: matchedClient?.name ?? null,
      },
    };
  }

  if (
    /\bappointment\b/.test(normalized) &&
    /\b(create|add|schedule)\b/.test(normalized)
  ) {
    const temporal = extractTemporalExpression(transcript, now, {
      defaultHour: 15,
      defaultMinute: 0,
    });
    const cleaned = stripTemporalText(
      transcript
        .replace(/\b(create|add|schedule)\b/i, '')
        .replace(/\b(a|an)\b/i, ''),
      temporal
    );
    const title = buildAppointmentTitle(cleaned);
    const startsAt = temporal.isoString;
    const endsAt = temporal.dateTime ? addHours(temporal.dateTime, 1).toISOString() : null;

    return {
      intent: 'create_appointment',
      entities: {
        title,
        startsAt,
        endsAt,
        allDay: temporal.allDay,
        clientId: matchedClient?.id ?? null,
        clientName: matchedClient?.name ?? null,
        matchedDateText: temporal.matchedDateText,
        matchedTimeText: temporal.matchedTimeText,
      },
    };
  }

  if (
    /\bfollow[ -]?up\b/.test(normalized) &&
    /\b(create|add|schedule)\b/.test(normalized)
  ) {
    const temporal = extractTemporalExpression(transcript, now, {
      defaultHour: 9,
      defaultMinute: 0,
    });
    const title = matchedClient
      ? `Follow up with client ${matchedClient.name}`
      : 'Follow up';

    return {
      intent: 'create_follow_up',
      entities: {
        title,
        dueAt: temporal.isoString,
        allDay: temporal.allDay,
        clientId: matchedClient?.id ?? null,
        clientName: matchedClient?.name ?? null,
        matchedDateText: temporal.matchedDateText,
        matchedTimeText: temporal.matchedTimeText,
      },
    };
  }

  if (/\bremind me\b/.test(normalized)) {
    const temporal = extractTemporalExpression(transcript, now, {
      defaultHour: 9,
      defaultMinute: 0,
    });

    const title = buildReminderTitle(
      stripTemporalText(transcript.replace(/\bremind me\b/i, ''), temporal)
    );

    return {
      intent: 'create_reminder',
      entities: {
        title,
        details: title,
        remindAt: temporal.isoString,
        allDay: temporal.allDay,
        clientId: matchedClient?.id ?? null,
        clientName: matchedClient?.name ?? null,
        matchedDateText: temporal.matchedDateText,
        matchedTimeText: temporal.matchedTimeText,
      },
    };
  }

  return {
    intent: 'unknown',
    entities: {},
  };
}

function findMentionedClient(normalizedTranscript: string, clients: Client[]): Client | null {
  const ordered = [...clients].sort((left, right) => right.name.length - left.name.length);

  for (const client of ordered) {
    const fullName = normalizeCommandText(client.name);
    const firstName = fullName.split(' ')[0];

    if (normalizedTranscript.includes(fullName)) {
      return client;
    }

    if (firstName && normalizedTranscript.includes(firstName)) {
      return client;
    }
  }

  return null;
}

function buildReminderTitle(source: string): string {
  const cleaned = source
    .replace(/\bto\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'New reminder';
  }

  return capitalizeFirstLetter(cleaned);
}

function buildAppointmentTitle(source: string): string {
  const cleaned = source
    .replace(/\bappointment\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/consultation/i.test(source)) {
    return 'Consultation appointment';
  }

  return cleaned ? `${capitalizeFirstLetter(cleaned)} appointment` : 'Consultation appointment';
}

function extractAboutSubject(source: string): string | null {
  const match = source.match(/\babout\s+(.+?)(?:[?.!]?$)/i);
  return match?.[1]?.trim() ?? null;
}

function extractReminderCompletionTarget(source: string): string | null {
  const directMatch = source.match(/\bmark(?: the)?\s+(.+?)\s+reminder\s+as\s+done\b/i);

  if (directMatch?.[1]) {
    return directMatch[1].trim();
  }

  return null;
}

function capitalizeFirstLetter(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
