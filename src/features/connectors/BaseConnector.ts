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

export interface BaseConnector {
  provider: string;
  label: string;
  isWritable: boolean;
  getTodayAgenda(referenceDate?: Date): Promise<TodayAgenda>;
  createTask(input: CreateTaskInput): Promise<Task>;
  createReminder(input: CreateReminderInput): Promise<Reminder>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  getPendingFollowUps(limit?: number): Promise<Task[]>;
  searchReminderHistory(query?: string): Promise<ReminderHistoryResult>;
  markReminderDone(query: string): Promise<Reminder | null>;
  logMemoryEvent(input: LogMemoryEventInput): Promise<void>;
}
