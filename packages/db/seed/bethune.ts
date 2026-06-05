/**
 * Seeder — Patients réels à Béthune (62400) + planning du jour + transmissions + constantes.
 *
 * Insère RÉELLEMENT en base PostgreSQL (Neon). Idempotent : IDs déterministes +
 * onConflictDoNothing, donc relançable sans créer de doublons.
 *
 * Rattachement :
 *   - Structure : env STRUCTURE_ID, sinon la 1re structure trouvée.
 *   - IDEL (porteur du planning / auteur des transmissions) : env IDEL_EMAIL,
 *     sinon le 1er utilisateur de rôle "idel" rattaché à la structure.
 *
 * Lancement :
 *   pnpm --filter @kura/db db:seed:bethune
 *   (ou : npx tsx --env-file=.env.local seed/bethune.ts)
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq, sql } from 'drizzle-orm';
import {
  structuresPg,
  authUser,
  patientsPg,
  planningEntriesPg,
  transmissionsPg,
  vitalSignsPg,
} from '../schema';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL is required for seeding');

const client = postgres(DATABASE_URL);
const db = drizzle(client);

const now = new Date();
const todayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC) — cohérent avec les routes planning

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

const suffix = (street: string) =>
  `${street}, Béthune, Pas-de-Calais, Hauts-de-France, France métropolitaine, 62400, France`;

type CareType = 'toilette' | 'pansement' | 'injection' | 'constantes' | 'autre';

interface PatientSeed {
  idx: number;
  firstName: string;
  lastName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  treatingDoctor: string;
  status: 'done' | 'in_progress' | 'pending';
  /** Durée de CETTE visite (soin + trajet vers la suivante), en minutes.
   *  L'UI calcule l'heure d'arrivée = 08:00 + somme des etaMinutes des visites précédentes. */
  etaMinutes: number;
  profile: 'healthy' | 'hypertensive' | 'diabetic' | 'fragile';
  transmissions: { careType: CareType; original: string | null; validated: string; daysAgo: number }[];
}

