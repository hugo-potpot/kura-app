import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  badge?: string;
  accentColor: string; // Tailwind border color class e.g. 'border-teal-500'
  iconBgColor: string; // Tailwind bg class e.g. 'bg-teal-100'
  iconColor: string;   // Tailwind text class e.g. 'text-teal-600'
}

export function StatCard({ icon: Icon, value, label, badge, accentColor, iconBgColor, iconColor }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 border-l-4 ${accentColor}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {badge && (
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}
