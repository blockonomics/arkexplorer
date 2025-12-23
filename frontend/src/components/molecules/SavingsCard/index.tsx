import React, { useEffect, useState } from "react";
import { PiggyBank, HelpCircle, RefreshCw } from "lucide-react";
import Tooltip from "../../atoms/Tooltip";

interface SavingsCardProps {
  virtualTxCount: number;
}

const SavingsCard: React.FC<SavingsCardProps> = ({ virtualTxCount }) => {
  const [data, setData] = useState({ btcPrice: 0, satVByte: 0, loading: true });

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [priceRes, feeRes] = await Promise.all([
          // 1. Switched to Coinbase for BTC/USD Price
          fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot"),
          // 2. Mempool.space usually allows CORS, so we keep it
          fetch("https://mempool.space/api/v1/fees/recommended")
        ]);
        
        const priceData = await priceRes.json();
        const feeJson = await feeRes.json();

        setData({
          // Coinbase returns data as { data: { amount: "..." } }
          btcPrice: parseFloat(priceData.data.amount),
          satVByte: feeJson.hourFee,
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
  const totalSatsSaved = virtualTxCount * (data.satVByte * AVG_TX_VBYTES);
  const totalBTCSaved = totalSatsSaved / 100_000_000;
  const totalUSDSaved = totalBTCSaved * data.btcPrice;

  const formatUSD = (val: number) => 
    val.toLocaleString(undefined, { style: "currency", currency: "USD" });

  return (
    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 relative overflow h-full">
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
            <p className="font-bold border-b border-white/20 pb-1">Efficiency Math</p>
            <p>Ark transactions happen off-chain. On-chain, {virtualTxCount} transfers would cost roughly {data.satVByte} sat/vB.</p>
            <p className="opacity-80">Based on {data.btcPrice > 0 ? formatUSD(data.btcPrice) : '...'} / BTC</p>
          </div>
        }>
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400 cursor-help" />
        </Tooltip>
      </div>

      <div className="text-xl font-bold text-emerald-900">
        ${totalUSDSaved.toFixed(2)}
      </div>
      
      <div className="text-[10px] text-emerald-600 font-medium truncate">
        ≈ {totalBTCSaved.toFixed(6)} BTC total
      </div>
    </div>
  );
};

export default SavingsCard;