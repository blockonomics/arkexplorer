import React from "react";
import { Clock, HelpCircle } from "lucide-react";
import Tooltip from "../../atoms/Tooltip";

interface TimeSavedCardProps {
  virtualTxCount: number;
}

const AVG_CONFIRMATION_MINUTES = 10; // 1 on-chain confirmation ≈ 10 min

function formatTimeSaved(totalMinutes: number): { value: string; unit: string } {
  if (totalMinutes < 60) {
    return { value: totalMinutes.toFixed(0), unit: "min" };
  }
  const hours = totalMinutes / 60;
  if (hours < 24) {
    return { value: hours.toFixed(1), unit: "hrs" };
  }
  const days = hours / 24;
  if (days < 365) {
    return { value: days.toFixed(1), unit: "days" };
  }
  const years = days / 365;
  return { value: years.toFixed(2), unit: "yrs" };
}

const TimeSavedCard: React.FC<TimeSavedCardProps> = ({ virtualTxCount }) => {
  const totalMinutes = virtualTxCount * AVG_CONFIRMATION_MINUTES;
  const { value, unit } = formatTimeSaved(totalMinutes);

  return (
    <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 h-full">
      <div className="flex items-center gap-1.5 mb-1">
        <Clock className="w-4 h-4 text-violet-600" />
        <div className="text-xs font-bold text-violet-800 uppercase">Time Saved</div>
        <Tooltip content={
          <div className="text-xs space-y-2 p-1">
            <p className="font-bold border-b border-white/20 pb-1 text-white">How This Is Calculated</p>
            <p className="text-gray-200">
              Each Ark virtual transaction settles in seconds, vs <span className="font-bold text-white">~10 minutes</span> for a single on-chain confirmation.
            </p>
            <p className="text-gray-200">
              Total = virtual tx count × 10 min per avoided confirmation.
            </p>
          </div>
        }>
          <HelpCircle className="w-3.5 h-3.5 text-violet-400 cursor-help" />
        </Tooltip>
      </div>

      <div className="text-xl font-bold text-violet-900 tabular-nums">
        {Number(value).toLocaleString()} <span className="text-base font-semibold">{unit}</span>
      </div>

      <div className="text-[10px] text-violet-600 font-medium truncate">
        vs. 1 on-chain confirmation each
      </div>
    </div>
  );
};

export default TimeSavedCard;
