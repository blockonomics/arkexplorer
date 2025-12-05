import React, { type JSX } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon | (() => JSX.Element);
  label: string;
  value: string | number;
  valueColor?: string;
}

export function StatCard({ icon: Icon, label, value, valueColor = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0">
        <Icon className="w-10 h-10 text-gray-600" strokeWidth={2} />
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className={`text-2xl font-bold ${valueColor}`}>
          {value}
        </div>
      </div>
    </div>
  );
}