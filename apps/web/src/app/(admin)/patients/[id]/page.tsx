'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertCircle, MapPin, User, Phone, Stethoscope, Activity, Archive, Trash2, X } from 'lucide-react';
import { AddressAutocomplete, type AddressCoords } from '@/components/ui/address-autocomplete';
import { VitalSignsChart, type VitalSignPoint } from '@/components/patients/VitalSignsChart';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  treatingDoctor: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface VitalSign {
  id: string;
  patientId: string;
  measuredAt: string;
  systolic: number | null;
  diastolic: number | null;
  glycemia: number | null;
  weight: number | null;
  temperature: number | null;
  spo2: number | null;
}

type ConstanteKey = 'tension' | 'glycemia' | 'weight' | 'temperature' | 'spo2';
type VitalSignRange = '7d' | '30d' | '6m';

interface ConstanteConfig {
  label: string;
  field: keyof Pick<VitalSign, 'systolic' | 'glycemia' | 'weight' | 'temperature' | 'spo2'>;
  unit: string;
  normalRange?: { min: number; max: number };
  alertRange?: { min: number; max: number };
}

const CONSTANTE_CONFIG: Record<ConstanteKey, ConstanteConfig> = {
  tension:     { label: 'Tension',      field: 'systolic',    unit: 'mmHg',   normalRange: { min: 90,  max: 139 }, alertRange: { min: 80,  max: 180 } },
  glycemia:    { label: 'Glycémie',     field: 'glycemia',    unit: 'mmol/L', normalRange: { min: 3.9, max: 7.8 }, alertRange: { min: 2.5, max: 11.0 } },
  weight:      { label: 'Poids',        field: 'weight',      unit: 'kg' },
  temperature: { label: 'Température',  field: 'temperature', unit: '°C',     normalRange: { min: 36.0, max: 37.5 }, alertRange: { min: 35.0, max: 38.5 } },
  spo2:        { label: 'SpO2',         field: 'spo2',        unit: '%',      normalRange: { min: 95, max: 100 },    alertRange: { min: 90, max: 100 } },
};

const RANGE_LABELS: Record<VitalSignRange, string> = { '7d': '7 jours', '30d': '30 jours', '6m': '6 mois' };

const updatePatientSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100).optional(),
  lastName: z.string().min(1, 'Nom requis').max(100).optional(),
  address: z.string().min(5, 'Adresse trop courte').max(300).optional(),
  phone: z.string().optional().nullable(),
  treatingDoctor: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;

