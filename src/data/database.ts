import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'lawpilot.db';
const DEFAULT_USER_ID = 'user_default';
const DEFAULT_CLIENT_AHMED_ID = 'client_ahmed';
const DEFAULT_CLIENT_SARAH_ID = 'client_sarah';

let databasePromise: Promise<SQLiteDatabase> | null = null;

const schemaSql = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  law_firm_name TEXT NOT NULL,
  locale TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS matters (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  matter_type TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT,
  matter_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  due_at TEXT,
  all_day INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  source TEXT NOT NULL,
  notification_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (matter_id) REFERENCES matters (id)
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT,
  matter_id TEXT,
  title TEXT NOT NULL,
  details TEXT,
  remind_at TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  notification_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (matter_id) REFERENCES matters (id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT,
  matter_id TEXT,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL,
  notification_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (matter_id) REFERENCES matters (id)
);

CREATE TABLE IF NOT EXISTS voice_notes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  transcript TEXT NOT NULL,
  note_text TEXT,
  duration_seconds INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS memory_events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  original_transcript TEXT NOT NULL,
  detected_intent TEXT NOT NULL,
  extracted_entities TEXT NOT NULL,
  created_object_type TEXT,
  created_object_id TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS connected_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  config_json TEXT NOT NULL,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks (due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders (remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders (status);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS idx_memory_events_timestamp ON memory_events (timestamp DESC);
`;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initializeDatabase();
  }

  return databasePromise;
}

async function initializeDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync(schemaSql);
  await seedInitialData(db);
  return db;
}

async function seedInitialData(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );

  if ((existing?.count ?? 0) > 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO users (id, name, law_firm_name, locale, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [DEFAULT_USER_ID, 'Amina Rahman', 'Rahman Legal Studio', 'en-US', now]
    );

    await db.runAsync(
      `INSERT INTO clients (id, user_id, name, phone, email, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_CLIENT_AHMED_ID,
        DEFAULT_USER_ID,
        'Ahmed Hassan',
        '+33 6 12 34 56 78',
        'ahmed@example.com',
        'Immigration client with outstanding document review.',
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO clients (id, user_id, name, phone, email, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_CLIENT_SARAH_ID,
        DEFAULT_USER_ID,
        'Sarah Coleman',
        '+33 6 98 76 54 32',
        'sarah@example.com',
        'Employment consultation intake and follow-up planning.',
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO matters (id, user_id, client_id, title, matter_type, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'matter_immigration_review',
        DEFAULT_USER_ID,
        DEFAULT_CLIENT_AHMED_ID,
        'Immigration Document Review',
        'Immigration',
        'active',
        'Waiting for a complete supporting document package.',
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO matters (id, user_id, client_id, title, matter_type, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'matter_consultation_sarah',
        DEFAULT_USER_ID,
        DEFAULT_CLIENT_SARAH_ID,
        'Employment Consultation',
        'Employment',
        'active',
        'Initial consultation opened and awaiting next action.',
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO connected_accounts
       (id, user_id, provider, display_name, status, config_json, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'account_local',
        DEFAULT_USER_ID,
        'local',
        'Local Workspace',
        'connected',
        JSON.stringify({ mode: 'sqlite-only', writable: true }),
        now,
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO connected_accounts
       (id, user_id, provider, display_name, status, config_json, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'account_google_calendar',
        DEFAULT_USER_ID,
        'google_calendar',
        'Google Calendar',
        'placeholder',
        JSON.stringify({ mode: 'placeholder', writable: false }),
        null,
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO connected_accounts
       (id, user_id, provider, display_name, status, config_json, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'account_notion',
        DEFAULT_USER_ID,
        'notion',
        'Notion',
        'placeholder',
        JSON.stringify({ mode: 'placeholder', writable: false }),
        null,
        now,
        now,
      ]
    );
  });
}

export const seedIds = {
  userId: DEFAULT_USER_ID,
  ahmedClientId: DEFAULT_CLIENT_AHMED_ID,
  sarahClientId: DEFAULT_CLIENT_SARAH_ID,
};
