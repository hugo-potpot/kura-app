/** DDL partagé entre SQLite natif (expo-sqlite) et web (sql.js). */
export const SQLITE_DDL = `
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    structure_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    phone TEXT,
    treating_doctor TEXT,
    assigned_idel_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS vital_signs (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    measured_at INTEGER NOT NULL,
    systolic REAL,
    diastolic REAL,
    glycemia REAL,
    weight REAL,
    temperature REAL,
    spo2 REAL,
    created_at INTEGER NOT NULL,
    synced_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS planning_entries (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    idel_id TEXT NOT NULL,
    date TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    eta_minutes INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_planning_entries_idel_date ON planning_entries(idel_id, date);

  CREATE TABLE IF NOT EXISTS transmissions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content_original TEXT,
    content_validated TEXT NOT NULL DEFAULT '',
    care_type TEXT NOT NULL DEFAULT 'autre',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_transmissions_patient ON transmissions(patient_id);
  CREATE INDEX IF NOT EXISTS idx_transmissions_author ON transmissions(author_id, created_at);
`;
