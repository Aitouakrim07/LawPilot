import { getDatabase } from './database';
import { createId } from '../utils/id';
import { getLocalDayRange } from '../utils/date';
import type {
  AppSnapshot,
  Appointment,
  Client,
  ConnectedAccount,
  CreateAppointmentInput,
  CreateReminderInput,
  CreateTaskInput,
  CreateVoiceNoteInput,
  LogMemoryEventInput,
  Matter,
  MemoryEvent,
  Reminder,
  ReminderHistoryResult,
  Task,
  TodayAgenda,
  User,
  VoiceNote,
} from '../types/models';

type SqlBoolean = 0 | 1;

interface UserRow {
  id: string;
  name: string;
  law_firm_name: string;
  locale: string;
  created_at: string;
}

interface ClientRow {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MatterRow {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  matter_type: string;
  status: Matter['status'];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  user_id: string;
  client_id: string | null;
  matter_id: string | null;
  title: string;
  description: string | null;
  category: string;
  due_at: string | null;
  all_day: SqlBoolean;
  status: Task['status'];
  priority: Task['priority'];
  source: string;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface ReminderRow {
  id: string;
  user_id: string;
  client_id: string | null;
  matter_id: string | null;
  title: string;
  details: string | null;
  remind_at: string;
  all_day: SqlBoolean;
  status: Reminder['status'];
  notification_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface AppointmentRow {
  id: string;
  user_id: string;
  client_id: string | null;
  matter_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
  status: Appointment['status'];
  notification_id: string | null;
  created_at: string;
  updated_at: string;
}

interface VoiceNoteRow {
  id: string;
  user_id: string;
  transcript: string;
  note_text: string | null;
  duration_seconds: number | null;
  created_at: string;
}

interface MemoryEventRow {
  id: string;
  user_id: string;
  original_transcript: string;
  detected_intent: MemoryEvent['detectedIntent'];
  extracted_entities: string;
  created_object_type: MemoryEvent['createdObjectType'];
  created_object_id: string | null;
  timestamp: string;
}

interface ConnectedAccountRow {
  id: string;
  user_id: string;
  provider: string;
  display_name: string;
  status: ConnectedAccount['status'];
  config_json: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

function fromSqlBoolean(value: SqlBoolean): boolean {
  return value === 1;
}

function toSqlBoolean(value = false): SqlBoolean {
  return value ? 1 : 0;
}

function parseJsonObject(value: string | null): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    lawFirmName: row.law_firm_name,
    locale: row.locale,
    createdAt: row.created_at,
  };
}

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMatter(row: MatterRow): Matter {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    title: row.title,
    matterType: row.matter_type,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    matterId: row.matter_id,
    title: row.title,
    description: row.description,
    category: row.category,
    dueAt: row.due_at,
    allDay: fromSqlBoolean(row.all_day),
    status: row.status,
    priority: row.priority,
    source: row.source,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    matterId: row.matter_id,
    title: row.title,
    details: row.details,
    remindAt: row.remind_at,
    allDay: fromSqlBoolean(row.all_day),
    status: row.status,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    matterId: row.matter_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    notes: row.notes,
    status: row.status,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVoiceNote(row: VoiceNoteRow): VoiceNote {
  return {
    id: row.id,
    userId: row.user_id,
    transcript: row.transcript,
    noteText: row.note_text,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

function mapMemoryEvent(row: MemoryEventRow): MemoryEvent {
  return {
    id: row.id,
    userId: row.user_id,
    originalTranscript: row.original_transcript,
    detectedIntent: row.detected_intent,
    extractedEntities: parseJsonObject(row.extracted_entities),
    createdObjectType: row.created_object_type,
    createdObjectId: row.created_object_id,
    timestamp: row.timestamp,
  };
}

function mapConnectedAccount(row: ConnectedAccountRow): ConnectedAccount {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    displayName: row.display_name,
    status: row.status,
    config: parseJsonObject(row.config_json),
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function likeValue(query: string): string {
  return `%${query.trim().toLowerCase()}%`;
}

export async function getUser(): Promise<User | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    'SELECT * FROM users ORDER BY created_at ASC LIMIT 1'
  );
  return row ? mapUser(row) : null;
}

export async function getClients(): Promise<Client[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ClientRow>(
    'SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC'
  );
  return rows.map(mapClient);
}

export async function getMatters(): Promise<Matter[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MatterRow>(
    `SELECT * FROM matters
     ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'on_hold' THEN 1 ELSE 2 END, title COLLATE NOCASE ASC`
  );
  return rows.map(mapMatter);
}

export async function getTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     ORDER BY
       CASE status WHEN 'pending' THEN 0 ELSE 1 END,
       CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,
       due_at ASC,
       created_at DESC`
  );
  return rows.map(mapTask);
}

export async function getReminders(): Promise<Reminder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReminderRow>(
    `SELECT * FROM reminders
     ORDER BY
       CASE status WHEN 'pending' THEN 0 ELSE 1 END,
       remind_at ASC,
       created_at DESC`
  );
  return rows.map(mapReminder);
}

export async function getAppointments(): Promise<Appointment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AppointmentRow>(
    `SELECT * FROM appointments
     ORDER BY starts_at ASC, created_at DESC`
  );
  return rows.map(mapAppointment);
}

export async function getVoiceNotes(): Promise<VoiceNote[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<VoiceNoteRow>(
    'SELECT * FROM voice_notes ORDER BY created_at DESC'
  );
  return rows.map(mapVoiceNote);
}

export async function getMemoryEvents(limit = 20): Promise<MemoryEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MemoryEventRow>(
    'SELECT * FROM memory_events ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapMemoryEvent);
}

export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ConnectedAccountRow>(
    `SELECT * FROM connected_accounts
     ORDER BY CASE provider WHEN 'local' THEN 0 WHEN 'google_calendar' THEN 1 ELSE 2 END`
  );
  return rows.map(mapConnectedAccount);
}

export async function getAppSnapshot(): Promise<AppSnapshot> {
  const [
    user,
    clients,
    matters,
    tasks,
    reminders,
    appointments,
    voiceNotes,
    memoryEvents,
    connectedAccounts,
  ] = await Promise.all([
    getUser(),
    getClients(),
    getMatters(),
    getTasks(),
    getReminders(),
    getAppointments(),
    getVoiceNotes(),
    getMemoryEvents(),
    getConnectedAccounts(),
  ]);

  return {
    user,
    clients,
    matters,
    tasks,
    reminders,
    appointments,
    voiceNotes,
    memoryEvents,
    connectedAccounts,
  };
}

export async function findClientByName(name: string): Promise<Client | null> {
  const db = await getDatabase();
  const exact = name.trim().toLowerCase();
  const row = await db.getFirstAsync<ClientRow>(
    `SELECT * FROM clients
     WHERE LOWER(name) = ? OR LOWER(name) LIKE ?
     ORDER BY CASE WHEN LOWER(name) = ? THEN 0 ELSE 1 END
     LIMIT 1`,
    [exact, likeValue(exact), exact]
  );
  return row ? mapClient(row) : null;
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReminderRow>(
    'SELECT * FROM reminders WHERE id = ? LIMIT 1',
    [id]
  );
  return row ? mapReminder(row) : null;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TaskRow>(
    'SELECT * FROM tasks WHERE id = ? LIMIT 1',
    [id]
  );
  return row ? mapTask(row) : null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = createId('task');

  await db.runAsync(
    `INSERT INTO tasks
     (id, user_id, client_id, matter_id, title, description, category, due_at, all_day, status, priority, source, notification_id, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.clientId ?? null,
      input.matterId ?? null,
      input.title,
      input.description ?? null,
      input.category ?? 'general',
      input.dueAt ?? null,
      toSqlBoolean(input.allDay),
      input.status ?? 'pending',
      input.priority ?? 'normal',
      input.source ?? 'voice_assistant',
      input.notificationId ?? null,
      now,
      now,
      null,
    ]
  );

  const task = await getTaskById(id);

  if (!task) {
    throw new Error('Failed to create task.');
  }

  return task;
}

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = createId('reminder');

