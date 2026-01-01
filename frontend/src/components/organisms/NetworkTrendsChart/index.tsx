import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const NetworkTrendsChart: React.FC<{ trends: any[] | null }> = ({ trends }) => {
  const [activeTab, setActiveTab] = React.useState<"volume" | "count">("volume");

  const chartData = useMemo(() => {
    if (!trends || !Array.isArray(trends)) return [];
    return trends.map(item => ({
      ...item,
      formattedDate: item.displayDate 
        ? new Date(item.displayDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '---'
    }));
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


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Network Growth</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            type="button"
            onClick={() => setActiveTab("volume")}
            className={`px-3 py-1 text-sm rounded transition-all ${activeTab === 'volume' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
          >Volume</button>
          <button 
            type="button"
            onClick={() => setActiveTab("count")}
            className={`px-3 py-1 text-sm rounded transition-all ${activeTab === 'count' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
          >TX Count</button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="formattedDate" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              minTickGap={30}
            />
            <YAxis 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => activeTab === 'volume' ? `${val.toFixed(2)}` : val}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => [
                activeTab === 'volume' ? `${Number(value).toFixed(4)} BTC` : value, 
                activeTab === 'volume' ? 'Volume' : 'Transactions'
              ]}
            />
            <Legend iconType="circle" />
            
            {activeTab === "volume" ? (
              <>
                <Area name="Virtual Vol" dataKey="virtualTxVolume" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} strokeWidth={2} />
                <Area name="Onboard Vol" dataKey="onboardingVolume" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} strokeWidth={2} />
              </>
            ) : (
              <Area name="Virtual Txs" dataKey="virtualTxCount" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetworkTrendsChart;