import React, { type JSX } from 'react';
import type { LucideIcon } from 'lucide-react';
import { StatCard } from '../../molecules/StatCard';

interface Stat {
  icon: LucideIcon | (() => JSX.Element);
  label: string;
  value: string | number;
  valueColor?: string;
}

interface StatsSectionProps {
  title: string;
  stats: Stat[];
  columns?: number;
}

export function StatsSection({ title, stats, columns = 3 }: StatsSectionProps) {
  const gridCols = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{title}</h2>
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>
    </div>
  );
}