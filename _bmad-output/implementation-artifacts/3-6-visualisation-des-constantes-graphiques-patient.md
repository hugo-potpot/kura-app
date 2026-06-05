# Story 3.6 : Visualisation des Constantes & Graphiques Patient

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'IDEL ou médecin prescripteur,
Je veux visualiser l'évolution des constantes vitales d'un patient sous forme de graphiques (tension, glycémie, poids, température, SpO2),
Afin de suivre son état clinique en un coup d'œil lors de mes visites.

## Acceptance Criteria

1. **Given** la fiche patient, section "Constantes"
   **When** au moins une constante a été enregistrée
   **Then** un graphique courbe s'affiche (`ConstantesLineChart` C6) avec zones colorées : vert = normal, orange = attention, rouge = alerte
   **And** chaque zone est identifiée par icône + couleur + label (pas de couleur seule — accessibilité daltonisme)

2. **Given** le graphique affiché
   **When** je tape sur un point de la courbe
   **Then** un tooltip affiche la valeur exacte + la date de mesure

3. **Given** le sélecteur de plage temporelle
   **When** je bascule entre "7 jours", "30 jours", "6 mois"
   **Then** le graphique se met à jour pour afficher la période sélectionnée

4. **Given** un médecin prescripteur accédant aux constantes de son patient
   **When** il consulte la section Constantes
   **Then** il voit les mêmes graphiques qu'un IDEL, sans bouton "Saisir des constantes" (lecture seule stricte)

5. **Given** aucune constante enregistrée pour le patient
   **When** la section Constantes s'affiche
   **Then** un état vide "Aucune constante enregistrée" s'affiche (pas d'erreur)

## Tasks / Subtasks

- [x] **T1** — Créer le schéma `vital_signs` (SQLite + PostgreSQL) (AC: 1, 2, 5)
  - [x] T1.1 — Créer `packages/db/schema/vital-signs-schema.ts` avec les deux tables
  - [x] T1.2 — Exporter `vitalSigns` et `vitalSignsPg` depuis `packages/db/schema/index.ts`
  - [x] T1.3 — Ajouter la table `vital_signs` dans `apps/mobile/src/lib/sqlite-ddl.ts`

- [x] **T2** — Créer `GET /api/v1/patients/[id]/vital-signs` (AC: 1, 2, 3, 4)
  - [x] T2.1 — Créer `apps/web/src/app/api/v1/patients/[id]/vital-signs/route.ts`
  - [x] T2.2 — Auth check : session requise (401), `structureId` présent (403)
  - [x] T2.3 — Vérifier que le patient appartient à la structure → 404 sinon
  - [x] T2.4 — Si `user.role === 'medecin'` : vérifier `patient.assignedDoctorId === user.id` ou accès struct → 403 sinon
  - [x] T2.5 — Parser `?range=7d|30d|6m` → calculer `since` timestamp
  - [x] T2.6 — Requête `db.select().from(vitalSignsPg).where(and(eq(patientId), gte(measuredAt, since)))` ordonnée par `measuredAt ASC`
  - [x] T2.7 — Retourner `{ data: { vitalSigns: [...] } }`

- [x] **T3** — Créer `useVitalSigns` hook mobile (AC: 1, 3, 5)
  - [x] T3.1 — Créer `apps/mobile/src/features/patients/hooks/useVitalSigns.ts`
  - [x] T3.2 — Paramètres : `patientId: string`, `range: '7d' | '30d' | '6m'`
  - [x] T3.3 — Lire depuis SQLite local via Drizzle (offline-first, même pattern que `usePatient`)
  - [x] T3.4 — Filtrer par `patientId` + `measuredAt >= since` + `ORDER BY measuredAt ASC`
  - [x] T3.5 — Retourner tableau `VitalSign[]` (ou `[]` si vide — pas de throw)

