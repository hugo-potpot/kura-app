import { Eye, Pencil, UserPlus } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';

export interface RecentPatient {
  id: string;
  fullName: string;
  treatingDoctor: string | null;
  lastTransmissionAt: Date | null;
  lastTransmissionAuthor: string | null;
  status: 'active' | 'archived';
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Aucune transmission';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const STATUS_CONFIG = {
  active: { label: 'Actif', className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200' },
};

interface RecentPatientsTableProps {
  patients: RecentPatient[];
}

export function RecentPatientsTable({ patients }: RecentPatientsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Patients récents</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dernières mises à jour des dossiers de soins</p>
        </div>
        <a
          href="/patients/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          aria-label="Créer un nouveau patient"
        >
          <UserPlus className="w-4 h-4" />
          Nouveau Patient
        </a>
      </div>

      {/* Table */}
      {patients.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-gray-400">
          Aucun patient enregistré pour le moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-6 py-3">Patient</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 py-3">Médecin référent</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 py-3">Dernière transmission</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-400 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map((patient) => {
                const statusConfig = STATUS_CONFIG[patient.status];
                return (
                  <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PatientAvatar name={patient.fullName} />
                        <span className="text-sm font-semibold text-gray-900">{patient.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {patient.treatingDoctor ?? <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500">{formatRelativeTime(patient.lastTransmissionAt)}</div>
                      {patient.lastTransmissionAuthor && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PatientAvatar name={patient.lastTransmissionAuthor} size="sm" />
                          <span className="text-xs text-gray-400">{patient.lastTransmissionAuthor}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/patients/${patient.id}`}
                          aria-label={`Voir le dossier de ${patient.fullName}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={`/patients/${patient.id}/edit`}
                          aria-label={`Modifier le dossier de ${patient.fullName}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 text-center">
        <a href="/patients" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          Voir tous les patients →
        </a>
      </div>
    </div>
  );
}
