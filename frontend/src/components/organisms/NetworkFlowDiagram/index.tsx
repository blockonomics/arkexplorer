import React from "react";
import { Download, Upload, Activity, Repeat, HelpCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { NetworkStats } from "../../../types";
import Tooltip from "../../atoms/Tooltip";
import SavingsCard from "../../molecules/SavingsCard";
import TimeSavedCard from "../../molecules/TimeSavedCard";
import { formatBTC } from "../../../utils/formatters";

interface NetworkFlowDiagramProps {
  stats: NetworkStats;
}

/**
 * Clean Trend Indicator for Volume and TX Count
 */
const TrendIndicator = ({ value }: { value?: number }) => {
  // Don't show anything if change is 0 or undefined (e.g., 'all time' view)
  if (!value || value === 0) return null;
  
  const isPositive = value > 0;
  
  return (
    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
      isPositive 
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
        : 'bg-rose-50 text-rose-600 border border-rose-100'
    }`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </div>
  );
};

const NetworkFlowDiagram: React.FC<NetworkFlowDiagramProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Network Flow</h2>
        <Tooltip content="Bitcoin flows into and out of the Ark Network through onboarding and offboarding.">
          <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
        </Tooltip>
      </div>

      {/* Main Liquidity Movement (Onboarding/Offboarding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Onboarding */}
        <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Onboarding</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-all tabular-nums">
            {formatBTC(stats.onboardingVolume)} BTC
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Bitcoin entering</div>
        </div>

        {/* Offboarding */}
        <div className="bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Offboarding</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-all tabular-nums">
            {formatBTC(stats.offboardingVolume)} BTC
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Bitcoin leaving</div>
        </div>
      </div>

      {/* Activity and Efficiency Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Transaction Count */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-500" />
            <div className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Tx</div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
            {stats.virtualTxCount.toLocaleString()}
          </div>
          <TrendIndicator value={stats.txCountChange} />
        </div>

        {/* Transaction Volume */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="w-4 h-4 text-slate-500" />
            <div className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Volume</div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
            {formatBTC(stats.virtualTxVolume)} BTC
          </div>
          <TrendIndicator value={stats.volumeChange} />
        </div>

        {/* Savings Card (Internal Logic) */}
        <SavingsCard virtualTxCount={stats.virtualTxCount} />

        {/* Time Saved Card */}
        <TimeSavedCard virtualTxCount={stats.virtualTxCount} />
      </div>
    </div>
  );
};

export default NetworkFlowDiagram;