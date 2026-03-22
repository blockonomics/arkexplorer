import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TrendPoint } from "../../../types";

const NetworkTrendsChart: React.FC<{ trends: TrendPoint[] | null }> = ({ trends }) => {

  const [activeTab, setActiveTab] = React.useState<"volume" | "count" | "flow">("volume");

  const chartData = useMemo(() => {
    if (!trends || !Array.isArray(trends)) return [];
    
    return trends.map(item => {
      const date = new Date(item.displayDate);
      
      // Check if the string contains a space (our hourly format: YYYY-MM-DD HH:00)
      const isHourly = item.displayDate.includes(' ');

      return {
        ...item,
        formattedDate: isHourly 
          ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
          : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  }, [trends]);

  if (trends === null) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-8 w-32 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-[300px] w-full bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-200">
           {/* Visual representation of a chart line to look like a skeleton */}
           <div className="w-full px-8 mt-auto mb-4 flex items-end justify-between gap-2 h-32 animate-pulse">
             {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
               <div key={i} className="bg-gray-200 rounded-t w-full" style={{ height: `${h}%` }}></div>
             ))}
           </div>
           <p className="text-gray-400 text-sm font-medium">Fetching trend data...</p>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[410px]">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Network Growth</h2>
        <div className="h-[300px] w-full bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300">
           <div className="bg-white p-3 rounded-full shadow-sm mb-3">
             <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <p className="text-gray-900 font-medium">No activity in this period</p>
           <p className="text-gray-500 text-sm">Try selecting a longer timeframe.</p>
        </div>
      </div>
    );
  }

  const getBtnClass = (tab: string) => `
    px-3 py-1.5 text-sm rounded-md transition-all duration-200
    ${activeTab === tab 
      ? 'bg-white shadow-sm border border-gray-100 font-bold text-blue-600' 
      : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'}
  `;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Network Activity</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button onClick={() => setActiveTab("volume")} className={getBtnClass("volume")}>TX BTC Volume</button>
          <button onClick={() => setActiveTab("count")} className={getBtnClass("count")}>TX Count</button>
          <button onClick={() => setActiveTab("flow")} className={getBtnClass("flow")}>Liquidity Flow</button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="formattedDate" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />

            {/* View 1: Virtual Volume Only */}
            {activeTab === "volume" && (
              <Area 
                type="monotone" 
                name="Virtual Volume" 
                dataKey="virtualTxVolume" 
                stroke="#7C3AED" 
                fill="#7C3AED" 
                fillOpacity={0.1} 
              />
            )}

            {/* View 2: Transaction Count */}
            {activeTab === "count" && (
              <Area 
                type="monotone" 
                name="Transactions" 
                dataKey="virtualTxCount" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.1} 
              />
            )}

            {/* View 3: Onboarding vs Offboarding (Flow) */}
            {activeTab === "flow" && (
              <>
                <Area 
                  type="monotone" 
                  name="Onboarding" 
                  dataKey="onboardingVolume" 
                  stroke="#2563EB" 
                  fill="#2563EB" 
                  fillOpacity={0.1} 
                />
                <Area 
                  type="monotone" 
                  name="Offboarding" 
                  dataKey="offboardingVolume" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.1} 
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetworkTrendsChart;
