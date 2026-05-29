'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Stethoscope,
  CalendarDays,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface IdelUser {
  id: string;
  name: string;
  role: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  assignedIdelId: string | null;
}

interface PlanningEntry {
  id: string;
  patientId: string;
  idelId: string;
  date: string;
  orderIndex: number;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
}

interface PlanningPatient extends Patient {
  orderIndex: number;
  status: PlanningEntry['status'] | null;
}

// ── helpers date ─────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const dow = copy.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mLabel = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const sLabel = sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${mLabel} – ${sLabel}`;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── status badge ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PlanningEntry['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  done: 'Terminé',
  skipped: 'Absent',
};

const STATUS_CLASS: Record<PlanningEntry['status'], string> = {
  pending: 'bg-slate-100 text-slate-500',
  in_progress: 'bg-blue-50 text-blue-700',
  done: 'bg-green-50 text-green-700',
  skipped: 'bg-orange-50 text-orange-700',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── composant principal ────────────────────────────────────────────────────────

export default function IdelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idelId = params.id;

  const today = useMemo(() => toDateKey(new Date()), []);

  // Semaine affichée (lundi)
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  // Jour sélectionné
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [idel, setIdel] = useState<IdelUser | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [planningList, setPlanningList] = useState<PlanningPatient[]>([]);
  // Compteurs de visites par date (pour les onglets)
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i)),
    [weekMonday],
  );

  // Charge le planning d'un jour précis
  const loadDay = useCallback(
    async (date: string, currentPatients?: Patient[]) => {
      setLoading(true);
      setSaveStatus('idle');
      try {
        const res = await fetch(`/api/v1/admin/idels/${idelId}/planning?date=${date}`);
        if (!res.ok) { router.push('/idels'); return; }
        const json = await res.json() as {
          data: { idel: IdelUser; patients: Patient[]; planning: PlanningEntry[]; today: string }
        };
        const { idel: idelData, patients, planning } = json.data;
        setIdel(idelData);
        const pts = currentPatients ?? patients;
        setAllPatients(pts);

        const plannedIds = new Set(planning.map((e) => e.patientId));
        const inPlanning: PlanningPatient[] = planning
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((e) => {
            const p = pts.find((pt) => pt.id === e.patientId);
            return p ? { ...p, orderIndex: e.orderIndex, status: e.status } : null;
          })
          .filter(Boolean) as PlanningPatient[];

        const notPlanned: PlanningPatient[] = pts
          .filter((p) => !plannedIds.has(p.id))
          .map((p) => ({ ...p, orderIndex: -1, status: null }));

        setPlanningList([...inPlanning, ...notPlanned]);
        // Mettre à jour le compteur pour ce jour
        setDayCounts((prev) => ({ ...prev, [date]: planning.length }));
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [idelId, router],
  );

  // Charge les compteurs de toute la semaine (appels parallèles)
  const loadWeekCounts = useCallback(
    async (days: Date[]) => {
      const results = await Promise.allSettled(
        days.map(async (d) => {
          const key = toDateKey(d);
          const res = await fetch(`/api/v1/admin/idels/${idelId}/planning?date=${key}`);
          if (!res.ok) return { key, count: 0 };
          const json = await res.json() as { data: { planning: PlanningEntry[] } };
          return { key, count: json.data.planning.length };
        }),
      );
      const counts: Record<string, number> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') counts[r.value.key] = r.value.count;
      }
      setDayCounts(counts);
    },
    [idelId],
  );

  // Initialisation
  useEffect(() => {
    void loadDay(selectedDate);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Recharge les compteurs quand la semaine change
  useEffect(() => {
    void loadWeekCounts(weekDays);
  }, [weekMonday, loadWeekCounts, weekDays]);

  // Changement de jour sélectionné
  const handleSelectDay = useCallback(
    (date: string) => {
      setSelectedDate(date);
      void loadDay(date, allPatients);
    },
    [loadDay, allPatients],
  );

  // Navigation semaine
  function prevWeek() {
    const newMonday = addDays(weekMonday, -7);
    setWeekMonday(newMonday);
    const newSelected = toDateKey(addDays(newMonday, weekDays.findIndex((d) => toDateKey(d) === selectedDate)));
    // Sélectionner lundi de la nouvelle semaine par défaut
    const mondayKey = toDateKey(newMonday);
    setSelectedDate(mondayKey);
    void loadDay(mondayKey, allPatients);
  }

  function nextWeek() {
    const newMonday = addDays(weekMonday, 7);
    setWeekMonday(newMonday);
    const mondayKey = toDateKey(newMonday);
    setSelectedDate(mondayKey);
    void loadDay(mondayKey, allPatients);
  }

  function goToCurrentWeek() {
    const newMonday = getMondayOfWeek(new Date());
    setWeekMonday(newMonday);
    setSelectedDate(today);
    void loadDay(today, allPatients);
  }

  const inPlanning = planningList.filter((p) => p.orderIndex >= 0).sort((a, b) => a.orderIndex - b.orderIndex);
  const notInPlanning = planningList.filter((p) => p.orderIndex < 0);

  function moveUp(patientId: string) {
    const idx = inPlanning.findIndex((p) => p.id === patientId);
    if (idx <= 0) return;
    const newList = [...inPlanning];
    [newList[idx - 1], newList[idx]] = [newList[idx]!, newList[idx - 1]!];
    const reIndexed = newList.map((p, i) => ({ ...p, orderIndex: i }));
    setPlanningList([...reIndexed, ...notInPlanning]);
  }

  function moveDown(patientId: string) {
    const idx = inPlanning.findIndex((p) => p.id === patientId);
    if (idx < 0 || idx >= inPlanning.length - 1) return;
    const newList = [...inPlanning];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1]!, newList[idx]!];
    const reIndexed = newList.map((p, i) => ({ ...p, orderIndex: i }));
    setPlanningList([...reIndexed, ...notInPlanning]);
  }

  function addToPlanning(patientId: string) {
    const nextIndex = inPlanning.length;
    setPlanningList((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, orderIndex: nextIndex, status: 'pending' as const } : p)),
    );
  }

  function removeFromPlanning(patientId: string) {
    const updated = planningList.map((p) => (p.id === patientId ? { ...p, orderIndex: -1, status: null } : p));
    let idx = 0;
    const reIndexed = updated.map((p) => (p.orderIndex >= 0 ? { ...p, orderIndex: idx++ } : p));
    setPlanningList(reIndexed);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const entries = inPlanning.map((p, i) => ({ patientId: p.id, orderIndex: i }));
      const res = await fetch(`/api/v1/admin/idels/${idelId}/planning`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, entries }),
      });
      if (res.ok) {
        setSaveStatus('success');
        setDayCounts((prev) => ({ ...prev, [selectedDate]: entries.length }));
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const isCurrentWeek = toDateKey(weekMonday) === toDateKey(getMondayOfWeek(new Date()));

  if (!idel && loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#1e2d6b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!idel) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <span>Application</span><span>/</span>
        <button onClick={() => router.push('/idels')} className="hover:text-slate-700">Infirmiers</button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{idel.name}</span>
      </nav>
      <button
        onClick={() => router.push('/idels')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </button>

      {/* Header IDEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
            {getInitials(idel.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{idel.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1e2d6b] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                <Stethoscope className="w-3 h-3" />
                IDEL
              </span>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {allPatients.length} patient{allPatients.length !== 1 ? 's' : ''} assigné{allPatients.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation semaine */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#1e2d6b]" />
            <span className="text-sm font-semibold text-slate-700">{formatWeekRange(weekMonday)}</span>
          </div>
          <div className="flex items-center gap-1">
            {!isCurrentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1.5 text-xs font-medium text-[#1e2d6b] bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors mr-1"
              >
                Aujourd'hui
              </button>
            )}
            <button
              onClick={prevWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Onglets jours */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {weekDays.map((day, i) => {
            const key = toDateKey(day);
            const isSelected = key === selectedDate;
            const isToday = key === today;
            const count = dayCounts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => handleSelectDay(key)}
                className={[
                  'flex flex-col items-center py-3 px-1 text-xs font-medium transition-colors border-b-2',
                  isSelected
                    ? 'border-[#1e2d6b] text-[#1e2d6b] bg-indigo-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                <span className="text-[10px] uppercase tracking-wide">{DAY_LABELS[i]}</span>
                <span
                  className={[
                    'mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold',
                    isToday ? 'bg-[#1e2d6b] text-white' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </span>
                {count > 0 && (
                  <span
                    className={[
                      'mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      isSelected ? 'bg-[#1e2d6b] text-white' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Planning du jour sélectionné */}
        <div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <p className="text-sm text-slate-500 capitalize">{formatLongDate(selectedDate)}</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>

          {saveStatus === 'success' && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Planning enregistré — l'IDEL recevra une notification.</p>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">Erreur lors de l'enregistrement. Réessayez.</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#1e2d6b] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inPlanning.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune visite planifiée pour ce jour.</p>
              <p className="text-xs text-slate-400 mt-1">Ajoutez des patients depuis la liste ci-dessous.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inPlanning.map((patient, idx) => (
                <div key={patient.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50">
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1e2d6b] text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {patient.firstName} {patient.lastName.toUpperCase()}
                      </p>
                      {patient.status !== null && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CLASS[patient.status]}`}>
                          {STATUS_LABEL[patient.status]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{patient.address}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveUp(patient.id)}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Monter"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(patient.id)}
                      disabled={idx === inPlanning.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Descendre"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromPlanning(patient.id)}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                      aria-label="Retirer du planning"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patients non planifiés ce jour */}
      {!loading && notInPlanning.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Patients non planifiés ce jour</h2>
            <span className="ml-auto text-xs text-slate-400">{notInPlanning.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {notInPlanning.map((patient) => (
              <div key={patient.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {patient.firstName} {patient.lastName.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{patient.address}</p>
                </div>
                <button
                  onClick={() => addToPlanning(patient.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1e2d6b] bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
