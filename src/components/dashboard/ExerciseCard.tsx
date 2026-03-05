import { LucideIcon } from 'lucide-react';

interface ExerciseCardProps {
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  gradient: string;
  badgeColor?: string;
}

export function ExerciseCard({ title, description, duration, icon: Icon, gradient, badgeColor = 'bg-[#E8C547]' }: ExerciseCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Image area */}
      <div className={`relative aspect-[4/3] ${gradient} flex items-center justify-center`}>
        <Icon className="w-12 h-12 text-white/50" />
        <span className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white ${badgeColor}`}>
          {duration}
        </span>
      </div>
      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{title}</h4>
        <p className="text-xs text-gray-400 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
