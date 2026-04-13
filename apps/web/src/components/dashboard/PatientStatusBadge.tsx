type PatientStatus = 'actif' | 'surveillance' | 'interrompu';

const STATUS_CONFIG: Record<PatientStatus, { label: string; className: string }> = {
  actif: { label: 'Actif', className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  surveillance: { label: 'Surveillance', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  interrompu: { label: 'Interrompu', className: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
};

interface PatientStatusBadgeProps {
  status: PatientStatus;
}

export function PatientStatusBadge({ status }: PatientStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