// Adresses réelles de Béthune (62400), coordonnées GPS plausibles autour du centre-ville.
const PATIENTS: PatientSeed[] = [
  {
    idx: 1, firstName: 'Bernadette', lastName: 'Carpentier',
    address: suffix('14, Grand’Place'), latitude: 50.5305, longitude: 2.6398,
    phone: '0321561401', treatingDoctor: 'Dr. Lefebvre', status: 'done', etaMinutes: 45, profile: 'hypertensive',
    transmissions: [
      { careType: 'constantes', original: 'tension prise ce matin cent quarante huit sur quatre vingt douze pouls quatre vingt deux', validated: 'Prise des constantes du matin : TA 148/92, pouls 82/min, T° 36,7°C. Tension toujours élevée, traitement antihypertenseur à réévaluer avec le médecin traitant.', daysAgo: 0 },
      { careType: 'injection', original: null, validated: 'Injection sous-cutanée d’anticoagulant (Lovenox 0,4 mL) dans le pli abdominal gauche. Bonne tolérance, pas d’hématome au point de ponction.', daysAgo: 1 },
    ],
  },
  {
    idx: 2, firstName: 'Marcel', lastName: 'Delattre',
    address: suffix('27, Rue Sadi Carnot'), latitude: 50.5296, longitude: 2.6415,
    phone: '0321682233', treatingDoctor: 'Dr. Caron', status: 'in_progress', etaMinutes: 40, profile: 'diabetic',
    transmissions: [
      { careType: 'injection', original: 'insuline du matin faite douze unités glycémie un virgule huit', validated: 'Injection d’insuline rapide (12 UI) avant le petit-déjeuner. Glycémie capillaire pré-prandiale : 1,8 g/L. Patient informé de surveiller son alimentation.', daysAgo: 0 },
      { careType: 'constantes', original: null, validated: 'Glycémie capillaire du soir : 2,1 g/L. Hyperglycémie persistante, transmission au médecin traitant pour adaptation du schéma insulinique.', daysAgo: 2 },
    ],
  },
  {
    idx: 3, firstName: 'Yvette', lastName: 'Dubois',
    address: suffix('8, Rue d’Arras'), latitude: 50.5270, longitude: 2.6440,
    phone: '0321573388', treatingDoctor: 'Dr. Lefebvre', status: 'pending', etaMinutes: 50, profile: 'fragile',
    transmissions: [
      { careType: 'toilette', original: null, validated: 'Toilette complète réalisée au lit. Patiente fatiguée mais coopérante. État cutané à surveiller : début de rougeur au niveau du sacrum, mise en place d’un effleurage et changement de position.', daysAgo: 0 },
      { careType: 'autre', original: 'préparation du pilulier de la semaine vérifié avec la patiente', validated: 'Préparation et vérification du pilulier hebdomadaire. Observance du traitement vérifiée avec la patiente. Bonne compréhension.', daysAgo: 3 },
    ],
  },
  {
    idx: 4, firstName: 'Roland', lastName: 'Lemaire',
    address: suffix('52, Boulevard Victor Hugo'), latitude: 50.5258, longitude: 2.6402,
    phone: '0321641177', treatingDoctor: 'Dr. Caron', status: 'pending', etaMinutes: 45, profile: 'hypertensive',
    transmissions: [
      { careType: 'pansement', original: 'pansement de la jambe gauche refait plaie propre', validated: 'Réfection du pansement de l’ulcère veineux de la jambe gauche. Plaie en voie de cicatrisation, bourgeonnement présent, pas d’écoulement purulent. Prochain renouvellement dans 48h.', daysAgo: 0 },
    ],
  },
  {
    idx: 5, firstName: 'Simone', lastName: 'Fontaine',
    address: suffix('3, Rue du Maréchal Foch'), latitude: 50.5316, longitude: 2.6385,
    phone: '0321552299', treatingDoctor: 'Dr. Moreau', status: 'pending', etaMinutes: 40, profile: 'healthy',
    transmissions: [
      { careType: 'constantes', original: null, validated: 'Prise des constantes : TA 122/78, pouls 70/min, SpO2 98%, T° 36,6°C. Paramètres dans les normes. Patiente en bon état général.', daysAgo: 1 },
    ],
  },
  {
    idx: 6, firstName: 'Henri', lastName: 'Lefebvre',
    address: suffix('19, Rue de Lille'), latitude: 50.5332, longitude: 2.6448,
    phone: '0321667744', treatingDoctor: 'Dr. Moreau', status: 'pending', etaMinutes: 55, profile: 'diabetic',
    transmissions: [
      { careType: 'injection', original: null, validated: 'Injection d’insuline lente (Lantus 24 UI) le soir. Glycémie : 1,45 g/L. Bonne tolérance.', daysAgo: 0 },
      { careType: 'toilette', original: null, validated: 'Aide à la toilette au lavabo. Surveillance des pieds (risque podologique diabétique) : pas de plaie ni de mycose constatée.', daysAgo: 2 },
    ],
  },
  {
    idx: 7, firstName: 'Paulette', lastName: 'Mercier',
    address: suffix('11, Place Clemenceau'), latitude: 50.5310, longitude: 2.6395,
    phone: '0321584466', treatingDoctor: 'Dr. Lefebvre', status: 'pending', etaMinutes: 45, profile: 'fragile',
    transmissions: [
      { careType: 'pansement', original: 'escarre du talon nettoyée pansement hydrocolloide posé', validated: 'Soin d’escarre du talon droit (stade 2). Nettoyage au sérum physiologique, pose d’un pansement hydrocolloïde. Évolution lente mais favorable.', daysAgo: 0 },
    ],
  },
  {
    idx: 8, firstName: 'Georges', lastName: 'Vasseur',
    address: suffix('6, Boulevard Raymond Poincaré'), latitude: 50.5247, longitude: 2.6358,
    phone: '0321609988', treatingDoctor: 'Dr. Caron', status: 'pending', etaMinutes: 40, profile: 'healthy',
    transmissions: [
      { careType: 'autre', original: null, validated: 'Surveillance de l’état général et administration du traitement oral. Patient autonome, moral correct. Pas d’événement particulier.', daysAgo: 1 },
    ],
  },
];

