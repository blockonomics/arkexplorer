import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const TrendIndicator = ({ value }: { value?: number }) => {
  if (value === undefined || value === 0) return null;
  const isPositive = value > 0;
  
  return (
    <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${
      isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
    }`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </div>
  );
};

export default TrendIndicator;