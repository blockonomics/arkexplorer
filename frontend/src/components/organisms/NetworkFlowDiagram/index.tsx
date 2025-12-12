import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import type { NetworkStats } from "../../../types";
import Tooltip from "../../atoms/Tooltip";

interface NetworkFlowDiagramProps {
  stats: NetworkStats;
}

const formatBTC = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);

const NetworkFlowDiagram: React.FC<NetworkFlowDiagramProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Network Flow</h2>
        <Tooltip content="Bitcoin flows into and out of the Ark Network through onboarding and offboarding.">
          <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
        </Tooltip>
      </div>

      {/* Flow Representation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Onboarding */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-600 uppercase">Onboarding</span>
            <Tooltip content="Bitcoin locked into the Ark Network">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600 break-all">
            {formatBTC(stats.onboardingVolume)} BTC
          </div>
          <div className="text-xs sm:text-sm text-green-700 mt-1">Bitcoin entering</div>
        </div>

        {/* Offboarding */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-6 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-600 uppercase">Offboarding</span>
            <Tooltip content="Bitcoin withdrawn from the Ark Network">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-600 break-all">
            {formatBTC(stats.offboardingVolume)} BTC
          </div>
          <div className="text-xs sm:text-sm text-red-700 mt-1">Bitcoin leaving</div>
        </div>
      </div>

      {/* Virtual Transactions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase mb-1">Virtual Tx Count</div>
          <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.virtualTxCount}</div>
          <div className="text-xs text-gray-500">Transactions in {stats.timeframe}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase mb-1">Virtual Tx Volume</div>
          <div className="text-lg sm:text-xl font-bold text-blue-600 break-all">{formatBTC(stats.virtualTxVolume)} BTC</div>
          <div className="text-xs text-gray-500">Total volume in {stats.timeframe}</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkFlowDiagram;