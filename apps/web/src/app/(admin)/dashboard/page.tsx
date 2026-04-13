import { headers } from 'next/headers';
import { Users, Stethoscope, FileText, Activity, RefreshCw, Bell } from 'lucide-react';
import { and, count, desc, eq, gte, inArray } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser, patientsPg, transmissionsPg } from '@kura/db';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPatientsTable, type RecentPatient } from '@/components/dashboard/RecentPatientsTable';

async function getDashboardStats(structureId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [idelCountResult, patientCountResult, transmissionCountResult] = await Promise.all([
    // IDELs actifs dans la structure
    db
      .select({ count: count() })
      .from(authUser)
      .where(
        and(
          eq(authUser.structureId, structureId),
          eq(authUser.role, 'idel'),
          eq(authUser.disabled, false),
        ),
      ),
    // Patients actifs dans la structure
    db
      .select({ count: count() })
      .from(patientsPg)
      .where(
        and(
          eq(patientsPg.structureId, structureId),
          eq(patientsPg.status, 'active'),
        ),
      ),
    // Transmissions ce mois (via join patients → structureId)
    db
      .select({ count: count() })
      .from(transmissionsPg)
      .innerJoin(patientsPg, eq(transmissionsPg.patientId, patientsPg.id))
      .where(
        and(
          eq(patientsPg.structureId, structureId),
          gte(transmissionsPg.createdAt, startOfMonth),
        ),
      ),
  ]);

  return {
    idelCount: idelCountResult[0]?.count ?? 0,
    patientCount: patientCountResult[0]?.count ?? 0,
    transmissionCount: transmissionCountResult[0]?.count ?? 0,
  };
}

async function getRecentPatients(structureId: string): Promise<RecentPatient[]> {
  // Derniers 5 patients mis à jour
  const patients = await db
    .select({
      id: patientsPg.id,
      firstName: patientsPg.firstName,
      lastName: patientsPg.lastName,
      treatingDoctor: patientsPg.treatingDoctor,
      status: patientsPg.status,
      updatedAt: patientsPg.updatedAt,
    })
    .from(patientsPg)
    .where(eq(patientsPg.structureId, structureId))
    .orderBy(desc(patientsPg.updatedAt))
    .limit(5);

  if (patients.length === 0) return [];

  // Dernière transmission par patient
  const patientIds = patients.map((p) => p.id);
  const lastTransmissions = await db
    .select({
      patientId: transmissionsPg.patientId,
      createdAt: transmissionsPg.createdAt,
      authorId: transmissionsPg.authorId,
    })
    .from(transmissionsPg)
    .where(inArray(transmissionsPg.patientId, patientIds))
    .orderBy(desc(transmissionsPg.createdAt));

  // Nom des auteurs de transmission
  const authorIds = [...new Set(lastTransmissions.map((t) => t.authorId))];
  const authors =
    authorIds.length > 0
      ? await db
          .select({ id: authUser.id, name: authUser.name })
          .from(authUser)
          .where(inArray(authUser.id, authorIds))
      : [];
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  // Map patientId → dernière transmission
  const lastTransmissionMap = new Map<string, { createdAt: Date; authorId: string }>();
  for (const t of lastTransmissions) {
    if (!lastTransmissionMap.has(t.patientId)) {
      lastTransmissionMap.set(t.patientId, { createdAt: t.createdAt, authorId: t.authorId });
    }
  }

  return patients.map((p) => {
    const lastTx = lastTransmissionMap.get(p.id);
    return {
      id: p.id,
      fullName: `${p.firstName} ${p.lastName.toUpperCase()}`,
      treatingDoctor: p.treatingDoctor,
      status: p.status,
      lastTransmissionAt: lastTx?.createdAt ?? null,
      lastTransmissionAuthor: lastTx ? (authorMap.get(lastTx.authorId) ?? null) : null,
    };
  });
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { name?: string; structureId?: string | null } | undefined;
  const userName = user?.name?.split(' ')[0] ?? 'Utilisateur';
  const structureId = user?.structureId;

  const [stats, recentPatients] = structureId
    ? await Promise.all([
        getDashboardStats(structureId),
        getRecentPatients(structureId),
      ])
    : [{ idelCount: 0, patientCount: 0, transmissionCount: 0 }, []];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {userName}{' '}
            <span className="text-indigo-600">· Cabinet KURA</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
              Sync temps réel
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Synchroniser"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            aria-label="Notifications"
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Stethoscope}
          value={stats.idelCount}
          label="IDELs actifs"
          accentColor="border-l-teal-500"
          iconBgColor="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          icon={Users}
          value={stats.patientCount}
          label="Patients"
          accentColor="border-l-blue-500"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={FileText}
          value={stats.transmissionCount}
          label="Transmissions ce mois"
          accentColor="border-l-orange-500"
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          icon={Activity}
          value="99.8%"
          label="Uptime sync"
          accentColor="border-l-purple-500"
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Recent patients */}
      <RecentPatientsTable patients={recentPatients} />
    </div>
  );
}