  await db.runAsync(
    `INSERT INTO reminders
     (id, user_id, client_id, matter_id, title, details, remind_at, all_day, status, notification_id, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.clientId ?? null,
      input.matterId ?? null,
      input.title,
      input.details ?? null,
      input.remindAt,
      toSqlBoolean(input.allDay),
      input.status ?? 'pending',
      input.notificationId ?? null,
      now,
      now,
      null,
    ]
  );

  const reminder = await getReminderById(id);

  if (!reminder) {
    throw new Error('Failed to create reminder.');
  }

  return reminder;
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<Appointment> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = createId('appointment');

  await db.runAsync(
    `INSERT INTO appointments
     (id, user_id, client_id, matter_id, title, starts_at, ends_at, location, notes, status, notification_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.clientId ?? null,
      input.matterId ?? null,
      input.title,
      input.startsAt,
      input.endsAt,
      input.location ?? null,
      input.notes ?? null,
      input.status ?? 'scheduled',
      input.notificationId ?? null,
      now,
      now,
    ]
  );

  const dbRow = await db.getFirstAsync<AppointmentRow>(
    'SELECT * FROM appointments WHERE id = ? LIMIT 1',
    [id]
  );

  if (!dbRow) {
    throw new Error('Failed to create appointment.');
  }

  return mapAppointment(dbRow);
}

export async function createVoiceNote(input: CreateVoiceNoteInput): Promise<VoiceNote> {
  const db = await getDatabase();
  const id = createId('voice_note');
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO voice_notes
     (id, user_id, transcript, note_text, duration_seconds, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.transcript,
      input.noteText ?? null,
      input.durationSeconds ?? null,
      now,
    ]
  );

  const row = await db.getFirstAsync<VoiceNoteRow>(
    'SELECT * FROM voice_notes WHERE id = ? LIMIT 1',
    [id]
  );

  if (!row) {
    throw new Error('Failed to create voice note.');
  }

  return mapVoiceNote(row);
}

