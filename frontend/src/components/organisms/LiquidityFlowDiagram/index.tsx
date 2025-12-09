import { ArrowLeft, ArrowRight, Equal, HelpCircle, Minus } from "lucide-react";
import type { NetworkStats } from "../../../types";
import Tooltip from "../../atoms/Tooltip";

interface LiquidityFlowDiagramProps {
  stats: NetworkStats;
}

const LiquidityFlowDiagram: React.FC<LiquidityFlowDiagramProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bitcoin ↔ Ark Network Stats</h2>
        <Tooltip content="This shows how Bitcoin flows into and out of the Ark Network. Network liquidity is calculated as the difference between onboarding and offboarding volumes.">
          <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
        </Tooltip>
      </div>

      {/* Visual Flow Representation */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Onboarding */}
        <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 relative">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 uppercase">Onboarding Volume</span>
            <Tooltip content="Amount of Bitcoin being locked into the Ark Network">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {stats.onboardingVolume.toFixed(3)} BTC
          </div>
          <div className="text-sm text-green-700 mt-1">Bitcoin entering network</div>
        </div>

        {/* Minus Sign */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Minus className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        {/* Offboarding */}
        <div className="flex-1 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeft className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600 uppercase">Off Boarding Volume</span>
            <Tooltip content="Amount of Bitcoin being withdrawn from the Ark Network">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {stats.offboardingVolume.toFixed(3)} BTC
          </div>
          <div className="text-sm text-red-700 mt-1">Bitcoin leaving network</div>
        </div>

        {/* Equals Sign */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Equal className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        {/* Network Liquidity */}
        <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-1.5 bg-orange-600 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600 uppercase">Ark Network Liquidity</span>
            <Tooltip content="Net Bitcoin locked in the Ark Network. This is the total available liquidity for transactions.">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {stats.networkLiquidity.toFixed(3)} BTC
          </div>
          <div className="text-sm text-gray-600 mt-1">Net liquidity in network</div>
        </div>
      </div>
    </div>
  );
};


export default LiquidityFlowDiagram;