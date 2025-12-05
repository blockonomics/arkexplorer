import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Hash, Banknote } from 'lucide-react';
import { TimeframeTabs } from './components/organisms/TimeframTabs';
import { StatsSection } from './components/organisms/StatsSection';
import { SearchBar } from './components/molecules/SearchBar';
import { TransactionList } from './components/organisms/TransactionList';

function App() {
  const [timeframe, setTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');

  const networkStats = [
    {
      icon: ArrowRight,
      label: 'OnBoarding Volume',
      value: '2.231 BTC',
      valueColor: 'text-green-600'
    },
    {
      icon: ArrowLeft,
      label: 'Off Boarding Volume',
      value: '1.2 BTC',
      valueColor: 'text-red-600'
    },
    {
      icon: () => <div className="w-10 h-1 bg-gray-600 rounded-full"></div>,
      label: 'Ark Network Liquidity',
      value: '1.031 BTC',
      valueColor: 'text-orange-500'
    }
  ];

  const txStats = [
    {
      icon: Hash,
      label: 'Number of Transactions',
      value: 225
    },
    {
      icon: Banknote,
      label: 'Transaction Volume',
      value: '12 BTC'
    }
  ];

  const recentTxs = [
    '88f30eb415cc3bc00b5d7a60590ad7e430bf6d70c4df97e166b3588c4d944b54',
    '12039120391029310011019203912019203910239a091023910210b09120390121'
  ];

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