- [x] **T4** — Créer `ConstantesLineChart` component C6 (AC: 1, 2, 3)
  - [x] T4.1 — Installer `react-native-gifted-charts` : `pnpm add react-native-gifted-charts` dans `apps/mobile`
  - [x] T4.2 — Créer `apps/mobile/src/features/patients/components/ConstantesLineChart.tsx`
  - [x] T4.3 — Props : `dataPoints: { value: number; date: Date }[]`, `unit: string`, `normalRange: { min: number; max: number }`, `alertRange: { min: number; max: number }`, `label: string`
  - [x] T4.4 — Zones colorées : vert si dans `normalRange`, orange si dans zone intermédiaire, rouge si hors `alertRange`
  - [x] T4.5 — Tooltip au tap sur point (via `pointerConfig` de gifted-charts) affichant valeur + date
  - [x] T4.6 — État vide si `dataPoints.length === 0` : Text "Aucune donnée sur cette période"

- [x] **T5** — Intégrer dans `PatientDetailScreen` — section Constantes (AC: 1, 2, 3, 4, 5)
  - [x] T5.1 — Ajouter section "Constantes vitales" après les infos patient (avant la zone dangereuse)
  - [x] T5.2 — Chips horizontaux scrollables pour sélectionner la constante : Tension · Glycémie · Poids · Température · SpO2
  - [x] T5.3 — Chips horizontaux scrollables pour la plage : 7 jours · 30 jours · 6 mois
  - [x] T5.4 — Utiliser `useVitalSigns(patientId, range)` pour charger les données
  - [x] T5.5 — Transformer les données en `dataPoints[]` selon la constante sélectionnée (ex: tension → systolic, glycémie → glycemia)
  - [x] T5.6 — Passer `normalRange` et `alertRange` selon la constante active (voir valeurs dans Dev Notes)
  - [x] T5.7 — Si `user.role === 'medecin'` → ne pas afficher le bouton "Saisir des constantes" (bouton sera ajouté en story 5-4) — placeholder comment ajouté, AuthUser.role sera ajouté en story 5.4
  - [x] T5.8 — Skeleton pendant le chargement (ActivityIndicator Paper)

## Dev Notes

### Schéma `vital_signs` — Définition complète

```typescript
// packages/db/schema/vital-signs-schema.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, real as pgReal, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile, offline-first) ─────────────────────────────────────────
export const vitalSigns = sqliteTable('vital_signs', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  patientId: text('patient_id').notNull(),
  authorId: text('author_id').notNull(),
  measuredAt: integer('measured_at', { mode: 'timestamp' }).notNull(),
  systolic: real('systolic'),         // tension systolique en mmHg
  diastolic: real('diastolic'),       // tension diastolique en mmHg
  glycemia: real('glycemia'),         // glycémie en mmol/L
  weight: real('weight'),             // poids en kg
  temperature: real('temperature'),   // température en °C
  spo2: real('spo2'),                 // SpO2 en %
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const vitalSignsPg = pgTable('vital_signs', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  patientId: pgText('patient_id').notNull(),
  authorId: pgText('author_id').notNull(),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
  systolic: pgReal('systolic'),
  diastolic: pgReal('diastolic'),
  glycemia: pgReal('glycemia'),
  weight: pgReal('weight'),
  temperature: pgReal('temperature'),
  spo2: pgReal('spo2'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
});
```

### DDL SQLite à ajouter dans `sqlite-ddl.ts`

```sql
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
```

### Route GET `/api/v1/patients/[id]/vital-signs` — Pattern complet

```typescript
// apps/web/src/app/api/v1/patients/[id]/vital-signs/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, vitalSignsPg } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

const RANGE_MAP: Record<string, number> = {
  '7d':  7  * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '6m':  6  * 30 * 24 * 60 * 60 * 1000,
};

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { id: string; structureId?: string; role?: string };
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const { id } = await params;
  const range = new URL(req.url).searchParams.get('range') ?? '30d';
  const ms = RANGE_MAP[range] ?? RANGE_MAP['30d'];
  const since = new Date(Date.now() - ms);

  const [patient] = await db
    .select({ id: patientsPg.id })
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });

  const vitalSigns = await db
    .select()
    .from(vitalSignsPg)
    .where(and(eq(vitalSignsPg.patientId, id), gte(vitalSignsPg.measuredAt, since)))
    .orderBy(vitalSignsPg.measuredAt);

  return NextResponse.json({ data: { vitalSigns } });
}
```

### Hook `useVitalSigns` — Pattern Drizzle local (offline-first)

```typescript
// apps/mobile/src/features/patients/hooks/useVitalSigns.ts
import { useQuery } from '@tanstack/react-query';
import { vitalSigns } from '@kura/db';
import { getDb } from '@/lib/db';
import { eq, and, gte } from 'drizzle-orm';

export type VitalSign = typeof vitalSigns.$inferSelect;
type Range = '7d' | '30d' | '6m';

const RANGE_MS: Record<Range, number> = {
  '7d':  7  * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '6m':  6  * 30 * 24 * 60 * 60 * 1000,
};

async function fetchVitalSigns(patientId: string, range: Range): Promise<VitalSign[]> {
  const db = await getDb();
  const since = new Date(Date.now() - RANGE_MS[range]);
  return db
    .select()
    .from(vitalSigns)
    .where(and(eq(vitalSigns.patientId, patientId), gte(vitalSigns.measuredAt, since)))
    .orderBy(vitalSigns.measuredAt);
}

export function useVitalSigns(patientId: string, range: Range = '30d') {
  return useQuery({
    queryKey: ['vitalSigns', patientId, range],
    queryFn: () => fetchVitalSigns(patientId, range),
    enabled: !!patientId,
  });
}
```

### Plages normales et d'alerte par constante

| Constante | normalRange | alertRange | unit |
|-----------|------------|------------|------|
| Tension systolique | `{ min: 90, max: 139 }` mmHg | `{ min: 80, max: 180 }` | mmHg |
| Tension diastolique | `{ min: 60, max: 89 }` mmHg | `{ min: 50, max: 110 }` | mmHg |
| Glycémie | `{ min: 3.9, max: 7.8 }` mmol/L | `{ min: 2.5, max: 11.0 }` | mmol/L |
| Poids | aucune plage fixe — afficher tendance seulement | N/A | kg |
| Température | `{ min: 36.0, max: 37.5 }` °C | `{ min: 35.0, max: 38.5 }` | °C |
| SpO2 | `{ min: 95, max: 100 }` % | `{ min: 90, max: 100 }` | % |

> **Note Poids :** pas de `normalRange` ni `alertRange` fixes — passer `normalRange=undefined` à `ConstantesLineChart` pour afficher sans zones colorées.

### `ConstantesLineChart` — Squelette d'implémentation

```typescript
// apps/mobile/src/features/patients/components/ConstantesLineChart.tsx
import { LineChart } from 'react-native-gifted-charts';
import { View, Text } from 'react-native';
import { COLORS } from '@/theme/kura-theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DataPoint { value: number; date: Date }
interface Props {
  dataPoints: DataPoint[];
  unit: string;
  label: string;
  normalRange?: { min: number; max: number };
  alertRange?: { min: number; max: number };
}

export function ConstantesLineChart({ dataPoints, unit, label, normalRange, alertRange }: Props) {
  if (dataPoints.length === 0) {
    return <Text style={{ color: COLORS.textSecondary }}>Aucune donnée sur cette période</Text>;
  }

  const chartData = dataPoints.map(pt => ({
    value: pt.value,
    label: format(pt.date, 'dd/MM', { locale: fr }),
    dataPointText: `${pt.value} ${unit}`,
  }));

  // Déterminer couleur de chaque point
  function getPointColor(val: number): string {
    if (!normalRange) return COLORS.primary;
    if (val >= normalRange.min && val <= normalRange.max) return '#4CAF50'; // vert
    if (!alertRange) return '#FF9800'; // orange par défaut
    if (val < alertRange.min || val > alertRange.max) return '#F44336'; // rouge alerte
    return '#FF9800'; // orange attention
  }

  return (
    <View>
      <LineChart
        data={chartData}
        width={300}
        height={180}
        color={COLORS.primary}
        thickness={2}
        dataPointsColor={COLORS.primary}
        pointerConfig={{
          pointerStripHeight: 160,
          pointerColor: COLORS.primary,
          radius: 6,
          pointerLabelWidth: 120,
          pointerLabelHeight: 50,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number; label: string }[]) => (
            <View style={{ backgroundColor: '#fff', padding: 6, borderRadius: 6, elevation: 3 }}>
              <Text style={{ fontWeight: 'bold' }}>{items[0]?.value} {unit}</Text>
              <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{items[0]?.label}</Text>
            </View>
          ),
        }}
        yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
        curved
        animateOnDataChange
      />
    </View>
  );
}
```

### Section Constantes dans `PatientDetailScreen` — Intégration

La section Constantes s'insère **après les informations générales** du patient et **avant la zone dangereuse** (archivage/suppression).

**Sélection de constante :** Chips horizontaux scrollables (React Native Paper `Chip`) :
```
[ Tension ] [ Glycémie ] [ Poids ] [ Température ] [ SpO2 ]
```

**Sélection de plage :** Chips à droite :
```
[ 7 jours ] [ 30 jours ] [ 6 mois ]
```

**Map constante → champ DB :**
```typescript
const CONSTANTE_MAP = {
  tension:     { field: 'systolic', unit: 'mmHg', label: 'Tension systolique', ... },
  glycemia:    { field: 'glycemia', unit: 'mmol/L', ... },
  weight:      { field: 'weight', unit: 'kg', ... },
  temperature: { field: 'temperature', unit: '°C', ... },
  spo2:        { field: 'spo2', unit: '%', ... },
} as const;
```

> **Note : Tension** = afficher `systolic` comme courbe principale. Si besoin post-MVP, afficher deux courbes (`systolic` + `diastolic`) en superposition.

### Installation de `react-native-gifted-charts`

```bash
# Dans le dossier apps/mobile
pnpm add react-native-gifted-charts
```

**Prérequis déjà installés :**
- `react-native-svg` ✅ (^15.15.4)
- `react-native-reanimated` ✅ (4.2.1)
- `react-native-gesture-handler` ✅ (~2.30.0)

`react-native-gifted-charts` utilise ces peer deps — aucun conflit attendu avec Expo 55.

### Expo SDK — Version réelle

L'app utilise **Expo 55** (`expo: ~55.0.6`), non SDK 53 comme mentionné dans l'architecture. Les APIs sont identiques, la librairie `react-native-gifted-charts` est compatible.

### Pattern d'isolation multi-tenant (rappel)

Toute requête API filtre obligatoirement par `structureId` (récupéré depuis la session). Le filtre `patientId` seul ne suffit pas. Voir pattern établi dans stories 3.1–3.5.

### État vide vs état d'erreur

- `vitalSigns.length === 0` + pas d'erreur → afficher "Aucune constante enregistrée" (état vide)
- `isError` → afficher `<ErrorState error={error} onRetry={refetch} />` avec bouton Réessayer
- Pas de données ne doit JAMAIS retourner une erreur 404 — retourner `[]` depuis l'API

### Dépendance — Story 3.2 et 3.5

`PatientDetailScreen.tsx` a été créé en story 3.2 et modifié en story 3.5 (ajout zone dangereuse). Ce fichier existe déjà avec archive/delete. Ajouter la section Constantes sans toucher à la logique archive/delete existante.

### Ce que cette story NE fait PAS

- **Pas de bouton "Saisir des constantes"** — sera ajouté en story 5.4 (Epic 5 : Transmissions & Documentation)
- **Pas d'affichage web** — la page admin web n'inclut pas de graphique pour le MVP
- **Pas de données seed** — l'état vide est le comportement attendu sans story 5.4 implémentée

### Project Structure Notes

