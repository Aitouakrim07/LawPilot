import { formatCommandDateAnswer, formatTimeLabel } from '../../utils/date';
import type {
  AppSnapshot,
  AssistantExecutionResult,
  ParsedVoiceCommand,
} from '../../types/models';
import { parseVoiceCommand } from './intentParser';
import type { BaseConnector } from '../connectors/BaseConnector';

interface AssistantServiceInput {
  transcript: string;
  snapshot: AppSnapshot;
  connector: BaseConnector;
  now?: Date;
}

export async function executeAssistantCommand(
  input: AssistantServiceInput
): Promise<AssistantExecutionResult> {
  const now = input.now ?? new Date();
  const user = input.snapshot.user;

  if (!user) {
    throw new Error('No active user was found in the local database.');
  }

  const parsed = parseVoiceCommand(input.transcript, input.snapshot.clients, now);

  switch (parsed.intent) {
    case 'create_reminder':
      return handleCreateReminder(input, parsed, now);
    case 'query_reminder_history':
      return handleQueryReminderHistory(input, parsed);
    case 'query_today':
      return handleQueryToday(input, parsed, now);
    case 'create_follow_up':
      return handleCreateFollowUp(input, parsed, now);
    case 'create_appointment':
      return handleCreateAppointment(input, parsed, now);
    case 'query_pending_followups':
      return handlePendingFollowUps(input, parsed);
    case 'mark_reminder_done':
      return handleMarkReminderDone(input, parsed);
    case 'unknown':
    default:
      await input.connector.logMemoryEvent({
        userId: user.id,
        originalTranscript: input.transcript,
        detectedIntent: parsed.intent,
        extractedEntities: parsed.entities,
        createdObjectType: null,
        createdObjectId: null,
      });

      return {
        responseText:
          'I did not recognize that command yet. Try a reminder, a follow-up, an appointment, or ask what you have today.',
        intent: parsed.intent,
        entities: parsed.entities,
        createdObjectType: null,
        createdObjectId: null,
      };
  }
}

async function handleCreateReminder(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand,
  now: Date
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const title = toStringValue(parsed.entities.title);
  const remindAt = toStringValue(parsed.entities.remindAt);
  const allDay = Boolean(parsed.entities.allDay);

  if (!title || !remindAt) {
    await input.connector.logMemoryEvent({
      userId,
      originalTranscript: input.transcript,
      detectedIntent: parsed.intent,
      extractedEntities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    });

    return {
      responseText:
        'I understood that as a reminder, but I could not determine when it should happen. Try including a date such as tomorrow or next Friday.',
      intent: parsed.intent,
      entities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    };
  }

  const reminder = await input.connector.createReminder({
    userId,
    clientId: nullableString(parsed.entities.clientId),
    title,
    details: nullableString(parsed.entities.details),
    remindAt,
    allDay,
  });

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: 'reminder',
    createdObjectId: reminder.id,
  });

  return {
    responseText: `I created a reminder for ${formatCommandDateAnswer(
      reminder.remindAt,
      reminder.allDay,
      now
    )}: ${reminder.title}.`,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: 'reminder',
    createdObjectId: reminder.id,
  };
}

async function handleQueryReminderHistory(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const queryText =
    nullableString(parsed.entities.queryText) ??
    nullableString(parsed.entities.clientName) ??
    undefined;
  const history = await input.connector.searchReminderHistory(queryText);
  let responseText =
    'I could not find a reminder in your local history that matches that request.';

  if (history.reminder) {
    const status = history.reminder.status === 'done' ? 'completed' : 'still pending';
    responseText = `You asked me to remind you about "${history.reminder.title}" ${formatCommandDateAnswer(
      history.reminder.remindAt,
      history.reminder.allDay
    )}. It is ${status}.`;
  } else if (history.memoryEvent) {
    responseText = `The latest reminder request I found was: "${history.memoryEvent.originalTranscript}".`;
  }

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: null,
    createdObjectId: null,
  });

  return {
    responseText,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: null,
    createdObjectId: null,
  };
}

