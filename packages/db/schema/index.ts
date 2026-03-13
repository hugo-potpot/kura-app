// ── SQLite schemas (mobile / expo-sqlite) ──────────────────────────────────
export { users } from './user-schema';
export { structures } from './structure-schema';
export { patients } from './patient-schema';
export { transmissions } from './transmission-schema';
export { planningEntries } from './planning-schema';
export { syncQueue } from './sync-schema';
export { auditLogs } from './audit-schema';

// ── PostgreSQL schemas (serveur / Next.js) ──────────────────────────────────
export { usersPg } from './user-schema';
export { structuresPg } from './structure-schema';
export { patientsPg } from './patient-schema';
export { transmissionsPg } from './transmission-schema';
export { planningEntriesPg } from './planning-schema';
export { syncQueuePg } from './sync-schema';
export { auditLogsPg } from './audit-schema';
