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
import type { BaseConnector } from './BaseConnector';

function placeholderError(): Error {
  return new Error('Google Calendar connector is a clean placeholder in v1. No external sync is implemented yet.');
}

export class GoogleCalendarConnector implements BaseConnector {
  provider = 'google_calendar';
  label = 'Google Calendar';
  isWritable = false;

  async getTodayAgenda(_referenceDate?: Date): Promise<TodayAgenda> {
    throw placeholderError();
  }

  async createTask(_input: CreateTaskInput): Promise<Task> {
    throw placeholderError();
  }

  async createReminder(_input: CreateReminderInput): Promise<Reminder> {
    throw placeholderError();
  }

  async createAppointment(_input: CreateAppointmentInput): Promise<Appointment> {
    throw placeholderError();
  }

  async getPendingFollowUps(_limit?: number): Promise<Task[]> {
    throw placeholderError();
  }

  async searchReminderHistory(_query?: string): Promise<ReminderHistoryResult> {
    throw placeholderError();
  }

  async markReminderDone(_query: string): Promise<Reminder | null> {
    throw placeholderError();
  }

  async logMemoryEvent(_input: LogMemoryEventInput): Promise<void> {
    throw placeholderError();
  }
}
