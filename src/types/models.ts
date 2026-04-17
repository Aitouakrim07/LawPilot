export type EntityKind = 'task' | 'reminder' | 'appointment';

export type TaskStatus = 'pending' | 'done';
export type ReminderStatus = 'pending' | 'done';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type MatterStatus = 'active' | 'on_hold' | 'closed';
export type TaskPriority = 'low' | 'normal' | 'high';
export type ConnectedAccountStatus = 'connected' | 'placeholder' | 'disconnected';

export type AssistantIntent =
  | 'create_reminder'
  | 'query_reminder_history'
  | 'query_today'
  | 'create_follow_up'
  | 'create_appointment'
  | 'query_pending_followups'
  | 'mark_reminder_done'
  | 'unknown';

export interface User {
  id: string;
  name: string;
  lawFirmName: string;
  locale: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Matter {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  matterType: string;
  status: MatterStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  clientId: string | null;
  matterId: string | null;
  title: string;
  description: string | null;
  category: string;
  dueAt: string | null;
  allDay: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  source: string;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Reminder {
  id: string;
  userId: string;
  clientId: string | null;
  matterId: string | null;
  title: string;
  details: string | null;
  remindAt: string;
  allDay: boolean;
  status: ReminderStatus;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Appointment {
  id: string;
  userId: string;
  clientId: string | null;
  matterId: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: AppointmentStatus;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceNote {
  id: string;
  userId: string;
  transcript: string;
  noteText: string | null;
  durationSeconds: number | null;
  createdAt: string;
}

export interface MemoryEvent {
  id: string;
  userId: string;
  originalTranscript: string;
  detectedIntent: AssistantIntent;
  extractedEntities: Record<string, unknown>;
  createdObjectType: EntityKind | null;
  createdObjectId: string | null;
  timestamp: string;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: string;
  displayName: string;
  status: ConnectedAccountStatus;
  config: Record<string, unknown>;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppSnapshot {
  user: User | null;
  clients: Client[];
  matters: Matter[];
  tasks: Task[];
  reminders: Reminder[];
  appointments: Appointment[];
  voiceNotes: VoiceNote[];
  memoryEvents: MemoryEvent[];
  connectedAccounts: ConnectedAccount[];
}

export interface CreateTaskInput {
  userId: string;
  clientId?: string | null;
  matterId?: string | null;
  title: string;
  description?: string | null;
  category?: string;
  dueAt?: string | null;
  allDay?: boolean;
  status?: TaskStatus;
  priority?: TaskPriority;
  source?: string;
  notificationId?: string | null;
}

export interface CreateReminderInput {
  userId: string;
  clientId?: string | null;
  matterId?: string | null;
  title: string;
  details?: string | null;
  remindAt: string;
  allDay?: boolean;
  status?: ReminderStatus;
  notificationId?: string | null;
}

export interface CreateAppointmentInput {
  userId: string;
  clientId?: string | null;
  matterId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  notes?: string | null;
  status?: AppointmentStatus;
  notificationId?: string | null;
}

export interface CreateVoiceNoteInput {
  userId: string;
  transcript: string;
  noteText?: string | null;
  durationSeconds?: number | null;
}

export interface LogMemoryEventInput {
  userId: string;
  originalTranscript: string;
  detectedIntent: AssistantIntent;
  extractedEntities: Record<string, unknown>;
  createdObjectType?: EntityKind | null;
  createdObjectId?: string | null;
}

export interface ReminderHistoryResult {
  reminder: Reminder | null;
  memoryEvent: MemoryEvent | null;
}

export interface TodayAgenda {
  appointments: Appointment[];
  reminders: Reminder[];
  tasks: Task[];
}

export interface ParsedVoiceCommand {
  intent: AssistantIntent;
  entities: Record<string, unknown>;
}

export interface AssistantExecutionResult {
  responseText: string;
  intent: AssistantIntent;
  entities: Record<string, unknown>;
  createdObjectType: EntityKind | null;
  createdObjectId: string | null;
}
