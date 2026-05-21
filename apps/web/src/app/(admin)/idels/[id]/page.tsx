'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Stethoscope,
  CalendarDays,
  ChevronUp,
  ChevronDown,
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
  status: string;
}

interface PlanningPatient extends Patient {
  orderIndex: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function IdelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idelId = params.id;

  const [idel, setIdel] = useState<IdelUser | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [today, setToday] = useState('');
  const [planningList, setPlanningList] = useState<PlanningPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/idels/${idelId}/planning`);
      if (!res.ok) { router.push('/idels'); return; }
      const json = await res.json() as {
        data: { idel: IdelUser; patients: Patient[]; planning: PlanningEntry[]; today: string }
      };
      const { idel: idelData, patients, planning, today: todayDate } = json.data;
      setIdel(idelData);
      setAllPatients(patients);
      setToday(todayDate);

      // Fusionner patients avec leur planning du jour
      const plannedIds = new Set(planning.map((e) => e.patientId));
      const inPlanning: PlanningPatient[] = planning
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((e) => {
          const p = patients.find((pt) => pt.id === e.patientId);
          return p ? { ...p, orderIndex: e.orderIndex } : null;
        })
        .filter(Boolean) as PlanningPatient[];

      // Patients pas encore dans le planning : orderIndex = -1 (not added yet)
      const notPlanned: PlanningPatient[] = patients
        .filter((p) => !plannedIds.has(p.id))
        .map((p) => ({ ...p, orderIndex: -1 }));

      setPlanningList([...inPlanning, ...notPlanned]);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [idelId, router]);

  useEffect(() => { void load(); }, [load]);

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
      prev.map((p) => (p.id === patientId ? { ...p, orderIndex: nextIndex } : p)),
    );
  }

  function removeFromPlanning(patientId: string) {
    const updated = planningList
      .map((p) => (p.id === patientId ? { ...p, orderIndex: -1 } : p));
    // Re-index remaining
    let idx = 0;
    const reIndexed = updated.map((p) =>
      p.orderIndex >= 0 ? { ...p, orderIndex: idx++ } : p,
    );
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
        body: JSON.stringify({ date: today, entries }),
      });
      if (res.ok) {
        setSaveStatus('success');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#1e2d6b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!idel) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Back */}
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
              <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
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

      {/* Planning du jour */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#1e2d6b]" />
            <h2 className="text-sm font-semibold text-slate-700">
              Planning du jour
              <span className="ml-2 text-xs font-normal text-slate-400">{today ? formatDate(today) : ''}</span>
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer le planning'}
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

        {inPlanning.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucune visite planifiée pour aujourd'hui.</p>
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
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {patient.firstName} {patient.lastName.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{patient.address}</p>
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

      {/* Patients non planifiés aujourd'hui */}
      {notInPlanning.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">
              Patients non planifiés aujourd'hui
            </h2>
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter au planning
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
