import React, { useState, useEffect } from 'react';
import { TimeframeTabs } from './components/organisms/TimeframeTabs';
import { SearchBar } from './components/molecules/SearchBar';
import { TransactionList } from './components/organisms/TransactionList';
import type { NetworkStats, VTXO } from './types';
import NetworkFlowDiagram from './components/organisms/NetworkFlowDiagram';
import { SearchResults } from './components/molecules/SearchResults';

function App() {
  const [timeframe, setTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VTXO[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [recentTxs, setRecentTxs] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:5173/api/recent-transactions')
      .then(res => res.json())
      .then((data: VTXO[]) => setRecentTxs(data.map(vtxo => vtxo.txid)))
      .catch(err => console.error('Error fetching transactions:', err));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:5173/api/stats?timeframe=${encodeURIComponent(timeframe)}`)
      .then(res => res.json())
      .then((data: NetworkStats) => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  },[timeframe]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `http://localhost:5173/api/search?txid=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await response.json();
      setSearchResults(data || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'An error occurred');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

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
          <NetworkFlowDiagram stats={stats} />

          <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />

          {hasSearched && (
            <SearchResults
              results={searchResults}
              loading={searchLoading}
              error={searchError}
              searchQuery={searchQuery}
            />
          )}

          <TransactionList transactions={recentTxs} />
        </div>
      </div>
    </div>
  );
}

export default App;