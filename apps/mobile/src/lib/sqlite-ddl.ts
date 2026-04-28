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
`;
