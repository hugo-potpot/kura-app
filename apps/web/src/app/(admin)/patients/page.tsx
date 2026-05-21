'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '@/components/ui/date-picker';
import {
  UserPlus,
  Upload,
  Search,
  Filter,
  FileText,
  Users,
  X,
  Download,
  AlertCircle,
  UserCheck,
  Archive,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { AddressAutocomplete, type AddressCoords } from '@/components/ui/address-autocomplete';
import { highlightText } from '@/components/highlight-text';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  treatingDoctor: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  assignedIdelId: string | null;
  assignedIdelName: string | null;
  lastTransmissionAt: string | null;
  status: string;
  updatedAt: string;
  careTypes?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  disabled: boolean | null;
}

const CARE_TYPES = ['Pansement', 'Injection', 'Diabète', 'Suivi'] as const;
type CareType = (typeof CARE_TYPES)[number];

const CARE_TAG_COLORS: Record<CareType, string> = {
  Pansement: 'bg-teal-100 text-teal-700',
  Injection: 'bg-indigo-100 text-indigo-700',
  Diabète: 'bg-purple-100 text-purple-700',
  Suivi: 'bg-blue-100 text-blue-700',
};

const addPatientSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  address: z.string().min(1, 'Adresse requise'),
  treatingDoctor: z.string().min(1, 'Médecin traitant requis'),
  careTypes: z.array(z.string()).optional(),
});

type AddPatientFormData = z.infer<typeof addPatientSchema>;

type FilterTab = 'Tous' | 'Actifs' | 'Archivés';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active' || status === 'Actif';
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

