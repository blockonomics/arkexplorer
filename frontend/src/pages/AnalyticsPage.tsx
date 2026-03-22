import React from 'react';
import { TimeframeTabs } from '../components/organisms/TimeframeTabs';
import NetworkTrendsChart from '../components/organisms/NetworkTrendsChart';
import type { TrendPoint } from '../types';

interface AnalyticsPageProps {
  trends: TrendPoint[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

export function AnalyticsPage({ trends, timeframe, onTimeframeChange }: AnalyticsPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Network Analytics</h1>
        <p className="text-gray-600">Historical trends and activity over time</p>
      </div>

      <div className="mb-8">
        <TimeframeTabs active={timeframe} onChange={onTimeframeChange} />
      </div>

      <NetworkTrendsChart trends={trends} />
    </div>
  );
}
