import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'lawpilot.db';
const DB_SCHEMA_VERSION = 1;

let databasePromise: Promise<SQLiteDatabase> | null = null;

const schemaSql = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  law_firm_name TEXT NOT NULL,
  locale TEXT NOT NULL,
  is_seed_profile INTEGER NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  practice_areas TEXT NOT NULL DEFAULT '',
  work_start_time TEXT NOT NULL DEFAULT '09:00',
  work_end_time TEXT NOT NULL DEFAULT '18:00',
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
  await runMigrations(db);
  return db;
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await ensureUsersColumns(db);
  await db.execAsync(`PRAGMA user_version = ${DB_SCHEMA_VERSION};`);
}

interface TableInfoRow {
  name: string;
}

async function ensureUsersColumns(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>('PRAGMA table_info(users)');
  const existing = new Set(rows.map((row) => row.name));

  if (!existing.has('is_seed_profile')) {
    await db.execAsync(
      "ALTER TABLE users ADD COLUMN is_seed_profile INTEGER NOT NULL DEFAULT 0"
    );
  }

  if (!existing.has('timezone')) {
    await db.execAsync(
      "ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'"
    );
  }

  if (!existing.has('practice_areas')) {
    await db.execAsync(
      "ALTER TABLE users ADD COLUMN practice_areas TEXT NOT NULL DEFAULT ''"
    );
  }

  if (!existing.has('work_start_time')) {
    await db.execAsync(
      "ALTER TABLE users ADD COLUMN work_start_time TEXT NOT NULL DEFAULT '09:00'"
    );
  }

  if (!existing.has('work_end_time')) {
    await db.execAsync(
      "ALTER TABLE users ADD COLUMN work_end_time TEXT NOT NULL DEFAULT '18:00'"
    );
  }

  await db.runAsync(
    `UPDATE users
     SET is_seed_profile = COALESCE(is_seed_profile, 0),
         timezone = COALESCE(NULLIF(timezone, ''), 'UTC'),
         practice_areas = COALESCE(practice_areas, ''),
         work_start_time = COALESCE(NULLIF(work_start_time, ''), '09:00'),
         work_end_time = COALESCE(NULLIF(work_end_time, ''), '18:00')`
  );

  await db.runAsync(
    `UPDATE users
     SET is_seed_profile = 1
     WHERE id = 'user_default'
       AND name = 'Amina Rahman'
       AND law_firm_name = 'Rahman Legal Studio'`
  );
}