// ── Génération de constantes vitales (profil) ──────────────────────────────
function rand(base: number, spread: number): number {
  return Math.round((base + (Math.random() - 0.5) * 2 * spread) * 10) / 10;
}
function vitalsForProfile(profile: PatientSeed['profile']) {
  switch (profile) {
    case 'hypertensive': return { systolic: rand(155, 18), diastolic: rand(95, 10), glycemia: rand(5.5, 0.8), weight: rand(82, 4), temperature: rand(36.8, 0.4), spo2: rand(97, 1.5) };
    case 'diabetic':     return { systolic: rand(132, 14), diastolic: rand(82, 9),  glycemia: rand(9.2, 2.2), weight: rand(90, 6), temperature: rand(36.9, 0.4), spo2: rand(96, 1.5) };
    case 'fragile':      return { systolic: rand(108, 22), diastolic: rand(66, 13), glycemia: rand(5.0, 1.3), weight: rand(58, 3), temperature: rand(37.1, 0.6), spo2: rand(94, 3) };
    default:             return { systolic: rand(120, 10), diastolic: rand(76, 7),  glycemia: rand(5.2, 0.7), weight: rand(72, 3), temperature: rand(36.7, 0.3), spo2: rand(98, 1) };
  }
}
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

async function seed() {
  console.log('\n🏙️  Seeder — Patients de Béthune (62400)\n');

  // 1. Résolution de la structure cible
  const structureIdEnv = process.env['STRUCTURE_ID'];
  const structures = structureIdEnv
    ? await db.select().from(structuresPg).where(eq(structuresPg.id, structureIdEnv))
    : await db.select().from(structuresPg).orderBy(structuresPg.createdAt);
  const structure = structures[0];
  if (!structure) {
    console.error('❌ Aucune structure trouvée. Crée d’abord une structure (onboarding admin) ou lance `pnpm db:seed`.');
    await client.end();
    process.exit(1);
  }
  const STRUCTURE_ID = structure.id;

  // 2. Résolution de l'IDEL porteur du planning
  const idelEmail = process.env['IDEL_EMAIL'];
  let idel;
  if (idelEmail) {
    idel = (await db.select().from(authUser).where(eq(authUser.email, idelEmail)))[0];
  } else {
    // ORDER BY id pour une sélection déterministe (évite de viser un IDEL différent à chaque run).
    idel = (await db
      .select()
      .from(authUser)
      .where(and(eq(authUser.structureId, STRUCTURE_ID), eq(authUser.role, 'idel')))
      .orderBy(authUser.id))[0];
  }
  if (!idel) {
    console.error('❌ Aucun IDEL trouvé pour cette structure. Renseigne IDEL_EMAIL=... ou crée un IDEL.');
    await client.end();
    process.exit(1);
  }
  const IDEL_ID = idel.id;

  console.log(`🏢 Structure : "${structure.name}" (${STRUCTURE_ID.slice(0, 10)}…)`);
  console.log(`👩‍⚕️  IDEL planning/transmissions : ${idel.name} <${idel.email}>`);
  console.log(`📅 Date du planning : ${todayKey}\n`);

  // 3. Patients
  const patientRows = PATIENTS.map((p) => ({
    id: `seed-beth-pat-${p.idx}`,
    structureId: STRUCTURE_ID,
    firstName: p.firstName,
    lastName: p.lastName,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    phone: p.phone,
    treatingDoctor: p.treatingDoctor,
    assignedIdelId: IDEL_ID,
    status: 'active' as const,
    createdAt: daysAgo(30),
    updatedAt: now,
    syncedAt: now,
  }));
  await db.insert(patientsPg).values(patientRows).onConflictDoNothing();
  console.log(`🏥 ${patientRows.length} patients insérés (zone Béthune).`);

  // 3b. Patients assignés à l'IDEL mais NON planifiés aujourd'hui → candidats "Ajouter une urgence".
  const EXTRA_UNPLANNED = [
    { idx: 101, firstName: 'Lucien', lastName: 'Caron', street: '24, Rue Grégoire', lat: 50.5301, lng: 2.6430 },
    { idx: 102, firstName: 'Andrée', lastName: 'Wattel', street: '7, Rue de la Délivrance', lat: 50.5325, lng: 2.6372 },
    { idx: 103, firstName: 'Gérard', lastName: 'Hochart', street: '40, Avenue du Maréchal Leclerc', lat: 50.5285, lng: 2.6478 },
  ];
  const extraRows = EXTRA_UNPLANNED.map((p) => ({
    id: `seed-beth-pat-${p.idx}`,
    structureId: STRUCTURE_ID,
    firstName: p.firstName,
    lastName: p.lastName,
    address: suffix(p.street),
    latitude: p.lat,
    longitude: p.lng,
    phone: '0321000000',
    treatingDoctor: 'Dr. Moreau',
    assignedIdelId: IDEL_ID,
    status: 'active' as const,
    createdAt: daysAgo(20),
    updatedAt: now,
    syncedAt: now,
  }));
  await db.insert(patientsPg).values(extraRows).onConflictDoNothing();
  console.log(`🚑 ${extraRows.length} patients assignés non planifiés (candidats urgence).`);

  // 4. Planning du jour (ordonné)
  const planningRows = PATIENTS.map((p, i) => ({
    id: `seed-beth-plan-${todayKey}-${p.idx}`,
    patientId: `seed-beth-pat-${p.idx}`,
    idelId: IDEL_ID,
    date: todayKey,
    orderIndex: i,
    status: p.status,
    etaMinutes: p.etaMinutes,
    createdAt: now,
    updatedAt: now,
    syncedAt: now,
  }));
  await db
    .insert(planningEntriesPg)
    .values(planningRows)
    .onConflictDoUpdate({
      target: planningEntriesPg.id,
      set: {
        orderIndex: sql`excluded.order_index`,
        status: sql`excluded.status`,
        etaMinutes: sql`excluded.eta_minutes`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
  console.log(`🗺️  ${planningRows.length} entrées de planning créées/mises à jour pour le ${todayKey}.`);

  // 5. Transmissions
  const transmissionRows = PATIENTS.flatMap((p) =>
    p.transmissions.map((t, j) => {
      const created = daysAgo(t.daysAgo);
      return {
        id: `seed-beth-tx-${p.idx}-${j}`,
        patientId: `seed-beth-pat-${p.idx}`,
        authorId: IDEL_ID,
        contentOriginal: t.original,
        contentValidated: t.validated,
        careType: t.careType,
        createdAt: created,
        updatedAt: created,
        syncedAt: now,
      };
    }),
  );
  await db.insert(transmissionsPg).values(transmissionRows).onConflictDoNothing();
  console.log(`📝 ${transmissionRows.length} transmissions insérées.`);

  // 6. Constantes vitales (historique ~12 mesures/patient)
  const vitalRows = PATIENTS.flatMap((p) =>
    Array.from({ length: 12 }, (_, k) => {
      const v = vitalsForProfile(p.profile);
      const measuredAt = daysAgo(11 - k); // une mesure par jour sur ~12 jours
      return {
        id: `seed-beth-vs-${p.idx}-${k}`,
        patientId: `seed-beth-pat-${p.idx}`,
        authorId: IDEL_ID,
        measuredAt,
        systolic: clamp(v.systolic, 60, 220),
        diastolic: clamp(v.diastolic, 40, 130),
        glycemia: clamp(v.glycemia, 1.5, 20),
        weight: clamp(v.weight, 30, 200),
        temperature: clamp(v.temperature, 34, 42),
        spo2: clamp(v.spo2, 70, 100),
        createdAt: measuredAt,
        syncedAt: now,
      };
    }),
  );
  await db.insert(vitalSignsPg).values(vitalRows).onConflictDoNothing();
  console.log(`💉 ${vitalRows.length} constantes vitales insérées.`);

  console.log('\n✅ Seed Béthune terminé.');
  console.log(`   → Connecte-toi en tant que ${idel.email} pour voir le planning du ${todayKey}.\n`);

  await client.end();
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seed Béthune :', err);
  process.exit(1);
});
