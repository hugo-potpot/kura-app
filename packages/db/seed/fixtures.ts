import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateId } from '@kura/shared';
import {
  structuresPg,
  authUser,
  patientsPg,
} from '../schema';

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for seeding');
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

const now = new Date();

const STRUCTURE_ID = generateId();

const IDELS_FIXTURES = [
  {
    id: generateId(),
    name: 'Marie Infirmière',
    email: 'marie.infirmiere@kura-test.fr',
    emailVerified: true,
    structureId: STRUCTURE_ID,
    role: 'idel' as const,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: 'Jean Infirmier',
    email: 'jean.infirmier@kura-test.fr',
    emailVerified: true,
    structureId: STRUCTURE_ID,
    role: 'idel' as const,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: 'Sophie Infirmière',
    email: 'sophie.infirmiere@kura-test.fr',
    emailVerified: true,
    structureId: STRUCTURE_ID,
    role: 'idel' as const,
    createdAt: now,
    updatedAt: now,
  },
];

const PATIENTS_FIXTURES = [
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Marie',
    lastName: 'Dubois',
    address: '5 Rue de la Paix, 59000 Lille',
    latitude: 50.6313,
    longitude: 3.0652,
    phone: '0320111111',
    treatingDoctor: 'Dr. Martin',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Jean',
    lastName: 'Martin',
    address: '12 Rue Nationale, 59000 Lille',
    latitude: 50.6365,
    longitude: 3.0635,
    phone: '0320222222',
    treatingDoctor: 'Dr. Dupont',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Sophie',
    lastName: 'Bernard',
    address: '3 Rue du Molinel, 59000 Lille',
    latitude: 50.6292,
    longitude: 3.0718,
    phone: '0320333333',
    treatingDoctor: 'Dr. Leroy',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Pierre',
    lastName: 'Lecomte',
    address: '7 Rue Esquermoise, 59000 Lille',
    latitude: 50.6371,
    longitude: 3.0628,
    phone: '0320444444',
    treatingDoctor: 'Dr. Martin',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Claire',
    lastName: 'Fontaine',
    address: '18 Boulevard de la Liberté, 59000 Lille',
    latitude: 50.6338,
    longitude: 3.0643,
    phone: '0320555555',
    treatingDoctor: 'Dr. Dupont',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Michel',
    lastName: 'Durand',
    address: '22 Rue Faidherbe, 59000 Lille',
    latitude: 50.6350,
    longitude: 3.0685,
    phone: '0320666666',
    treatingDoctor: 'Dr. Leroy',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Isabelle',
    lastName: 'Moreau',
    address: '4 Rue de Béthune, 59000 Lille',
    latitude: 50.6325,
    longitude: 3.0665,
    phone: '0320777777',
    treatingDoctor: 'Dr. Martin',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'François',
    lastName: 'Petit',
    address: '9 Rue des Bouchers, 59000 Lille',
    latitude: 50.6358,
    longitude: 3.0672,
    phone: '0320888888',
    treatingDoctor: 'Dr. Dupont',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Nathalie',
    lastName: 'Simon',
    address: '31 Rue Léon Gambetta, 59000 Lille',
    latitude: 50.6308,
    longitude: 3.0701,
    phone: '0320999999',
    treatingDoctor: 'Dr. Leroy',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
  {
    id: generateId(),
    structureId: STRUCTURE_ID,
    firstName: 'Robert',
    lastName: 'Thomas',
    address: '14 Place du Général de Gaulle, 59000 Lille',
    latitude: 50.6399,
    longitude: 3.0710,
    phone: '0321000000',
    treatingDoctor: 'Dr. Martin',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  },
];

async function seed() {
  console.log('🌱 Démarrage du seed...');

  console.log('📦 Insertion de la structure...');
  await db.insert(structuresPg).values({
    id: STRUCTURE_ID,
    name: 'Cabinet Test Lille',
    address: '1 Place du Général de Gaulle, 59000 Lille',
    siret: '12345678901234',
    createdAt: now,
  }).onConflictDoNothing();

  console.log('👩‍⚕️ Insertion des 3 IDELs...');
  await db.insert(authUser).values(IDELS_FIXTURES).onConflictDoNothing();

  console.log('🏥 Insertion des 10 patients...');
  await db.insert(patientsPg).values(PATIENTS_FIXTURES).onConflictDoNothing();

  console.log('✅ Seed terminé avec succès !');
  console.log(`   ✓ 1 structure : "Cabinet Test Lille"`);
  console.log(`   ✓ ${IDELS_FIXTURES.length} IDELs fictifs`);
  console.log(`   ✓ ${PATIENTS_FIXTURES.length} patients avec coordonnées GPS (zone Lille)`);

  await client.end();
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
