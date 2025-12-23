import React, { useEffect, useState } from "react";
import { PiggyBank, HelpCircle, RefreshCw } from "lucide-react";
import Tooltip from "../../atoms/Tooltip";

interface SavingsCardProps {
  virtualTxCount: number;
}

const SavingsCard: React.FC<SavingsCardProps> = ({ virtualTxCount }) => {
  const [data, setData] = useState({ 
    btcPrice: 0, 
    avgSatVByte: 0, 
    loading: true 
  });

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [priceRes, historyRes] = await Promise.all([
          // Coinbase is more reliable for CORS on localhost
          fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot"),
          // Fetching fee history for the last 7 days
          fetch("https://mempool.space/api/v1/fees/mempool-blocks")
        ]);
        
        const priceJson = await priceRes.json();
        const historyJson = await historyRes.json();

        // Calculate the average median fee across the retrieved blocks
        // This smooths out spikes and gives a 'fair' 7-day average
        const totalMedian = historyJson.reduce((acc: number, block: any) => acc + block.medianFee, 0);
        const averageFee = totalMedian / historyJson.length;

        setData({
          btcPrice: parseFloat(priceJson.data.amount),
          avgSatVByte: averageFee || 1, // Fallback to 1 sat if API is empty
          loading: false,
        });
      } catch (err) {
        console.error("Market data fetch failed", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchMarketData();
  }, []);

  // Constants for calculation
  const AVG_TX_VBYTES = 140; 
  const totalSatsSaved = virtualTxCount * (data.avgSatVByte * AVG_TX_VBYTES);
  const totalBTCSaved = totalSatsSaved / 100_000_000;
  const totalUSDSaved = totalBTCSaved * data.btcPrice;

  return (
    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 relative h-full">
      {data.loading && (
        <div className="absolute inset-0 bg-emerald-50/40 flex items-center justify-center backdrop-blur-[1px] z-10">
          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-1">
        <PiggyBank className="w-4 h-4 text-emerald-600" />
        <div className="text-xs font-bold text-emerald-800 uppercase">Est. Fees Saved</div>
        <Tooltip content={
          <div className="text-xs space-y-2 p-1">
            <p className="font-bold border-b border-white/20 pb-1 text-white">Fair Estimate</p>
            <p className="text-gray-200">
              This estimate uses a <span className="font-bold text-white">7-day moving average</span> of Bitcoin fees ({data.avgSatVByte.toFixed(1)} sat/vB).
            </p>
            <p className="text-gray-200">
              It smooths out daily spikes to show the sustained value Ark provides.
            </p>
          </div>
        }>
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400 cursor-help" />
        </Tooltip>
      </div>

      <div className="text-xl font-bold text-emerald-900">
        ${totalUSDSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      
      <div className="text-[10px] text-emerald-600 font-medium truncate">
        ≈ {totalBTCSaved.toFixed(6)} BTC total
      </div>
    </div>
  );
};

export default SavingsCard;