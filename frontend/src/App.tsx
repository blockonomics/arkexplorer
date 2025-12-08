import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Hash, Banknote } from 'lucide-react';
import { TimeframeTabs } from './components/organisms/TimeframeTabs';
import { StatsSection } from './components/organisms/StatsSection';
import { SearchBar } from './components/molecules/SearchBar';
import { TransactionList } from './components/organisms/TransactionList';

interface NetworkStats {
  onboardingVolume: number;
  offboardingVolume: number;
  networkLiquidity: number;
  virtualTxCount: number;
}

interface VTXO {
  txid: string;
  vout: number;
  amount: number;
  createdAt: number;
}

function App() {
  const [timeframe, setTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [recentTxs, setRecentTxs] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:5173/api/stats')
      .then(res => res.json())
      .then((data: NetworkStats) => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));

    fetch('http://localhost:5173/api/recent-transactions')
      .then(res => res.json())
      .then((data: VTXO[]) => setRecentTxs(data.map(vtxo => vtxo.txid)))
      .catch(err => console.error('Error fetching transactions:', err));
  }, []);

  const networkStats = stats ? [
    {
      icon: ArrowRight,
      label: 'OnBoarding Volume',
      value: `${stats.onboardingVolume.toFixed(3)} BTC`,
      valueColor: 'text-green-600'
    },
    {
      icon: ArrowLeft,
      label: 'Off Boarding Volume',
      value: `${stats.offboardingVolume.toFixed(3)} BTC`,
      valueColor: 'text-red-600'
    },
    {
      icon: () => <div className="w-10 h-1 bg-gray-600 rounded-full"></div>,
      label: 'Ark Network Liquidity',
      value: `${stats.networkLiquidity.toFixed(3)} BTC`,
      valueColor: 'text-orange-500'
    }
  ] : [];

  const txStats = stats ? [
    {
      icon: Hash,
      label: 'Number of Transactions',
      value: stats.virtualTxCount
    },
    {
      icon: Banknote,
      label: 'Transaction Volume',
      value: '12 BTC'
    }
  ] : [];

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ark Explorer</h1>
          <p className="text-gray-600">Bitcoin Layer 2 Network Statistics</p>
        </div>

        <div className="mb-8">
          <TimeframeTabs active={timeframe} onChange={setTimeframe} />
        </div>

        <div className="space-y-6">
          <StatsSection
            title="Bitcoin ↔ Ark Network Stats"
            stats={networkStats}
            columns={3}
          />

          <StatsSection
            title="Virtual Transaction Stats"
            stats={txStats}
            columns={2}
          />

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <TransactionList transactions={recentTxs} />
        </div>
      </div>
    </div>
  );
}

export default App;