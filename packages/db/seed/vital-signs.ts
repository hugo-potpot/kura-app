import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateId } from '@kura/shared';
import { patientsPg, authUser, vitalSignsPg } from '../schema';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const client = postgres(DATABASE_URL);
const db = drizzle(client);

// Génère un nombre dans [base ± spread], arrondi à 1 décimale
function rand(base: number, spread: number): number {
  return Math.round((base + (Math.random() - 0.5) * 2 * spread) * 10) / 10;
}

// Génère une date aléatoire dans les N derniers jours
function daysAgo(maxDays: number, minDays = 0): Date {
  const ms = (minDays + Math.random() * (maxDays - minDays)) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

// Profils de patients (certains ont des valeurs hors norme)
type Profile = 'healthy' | 'hypertensive' | 'diabetic' | 'fragile';

function generateMeasurements(patientId: string, authorId: string, profile: Profile, count: number) {
  return Array.from({ length: count }, () => {
    const now = new Date();
    const measuredAt = daysAgo(180);
    const createdAt = new Date(measuredAt.getTime() + 60_000);

    let systolic: number;
    let diastolic: number;
    let glycemia: number;
    let weight: number;
    let temperature: number;
    let spo2: number;

    switch (profile) {
      case 'hypertensive':
        systolic    = rand(155, 20);   // souvent trop élevé
        diastolic   = rand(95, 12);
        glycemia    = rand(5.5, 1.0);
        weight      = rand(88, 5);
        temperature = rand(36.8, 0.5);
        spo2        = rand(97, 2);
        break;
      case 'diabetic':
        systolic    = rand(130, 15);
        diastolic   = rand(82, 10);
        glycemia    = rand(9.5, 2.5);  // souvent trop élevé
        weight      = rand(92, 8);
        temperature = rand(36.9, 0.5);
        spo2        = rand(96, 2);
        break;
      case 'fragile':
        systolic    = rand(105, 25);   // instable, peut chuter
        diastolic   = rand(65, 15);
        glycemia    = rand(5.0, 1.5);
        weight      = rand(58, 4);
        temperature = rand(37.2, 0.8); // quelques épisodes fébriles
        spo2        = rand(93, 5);     // parfois en alerte
        break;
      default: // healthy
        systolic    = rand(118, 12);
        diastolic   = rand(76, 8);
        glycemia    = rand(5.2, 0.8);
        weight      = rand(72, 3);
        temperature = rand(36.7, 0.3);
        spo2        = rand(98, 1);
    }

    // Clamp physiologiquement cohérent
    systolic    = Math.max(60,  Math.min(220, systolic));
    diastolic   = Math.max(40,  Math.min(130, diastolic));
    glycemia    = Math.max(1.5, Math.min(20,  glycemia));
    weight      = Math.max(30,  Math.min(200, weight));
    temperature = Math.max(34,  Math.min(42,  temperature));
    spo2        = Math.max(70,  Math.min(100, spo2));

    return {
      id: generateId(),
      patientId,
      authorId,
      measuredAt,
      systolic,
      diastolic,
      glycemia,
      weight,
      temperature,
      spo2,
      createdAt,
      syncedAt: now,
    };
  }).sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
}

async function seed() {
  console.log('💉 Seeder — Constantes vitales\n');

  // Récupère les patients existants
  const patients = await db.select({ id: patientsPg.id }).from(patientsPg);
  if (patients.length === 0) {
    console.error('❌ Aucun patient trouvé. Lance d\'abord le seed principal (pnpm db:seed).');
    await client.end();
    process.exit(1);
  }
  console.log(`👥 ${patients.length} patient(s) trouvé(s)`);

  // Récupère un auteur (IDEL) pour les mesures
  const idels = await db.select({ id: authUser.id }).from(authUser);
  const authorId = idels[0]?.id ?? 'system';
  console.log(`🩺 Auteur des mesures : ${authorId}\n`);

  // Distribue les profils aléatoirement
  const profiles: Profile[] = ['healthy', 'hypertensive', 'diabetic', 'fragile'];
  let totalInserted = 0;

  for (const [i, patient] of patients.entries()) {
    const profile = profiles[i % profiles.length]!;
    const count = 20 + Math.floor(Math.random() * 11); // 20-30 mesures
    const measurements = generateMeasurements(patient.id, authorId, profile, count);

    await db.insert(vitalSignsPg).values(measurements).onConflictDoNothing();
    totalInserted += measurements.length;

    const label = profile === 'healthy' ? '✓ Normal' : profile === 'hypertensive' ? '⚠ Hypertendu' : profile === 'diabetic' ? '⚠ Diabétique' : '🚨 Fragile';
    console.log(`  Patient ${patient.id.slice(0, 8)}…  [${label}]  → ${measurements.length} mesures insérées`);
  }

  console.log(`\n✅ ${totalInserted} constantes vitales insérées sur ${patients.length} patient(s).`);
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
