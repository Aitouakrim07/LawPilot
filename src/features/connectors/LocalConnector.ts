import type {
  Appointment,
  CreateAppointmentInput,
  CreateReminderInput,
  CreateTaskInput,
  LogMemoryEventInput,
  Reminder,
  ReminderHistoryResult,
  Task,
  TodayAgenda,
} from '../../types/models';
import { cancelLocalNotification, scheduleLocalNotification } from '../notifications/notificationService';
import type { BaseConnector } from './BaseConnector';
import {
  createAppointment,
  createReminder,
  createTask,
  getPendingFollowUps,
  getTodayAgenda,
  logMemoryEvent,
  markLatestReminderMatchingDone,
  searchReminderHistory,
} from '../../data/repositories';

export class LocalConnector implements BaseConnector {
  provider = 'local';
  label = 'Local Workspace';
  isWritable = true;

  async getTodayAgenda(referenceDate = new Date()): Promise<TodayAgenda> {
    return getTodayAgenda(referenceDate);
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const notificationId = await scheduleLocalNotification({
      title: 'LawPilot follow-up',
      body: input.title,
      triggerAt: input.dueAt ?? null,
    });

    return createTask({
      ...input,
      notificationId,
    });
  }

  async createReminder(input: CreateReminderInput): Promise<Reminder> {
    const notificationId = await scheduleLocalNotification({
      title: 'LawPilot reminder',
      body: input.title,
      triggerAt: input.remindAt,
    });

    return createReminder({
      ...input,
      notificationId,
    });
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const notificationId = await scheduleLocalNotification({
      title: 'LawPilot appointment',
      body: input.title,
      triggerAt: input.startsAt,
    });

    return createAppointment({
      ...input,
      notificationId,
    });
  }

  async getPendingFollowUps(limit = 20): Promise<Task[]> {
    return getPendingFollowUps(limit);
  }

  async searchReminderHistory(query?: string): Promise<ReminderHistoryResult> {
    return searchReminderHistory(query);
  }

  async markReminderDone(query: string): Promise<Reminder | null> {
    const reminder = await markLatestReminderMatchingDone(query);

    if (reminder?.notificationId) {
      await cancelLocalNotification(reminder.notificationId);
    }

    return reminder;
  }

  async logMemoryEvent(input: LogMemoryEventInput): Promise<void> {
    await logMemoryEvent(input);
  }
}