function CareTag({ type }: { type: string }) {
  const colorClass = CARE_TAG_COLORS[type as CareType] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {type}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
      <td className="px-6 py-4"><div className="flex gap-1"><div className="h-5 bg-slate-200 rounded-full w-16" /><div className="h-5 bg-slate-200 rounded-full w-14" /></div></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded-full w-14" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
    </tr>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-semibold text-base">Aucun patient pour le moment</p>
            <p className="text-slate-500 text-sm mt-1">
              Commencez par ajouter votre premier patient ou importez un fichier CSV.
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter le premier patient
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddPatientModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [addressCoords, setAddressCoords] = useState<AddressCoords | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddPatientFormData>({
    resolver: zodResolver(addPatientSchema),
    defaultValues: { careTypes: [] },
  });

  const addressValue = watch('address') ?? '';
  const selectedCareTypes = watch('careTypes') ?? [];

  function toggleCareType(type: string) {
    if (selectedCareTypes.includes(type)) {
      setValue('careTypes', selectedCareTypes.filter((t) => t !== type));
    } else {
      setValue('careTypes', [...selectedCareTypes, type]);
    }
  }

  async function onSubmit(data: AddPatientFormData) {
    try {
      const res = await fetch('/api/v1/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...(addressCoords ? { latitude: addressCoords.lat, longitude: addressCoords.lng } : {}),
        }),
      });
      if (!res.ok) return;
      reset();
      setAddressCoords(null);
      onSuccess();
      onClose();
    } catch {
    }
  }

  function handleClose() {
    reset();
    setAddressCoords(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Nouveau Patient</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input
                  {...register('firstName')}
                  placeholder="Marie"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input
                  {...register('lastName')}
                  placeholder="Dupont"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="JJ/MM/AAAA"
                  />
                )}
              />
              {errors.birthDate && (
                <p className="text-xs text-red-500 mt-1">{errors.birthDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
              <Controller
                control={control}
                name="address"
                render={({ field }) => (
                  <AddressAutocomplete
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onCoordinates={setAddressCoords}
                    hasError={!!errors.address}
                  />
                )}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Médecin traitant</label>
              <input
                {...register('treatingDoctor')}
                placeholder="Dr. Martin"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
              />
              {errors.treatingDoctor && (
                <p className="text-xs text-red-500 mt-1">{errors.treatingDoctor.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type de soins</label>
              <div className="flex flex-wrap gap-2">
                {CARE_TYPES.map((type) => {
                  const isSelected = selectedCareTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCareType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400 hover:text-teal-600'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ajout en cours…' : 'Ajouter le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportCsvModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleImport() {
    if (!selectedFile) return;
    setIsImporting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsImporting(false);
    setSelectedFile(null);
    onClose();
  }

  function handleClose() {
    setSelectedFile(null);
    setIsDragging(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Importer des Patients</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              isDragging
                ? 'border-teal-500 bg-teal-50'
                : selectedFile
                ? 'border-teal-400 bg-teal-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <>
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-teal-700">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">ou cliquez pour parcourir</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-600">Format attendu</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                prénom, nom, date_naissance, adresse, medecin, soins
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isImporting ? 'Importation…' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignIdelModal({
  open,
  patient,
  onClose,
  onSuccess,
}: {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [idels, setIdels] = useState<TeamMember[]>([]);
  const [selectedIdelId, setSelectedIdelId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function loadIdels() {
      try {
        const res = await fetch('/api/v1/team');
        if (!res.ok) return;
        const json = await res.json() as { data?: { members?: TeamMember[] } };
        const members = json.data?.members ?? [];
        setIdels(members.filter((m) => m.role === 'idel' && !m.disabled));
      } catch {
        /* ignore */
      }
    }
    setSelectedIdelId(patient?.assignedIdelId ?? null);
    void loadIdels();
  }, [open, patient]);

  async function handleConfirm() {
    if (!patient) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/v1/patients/${patient.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idelId: selectedIdelId }),
      });
      onSuccess();
      onClose();
    } catch {
      /* ignore */
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Assigner un IDEL</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-600">
            Patient : <span className="font-medium">{patient.firstName} {patient.lastName}</span>
          </p>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedIdelId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${
                selectedIdelId === null
                  ? 'border-[#1e2d6b] bg-indigo-50 text-[#1e2d6b]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Non assigné
            </button>
            {idels.map((idel) => (
              <button
                key={idel.id}
                onClick={() => setSelectedIdelId(idel.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${
                  selectedIdelId === idel.id
                    ? 'border-[#1e2d6b] bg-indigo-50 text-[#1e2d6b]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <UserCheck className="w-4 h-4 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">{idel.name}</p>
                  <p className="text-xs text-slate-400">{idel.email}</p>
                </div>
              </button>
            ))}
          </div>

          {idels.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              Aucun IDEL disponible dans cette structure.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Tous');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Patient | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [retentionWarning, setRetentionWarning] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/patients');
      if (res.ok) {
        const json = await res.json() as { data?: { patients?: Patient[] } };
        setPatients(json.data?.patients ?? []);
      } else {
        setPatients([]);
      }
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  async function handleArchivePatient(patientId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/patients/${patientId}/archive`, { method: 'PATCH' });
      if (res.ok) {
        await fetchPatients();
      }
    } finally {
      setActionLoading(false);
      setArchiveTarget(null);
    }
  }

  async function handleDeletePatient(patientId: string, force: boolean) {
    setActionLoading(true);
    setRetentionWarning(false);
    try {
      const url = `/api/v1/patients/${patientId}${force ? '?force=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.status === 204) {
        await fetchPatients();
        setDeleteTarget(null);
      } else if (res.status === 409) {
        const err = await res.json() as { error?: { code?: string } };
        if (err.error?.code === 'RETENTION_WARNING') {
          setRetentionWarning(true);
          return;
        }
      }
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      search.trim().length < 2 ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.treatingDoctor ?? '').toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'Tous' ||
      (activeFilter === 'Actifs' && (p.status === 'active' || p.status === 'Actif')) ||
      (activeFilter === 'Archivés' && p.status !== 'active' && p.status !== 'Actif');

    return matchesSearch && matchesFilter;
  });

  const activeCount = patients.filter(
    (p) => p.status === 'active' || p.status === 'Actif',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <span>Application</span>
          <span>/</span>
          <span className="text-slate-700 font-medium">Registre des Patients</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Registre des Patients</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gérez les dossiers médicaux, les transmissions et les attributions d&apos;infirmiers pour votre cabinet.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importer CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1e2d6b] rounded-lg hover:bg-[#162255] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Nouveau Patient
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Patients</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{patients.length}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          {patients.length > 0 && (
            <p className="text-xs text-teal-600 font-medium mt-3 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500" />
              {activeCount} actifs
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Visites Aujourd&apos;hui</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-3">Aucune visite planifiée</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un patient..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            {(['Tous', 'Actifs', 'Archivés'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFilter === tab
                    ? 'bg-[#1e2d6b] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  IDEL assigné
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dernière transmission
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                search.trim() ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">Aucun patient trouvé</p>
                        <p className="text-xs text-slate-400">Aucun résultat pour &quot;{search}&quot;</p>
                        <button
                          onClick={() => setSearch('')}
                          className="mt-1 text-xs text-teal-600 underline hover:text-teal-800"
                        >
                          Effacer la recherche
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <EmptyState onAdd={() => setShowAddModal(true)} />
                )
              ) : (
                filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-teal-700">
                            {getInitials(patient.firstName, patient.lastName)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {highlightText(`${patient.firstName} ${patient.lastName}`, search)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px]">
                      <span className="truncate block">
                        {patient.address ? highlightText(patient.address, search) : '—'}
                      </span>
                      {patient.latitude === null && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Non géolocalisé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setAssignTarget(patient)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          patient.assignedIdelId
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        {patient.assignedIdelName ?? (patient.assignedIdelId ? 'Assigné' : 'Non assigné')}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {patient.lastTransmissionAt ? formatDate(patient.lastTransmissionAt) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === patient.id ? null : patient.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === patient.id && (
                          <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                            {patient.status === 'active' && (
                              <button
                                onClick={() => { setArchiveTarget(patient); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                Archiver
                              </button>
                            )}
                            <button
                              onClick={() => { setRetentionWarning(false); setDeleteTarget(patient); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {filtered.length} patient{filtered.length > 1 ? 's' : ''} affiché
              {filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <AddPatientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPatients}
      />
      <ImportCsvModal open={showImportModal} onClose={() => setShowImportModal(false)} />
      <AssignIdelModal
        open={assignTarget !== null}
        patient={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSuccess={fetchPatients}
      />

      {/* Archive dialog */}
      {archiveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setArchiveTarget(null)}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Archiver ce patient ?</h2>
                <p className="text-xs text-slate-500">{archiveTarget.firstName} {archiveTarget.lastName}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Le patient sera retiré du planning actif. Son dossier restera accessible en lecture depuis la liste &quot;Archivés&quot;.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArchiveTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleArchivePatient(archiveTarget.id)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-60"
              >
                {actionLoading ? 'Archivage…' : "Confirmer l'archivage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (() => {
        const expectedName = `${deleteTarget.firstName} ${deleteTarget.lastName}`;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && !retentionWarning && setDeleteTarget(null)}
          >
            {retentionWarning ? (
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Avertissement RGPD</h2>
                </div>
                <p className="text-sm text-slate-700">
                  <strong>Attention :</strong> La réglementation impose une conservation de 10 ans. Ce patient a des transmissions récentes.
                </p>
                <button
                  onClick={() => { setDeleteTarget(null); setRetentionWarning(false); if (deleteTarget.status === 'active') setArchiveTarget(deleteTarget); }}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
                >
                  Archiver plutôt (recommandé)
                </button>
                <button
                  onClick={() => void handleDeletePatient(deleteTarget.id, true)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-60"
                >
                  {actionLoading ? 'Suppression…' : 'Supprimer quand même'}
                </button>
              </div>
            ) : (
              <DeleteInputDialog
                expectedName={expectedName}
                onConfirm={() => void handleDeletePatient(deleteTarget.id, false)}
                onClose={() => setDeleteTarget(null)}
                isLoading={actionLoading}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}

function DeleteInputDialog({
  expectedName,
  onConfirm,
  onClose,
  isLoading,
}: {
  expectedName: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [inputName, setInputName] = useState('');
  const isMatch = inputName.trim().toLowerCase() === expectedName.toLowerCase();
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-red-700">Suppression définitive</h2>
          <p className="text-xs text-slate-500">{expectedName}</p>
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
        <strong>Cette action est irréversible</strong> — toutes les données et transmissions seront supprimées.
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Tapez <span className="font-bold text-slate-900">{expectedName}</span> pour confirmer
        </label>
        <input
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder={expectedName}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
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
          onClick={onConfirm}
          disabled={!isMatch || isLoading}
          className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </div>
    </div>
  );
}
