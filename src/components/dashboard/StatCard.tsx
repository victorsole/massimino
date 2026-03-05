import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  unit?: string;
  label: string;
  color: 'yellow' | 'green' | 'pink' | 'cyan';
  meta?: string;
}

const colorMap = {
  yellow: { bg: 'bg-[#E8C547]/15', text: 'text-[#E8C547]', icon: 'bg-[#E8C547]' },
  green: { bg: 'bg-[#4ADE80]/15', text: 'text-[#4ADE80]', icon: 'bg-[#4ADE80]' },
  pink: { bg: 'bg-[#E855A0]/15', text: 'text-[#E855A0]', icon: 'bg-[#E855A0]' },
  cyan: { bg: 'bg-[#22D3EE]/15', text: 'text-[#22D3EE]', icon: 'bg-[#22D3EE]' },
};

export function StatCard({ icon: Icon, value, unit, label, color, meta }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none mb-1 font-sans">
          {value}
          {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
        <p className={`text-xs font-medium ${c.text} truncate`}>{label}</p>
        {meta && <p className="text-[10px] text-gray-400 mt-0.5">{meta}</p>}
      </div>
    </div>
  );
}