```
packages/db/schema/
  vital-signs-schema.ts        ← NOUVEAU — schéma SQLite + PostgreSQL

apps/mobile/src/lib/
  sqlite-ddl.ts                ← MODIFIÉ — ajouter table vital_signs

apps/web/src/app/api/v1/patients/[id]/vital-signs/
  route.ts                     ← NOUVEAU — GET endpoint

apps/mobile/src/features/patients/
  hooks/useVitalSigns.ts       ← NOUVEAU — hook Drizzle local
  components/ConstantesLineChart.tsx ← NOUVEAU — composant C6
  screens/PatientDetailScreen.tsx ← MODIFIÉ — section Constantes
```

### References

- Architecture C6 `ConstantesLineChart` : `_bmad-output/planning-artifacts/ux-design-specification.md#C6-ConstantesLineChart` (ligne 1578)
- FR23 Visualisation constantes : `_bmad-output/planning-artifacts/epics.md` (ligne 58, 873)
- Pattern schéma Drizzle : `packages/db/schema/patient-schema.ts`
- Pattern hook SQLite local : `apps/mobile/src/features/patients/hooks/usePatient.ts`
- Pattern API avec auth + structureId : `apps/web/src/app/api/v1/patients/[id]/archive/route.ts`
- Pattern isolation multi-tenant : `apps/web/src/app/api/v1/patients/[id]/route.ts` (story 3.2)
- `COLORS` tokens : `apps/mobile/src/theme/kura-theme.ts`
- Règles obligatoires architecture : `_bmad-output/planning-artifacts/architecture.md#Section-4.6`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Schéma `vital_signs` créé (SQLite + PostgreSQL) — champs : id, patientId, authorId, measuredAt, systolic, diastolic, glycemia, weight, temperature, spo2. `measuredAt` avec `mode: 'timestamp'` retourne bien un `Date` en TypeScript.
- `react-native-gifted-charts@1.4.76` installé. `minValue` n'existe pas dans l'API — remplacé par `yAxisOffset` (axe Y commence à `yMin`) + `maxValue` sur l'étendue (`yMax - yMin`).
- `date-fns` n'était pas installé dans `apps/mobile` — formatage des dates avec `Intl.DateTimeFormat` natif.
- Le rôle utilisateur n'est pas dans `AuthUser` du store mobile. Un placeholder comment a été ajouté : le bouton "Saisir des constantes" + la vérification du rôle seront ajoutés en story 5.4.
- Les 3 suites de tests en échec (`useAuth.test.ts`, `useLogin.test.ts`, `TotpSetup.test.tsx`) sont pré-existantes — non regressions introduites par cette story.
- 66/66 tests web passent, 10/10 tests mobile (patients) passent, 0 nouveau test en échec.

### File List

**Nouveaux :**
- `packages/db/schema/vital-signs-schema.ts`
- `apps/web/src/app/api/v1/patients/[id]/vital-signs/route.ts`
- `apps/web/src/app/api/v1/patients/[id]/vital-signs/route.test.ts`
- `apps/mobile/src/features/patients/hooks/useVitalSigns.ts`
- `apps/mobile/src/features/patients/hooks/useVitalSigns.test.ts`
- `apps/mobile/src/features/patients/components/ConstantesLineChart.tsx`
- `apps/mobile/src/features/patients/components/ConstantesLineChart.test.tsx`

**Modifiés :**
- `packages/db/schema/index.ts` — exports vitalSigns + vitalSignsPg
- `apps/mobile/src/lib/sqlite-ddl.ts` — ajout table vital_signs
- `apps/mobile/src/features/patients/screens/PatientDetailScreen.tsx` — section Constantes vitales

**Dépendances ajoutées :**
- `apps/mobile/package.json` — react-native-gifted-charts@1.4.76
- `apps/mobile/package.json` — expo-linear-gradient@~55.0.13 (requis par react-native-gifted-charts au chargement du module)

### Change Log

| Date | Change |
|------|--------|
| 2026-04-28 | Implémentation complète T1–T5. Schéma vital_signs, route API GET, hook useVitalSigns, composant ConstantesLineChart (C6), intégration PatientDetailScreen. 16 tests nouveaux (10 mobile + 6 web), 0 régression. Status → review. |