export async function logMemoryEvent(
  input: LogMemoryEventInput
): Promise<MemoryEvent> {
  const db = await getDatabase();
  const id = createId('memory');
  const timestamp = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO memory_events
     (id, user_id, original_transcript, detected_intent, extracted_entities, created_object_type, created_object_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.originalTranscript,
      input.detectedIntent,
      JSON.stringify(input.extractedEntities ?? {}),
      input.createdObjectType ?? null,
      input.createdObjectId ?? null,
      timestamp,
    ]
  );

  return {
    id,
    userId: input.userId,
    originalTranscript: input.originalTranscript,
    detectedIntent: input.detectedIntent,
    extractedEntities: input.extractedEntities ?? {},
    createdObjectType: input.createdObjectType ?? null,
    createdObjectId: input.createdObjectId ?? null,
    timestamp,
  };
}

export async function markTaskDone(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE tasks
     SET status = 'done', completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [now, now, id]
  );

  return getTaskById(id);
}

export async function markReminderDone(id: string): Promise<Reminder | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE reminders
     SET status = 'done', completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [now, now, id]
  );

  return getReminderById(id);
}

export async function searchReminders(
  query: string,
  options?: { pendingOnly?: boolean; limit?: number }
): Promise<Reminder[]> {
  const db = await getDatabase();
  const whereClauses = [
    '(LOWER(title) LIKE ? OR LOWER(COALESCE(details, \'\')) LIKE ?)',
  ];
  const params: Array<string | number> = [likeValue(query), likeValue(query)];

  if (options?.pendingOnly) {
    whereClauses.push("status = 'pending'");
  }

  const limit = options?.limit ?? 10;

  const rows = await db.getAllAsync<ReminderRow>(
    `SELECT * FROM reminders
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY remind_at DESC
     LIMIT ?`,
    [...params, limit]
  );

  return rows.map(mapReminder);
}

export async function searchReminderHistory(
  query?: string
): Promise<ReminderHistoryResult> {
  const db = await getDatabase();
  let reminderRow: ReminderRow | null = null;
  let eventRow: MemoryEventRow | null = null;

  if (query && query.trim()) {
    const search = likeValue(query);

    reminderRow = await db.getFirstAsync<ReminderRow>(
      `SELECT * FROM reminders
       WHERE LOWER(title) LIKE ? OR LOWER(COALESCE(details, '')) LIKE ?
       ORDER BY remind_at DESC
       LIMIT 1`,
      [search, search]
    );

    eventRow = await db.getFirstAsync<MemoryEventRow>(
      `SELECT * FROM memory_events
       WHERE detected_intent = 'create_reminder'
         AND (LOWER(original_transcript) LIKE ? OR LOWER(extracted_entities) LIKE ?)
       ORDER BY timestamp DESC
       LIMIT 1`,
      [search, search]
    );
  } else {
    reminderRow = await db.getFirstAsync<ReminderRow>(
      'SELECT * FROM reminders ORDER BY remind_at DESC LIMIT 1'
    );

    eventRow = await db.getFirstAsync<MemoryEventRow>(
      `SELECT * FROM memory_events
       WHERE detected_intent = 'create_reminder'
       ORDER BY timestamp DESC
       LIMIT 1`
    );
  }

  if (!reminderRow && eventRow?.created_object_id) {
    reminderRow = await db.getFirstAsync<ReminderRow>(
      'SELECT * FROM reminders WHERE id = ? LIMIT 1',
      [eventRow.created_object_id]
    );
  }

  return {
    reminder: reminderRow ? mapReminder(reminderRow) : null,
    memoryEvent: eventRow ? mapMemoryEvent(eventRow) : null,
  };
}

export async function getPendingFollowUps(limit = 20): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE status = 'pending' AND category = 'follow_up'
     ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END, due_at ASC, created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(mapTask);
}

export async function getTodayAgenda(referenceDate = new Date()): Promise<TodayAgenda> {
  const db = await getDatabase();
  const { start, end } = getLocalDayRange(referenceDate);

  const [appointments, reminders, tasks] = await Promise.all([
    db.getAllAsync<AppointmentRow>(
      `SELECT * FROM appointments
       WHERE status = 'scheduled' AND starts_at BETWEEN ? AND ?
       ORDER BY starts_at ASC`,
      [start, end]
    ),
    db.getAllAsync<ReminderRow>(
      `SELECT * FROM reminders
       WHERE status = 'pending' AND remind_at BETWEEN ? AND ?
       ORDER BY remind_at ASC`,
      [start, end]
    ),
    db.getAllAsync<TaskRow>(
      `SELECT * FROM tasks
       WHERE status = 'pending'
         AND due_at IS NOT NULL
         AND due_at BETWEEN ? AND ?
       ORDER BY due_at ASC`,
      [start, end]
    ),
  ]);

  return {
    appointments: appointments.map(mapAppointment),
    reminders: reminders.map(mapReminder),
    tasks: tasks.map(mapTask),
  };
}

export async function markLatestReminderMatchingDone(
  query: string
): Promise<Reminder | null> {
  const candidates = await searchReminders(query, {
    pendingOnly: true,
    limit: 1,
  });

  if (!candidates[0]) {
    return null;
  }

  return markReminderDone(candidates[0].id);
}