function ArchiveConfirmDialog({
  patientName,
  onConfirm,
  onClose,
  isLoading,
}: {
  patientName: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Archive className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Archiver ce patient ?</h2>
              <p className="text-xs text-slate-500 mt-0.5">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-slate-600">
            Le patient sera retiré du planning actif. Son dossier restera accessible en lecture depuis la liste &quot;Archivés&quot;.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-60"
            >
              {isLoading ? 'Archivage…' : "Confirmer l'archivage"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  patient,
  onConfirm,
  onClose,
  isLoading,
  retentionWarning,
}: {
  patient: Patient;
  onConfirm: (force: boolean) => void;
  onClose: () => void;
  isLoading: boolean;
  retentionWarning: boolean;
}) {
  const [inputName, setInputName] = useState('');
  const expectedName = `${patient.firstName} ${patient.lastName}`;
  const isNameMatch = inputName.trim().toLowerCase() === expectedName.toLowerCase();

  if (retentionWarning) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Avertissement RGPD</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Attention :</strong> La réglementation impose une conservation de 10 ans pour les données médicales.
              Ce patient a des transmissions récentes.
            </p>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
            >
              Archiver plutôt (recommandé)
            </button>
            <button
              onClick={() => onConfirm(true)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-60"
            >
              {isLoading ? 'Suppression…' : 'Supprimer quand même'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-700">Suppression définitive</h2>
              <p className="text-xs text-slate-500 mt-0.5">{expectedName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
            <strong>Cette action est irréversible</strong> — toutes les données du patient et ses transmissions associées seront supprimées définitivement.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tapez le nom du patient pour confirmer :{' '}
              <span className="font-bold text-slate-900">{expectedName}</span>
            </label>
            <input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder={expectedName}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(false)}
              disabled={!isNameMatch || isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-200 rounded" />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
      }`}
    >
      {isActive ? 'Actif' : 'Archivé'}
    </span>
  );
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'constantes'>('info');
  const [addressCoords, setAddressCoords] = useState<AddressCoords | null>(null);

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [retentionWarning, setRetentionWarning] = useState(false);

  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [vsLoading, setVsLoading] = useState(false);
  const [selectedConstante, setSelectedConstante] = useState<ConstanteKey>('tension');
  const [selectedRange, setSelectedRange] = useState<VitalSignRange>('30d');

  // Detect role from session — fetched lazily via existing /api/v1/me or fallback
  const [isDoctor, setIsDoctor] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdatePatientFormData>({
    resolver: zodResolver(updatePatientSchema),
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/patients/${patientId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) return;
        const json = await res.json() as { data?: { patient?: Patient } };
        const p = json.data?.patient;
        if (!p) return;
        setPatient(p);
        reset({
          firstName: p.firstName,
          lastName: p.lastName,
          address: p.address,
          phone: p.phone ?? '',
          treatingDoctor: p.treatingDoctor ?? '',
        });
      } catch {
        /* network error — stay loading */
      } finally {
        setLoading(false);
      }
    }

    async function loadRole() {
      try {
        const res = await fetch('/api/auth/get-session');
        const json = await res.json() as { user?: { role?: string } } | null;
        if (json?.user?.role === 'doctor') setIsDoctor(true);
      } catch {
        /* role unknown — default to non-doctor */
      }
    }

    void load();
    void loadRole();
  }, [patientId, reset]);

  useEffect(() => {
    if (activeTab !== 'constantes') return;
    async function loadVS() {
      setVsLoading(true);
      try {
        const res = await fetch(`/api/v1/patients/${patientId}/vital-signs?range=${selectedRange}`);
        if (!res.ok) return;
        const json = await res.json() as { data?: { vitalSigns?: VitalSign[] } };
        setVitalSigns(json.data?.vitalSigns ?? []);
      } catch {
        /* silent */
      } finally {
        setVsLoading(false);
      }
    }
    void loadVS();
  }, [activeTab, patientId, selectedRange]);

  async function handleArchive() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/patients/${patientId}/archive`, { method: 'PATCH' });
      if (res.ok) {
        router.push('/patients');
      } else {
        const err = await res.json() as { error?: { code?: string } };
        if (err.error?.code === 'ALREADY_ARCHIVED') {
          setSaveError('Ce patient est déjà archivé.');
        }
      }
    } catch {
      setSaveError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
      setShowArchiveDialog(false);
    }
  }

  async function handleDelete(force: boolean) {
    setActionLoading(true);
    setRetentionWarning(false);
    try {
      const url = `/api/v1/patients/${patientId}${force ? '?force=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.status === 204) {
        router.push('/patients?deleted=1');
      } else if (res.status === 409) {
        const err = await res.json() as { error?: { code?: string } };
        if (err.error?.code === 'RETENTION_WARNING') {
          setRetentionWarning(true);
          return;
        }
      } else {
        setSaveError('Erreur lors de la suppression. Veuillez réessayer.');
        setShowDeleteDialog(false);
      }
    } catch {
      setSaveError('Erreur réseau. Veuillez réessayer.');
      setShowDeleteDialog(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function onSubmit(data: UpdatePatientFormData) {
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const payload = addressCoords
        ? { ...data, latitude: addressCoords.lat, longitude: addressCoords.lng }
        : data;
      const res = await fetch(`/api/v1/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: { message?: string } };
        setSaveError(err.error?.message ?? 'Erreur lors de la sauvegarde');
        return;
      }
      const json = await res.json() as { data?: { patient?: Patient } };
      const updated = json.data?.patient;
      if (updated) {
        setPatient(updated);
        reset({
          firstName: updated.firstName,
          lastName: updated.lastName,
          address: updated.address,
          phone: updated.phone ?? '',
          treatingDoctor: updated.treatingDoctor ?? '',
        });
        setSaveSuccess(true);
        setAddressCoords(null);
        if (updated.latitude === null) {
          setSaveError('Adresse non géolocalisée — ce patient sera placé en fin de planning.');
        }
      }
    } catch {
      setSaveError('Erreur réseau. Veuillez réessayer.');
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <p className="text-slate-700 font-semibold">Patient introuvable</p>
        <button
          onClick={() => router.push('/patients')}
          className="text-sm text-[#1e2d6b] underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const fullName = patient ? `${patient.firstName} ${patient.lastName}` : '…';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <span>Application</span>
        <span>/</span>
        <button onClick={() => router.push('/patients')} className="hover:text-slate-700">
          Patients
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{fullName}</span>
      </nav>

      {/* Back link */}
      <button
        onClick={() => router.push('/patients')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </button>

      {loading ? (
        <SkeletonDetail />
      ) : patient ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={patient.status} />
                {patient.latitude === null && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Adresse non géolocalisée
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-[#1e2d6b] text-[#1e2d6b]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('constantes')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'constantes'
                    ? 'border-[#1e2d6b] text-[#1e2d6b]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Constantes
              </button>
            </div>
          </div>

          {activeTab === 'constantes' ? (
            <div className="space-y-4">
              {/* Sélecteurs */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {(Object.keys(CONSTANTE_CONFIG) as ConstanteKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedConstante(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedConstante === key
                          ? 'bg-[#1e2d6b] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {CONSTANTE_CONFIG[key].label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {(Object.keys(RANGE_LABELS) as VitalSignRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRange(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedRange === r
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {RANGE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphique */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">
                    {CONSTANTE_CONFIG[selectedConstante].label}
                    <span className="font-normal text-slate-400 ml-1">({CONSTANTE_CONFIG[selectedConstante].unit})</span>
                  </h2>
                </div>

                {vsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e2d6b]" />
                  </div>
                ) : (
                  <VitalSignsChart
                    dataPoints={
                      vitalSigns
                        .filter((vs) => vs[CONSTANTE_CONFIG[selectedConstante].field] !== null)
                        .map((vs): VitalSignPoint => ({
                          value: vs[CONSTANTE_CONFIG[selectedConstante].field] as number,
                          date: new Date(vs.measuredAt),
                        }))
                    }
                    unit={CONSTANTE_CONFIG[selectedConstante].unit}
                    normalRange={CONSTANTE_CONFIG[selectedConstante].normalRange}
                    alertRange={CONSTANTE_CONFIG[selectedConstante].alertRange}
                  />
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informations personnelles */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                  <User className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">Informations personnelles</h2>
                </div>
                <div className="px-6 py-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prénom</label>
                    <input
                      {...register('firstName')}
                      disabled={isDoctor}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
                    <input
                      {...register('lastName')}
                      disabled={isDoctor}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Téléphone
                      </span>
                    </label>
                    <input
                      {...register('phone')}
                      disabled={isDoctor}
                      placeholder="—"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse et GPS */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">Adresse et géolocalisation</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
                    <Controller
                      control={control}
                      name="address"
                      render={({ field }) => (
                        <AddressAutocomplete
                          value={field.value ?? ''}
                          onChange={(v) => { field.onChange(v); setAddressCoords(null); }}
                          onCoordinates={setAddressCoords}
                          disabled={isDoctor}
                          hasError={!!errors.address}
                        />
                      )}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  {patient.latitude === null && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Ce patient n&apos;est pas encore géolocalisé. La géolocalisation sera mise à jour
                        automatiquement lors de la prochaine modification d&apos;adresse.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Médecin traitant */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">Médecin traitant</h2>
                </div>
                <div className="px-6 py-5">
                  <input
                    {...register('treatingDoctor')}
                    disabled={isDoctor}
                    placeholder="Dr. Nom"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Notifications */}
              {saveSuccess && !saveError && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700 font-medium">Fiche patient mise à jour avec succès.</p>
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700">{saveError}</p>
                </div>
              )}

              {/* Actions */}
              {!isDoctor && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Zone actions dangereuses */}
          {!isDoctor && (
            <div className="border border-red-200 rounded-xl bg-red-50/50 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Attention !
              </h3>
              <p className="text-xs text-red-600 mb-4">
                Ces actions sont irréversibles ou difficiles à annuler. Procédez avec précaution.
              </p>
              <div className="flex flex-wrap gap-3">
                {patient.status === 'active' && (
                  <button
                    onClick={() => setShowArchiveDialog(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-orange-700 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    Archiver ce patient
                  </button>
                )}
                <button
                  onClick={() => { setRetentionWarning(false); setShowDeleteDialog(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer définitivement
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {showArchiveDialog && patient && (
        <ArchiveConfirmDialog
          patientName={`${patient.firstName} ${patient.lastName}`}
          onConfirm={handleArchive}
          onClose={() => setShowArchiveDialog(false)}
          isLoading={actionLoading}
        />
      )}

      {showDeleteDialog && patient && (
        <DeleteConfirmDialog
          patient={patient}
          onConfirm={handleDelete}
          onClose={() => { setShowDeleteDialog(false); setRetentionWarning(false); }}
          isLoading={actionLoading}
          retentionWarning={retentionWarning}
        />
      )}
    </div>
  );
}