async function handleQueryToday(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand,
  now: Date
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const agenda = await input.connector.getTodayAgenda(now);
  const appointmentText =
    agenda.appointments.length > 0
      ? `${agenda.appointments.length} appointment${agenda.appointments.length === 1 ? '' : 's'}`
      : 'no appointments';
  const reminderText =
    agenda.reminders.length > 0
      ? `${agenda.reminders.length} reminder${agenda.reminders.length === 1 ? '' : 's'}`
      : 'no reminders';
  const taskText =
    agenda.tasks.length > 0
      ? `${agenda.tasks.length} task${agenda.tasks.length === 1 ? '' : 's'}`
      : 'no tasks';

  const highlights = [
    agenda.appointments[0]
      ? `First appointment: ${agenda.appointments[0].title} at ${formatTimeLabel(
          agenda.appointments[0].startsAt
        )}`
      : null,
    agenda.reminders[0]
      ? `Next reminder: ${agenda.reminders[0].title}`
      : null,
    agenda.tasks[0] ? `Top task: ${agenda.tasks[0].title}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: null,
    createdObjectId: null,
  });

  return {
    responseText: `Today you have ${appointmentText}, ${reminderText}, and ${taskText}.${highlights ? ` ${highlights}.` : ''}`,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: null,
    createdObjectId: null,
  };
}

async function handleCreateFollowUp(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand,
  now: Date
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const title = toStringValue(parsed.entities.title) ?? 'Follow up';
  const task = await input.connector.createTask({
    userId,
    clientId: nullableString(parsed.entities.clientId),
    title,
    category: 'follow_up',
    dueAt: nullableString(parsed.entities.dueAt),
    allDay: Boolean(parsed.entities.allDay),
    priority: 'high',
  });

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: 'task',
    createdObjectId: task.id,
  });

  return {
    responseText: task.dueAt
      ? `I added the follow-up for ${formatCommandDateAnswer(task.dueAt, task.allDay, now)}: ${task.title}.`
      : `I added the follow-up: ${task.title}.`,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: 'task',
    createdObjectId: task.id,
  };
}

async function handleCreateAppointment(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand,
  now: Date
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const title = toStringValue(parsed.entities.title) ?? 'Consultation appointment';
  const startsAt = toStringValue(parsed.entities.startsAt);
  const endsAt = toStringValue(parsed.entities.endsAt);

  if (!startsAt || !endsAt) {
    await input.connector.logMemoryEvent({
      userId,
      originalTranscript: input.transcript,
      detectedIntent: parsed.intent,
      extractedEntities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    });

    return {
      responseText:
        'I understood that as an appointment request, but I could not determine the date and time.',
      intent: parsed.intent,
      entities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    };
  }

  const appointment = await input.connector.createAppointment({
    userId,
    clientId: nullableString(parsed.entities.clientId),
    title,
    startsAt,
    endsAt,
    notes: 'Created from a voice command.',
  });

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: 'appointment',
    createdObjectId: appointment.id,
  });

  return {
    responseText: `I created the appointment for ${formatCommandDateAnswer(
      appointment.startsAt,
      false,
      now
    )}: ${appointment.title}.`,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: 'appointment',
    createdObjectId: appointment.id,
  };
}

async function handlePendingFollowUps(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const followUps = await input.connector.getPendingFollowUps();

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: null,
    createdObjectId: null,
  });

  if (followUps.length === 0) {
    return {
      responseText: 'You do not have any pending follow-ups.',
      intent: parsed.intent,
      entities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    };
  }

  const summary = followUps
    .slice(0, 3)
    .map((task) =>
      task.dueAt
        ? `${task.title} due ${formatCommandDateAnswer(task.dueAt, task.allDay)}`
        : task.title
    )
    .join('; ');

  return {
    responseText: `You have ${followUps.length} pending follow-up${
      followUps.length === 1 ? '' : 's'
    }. ${summary}.`,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: null,
    createdObjectId: null,
  };
}

async function handleMarkReminderDone(
  input: AssistantServiceInput,
  parsed: ParsedVoiceCommand
): Promise<AssistantExecutionResult> {
  const userId = input.snapshot.user!.id;
  const queryText =
    nullableString(parsed.entities.queryText) ??
    nullableString(parsed.entities.clientName);

  if (!queryText) {
    await input.connector.logMemoryEvent({
      userId,
      originalTranscript: input.transcript,
      detectedIntent: parsed.intent,
      extractedEntities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    });

    return {
      responseText:
        'I understood the completion request, but I could not determine which reminder to mark as done.',
      intent: parsed.intent,
      entities: parsed.entities,
      createdObjectType: null,
      createdObjectId: null,
    };
  }

  const reminder = await input.connector.markReminderDone(queryText);

  await input.connector.logMemoryEvent({
    userId,
    originalTranscript: input.transcript,
    detectedIntent: parsed.intent,
    extractedEntities: parsed.entities,
    createdObjectType: reminder ? 'reminder' : null,
    createdObjectId: reminder?.id ?? null,
  });

  return {
    responseText: reminder
      ? `I marked the reminder "${reminder.title}" as done.`
      : `I could not find a pending reminder that matches "${queryText}".`,
    intent: parsed.intent,
    entities: parsed.entities,
    createdObjectType: reminder ? 'reminder' : null,
    createdObjectId: reminder?.id ?? null,
  };
}

function toStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
