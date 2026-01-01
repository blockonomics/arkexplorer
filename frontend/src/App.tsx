import React, { useState, useEffect } from 'react';
import { TimeframeTabs } from './components/organisms/TimeframeTabs';
import { SearchBar } from './components/molecules/SearchBar';
import { TransactionList } from './components/organisms/TransactionList';
import type { NetworkStats, VTXO } from './types';
import NetworkFlowDiagram from './components/organisms/NetworkFlowDiagram';
import { SearchResults } from './components/molecules/SearchResults';
import { Footer } from './components/molecules/Footer';
import NetworkTrendsChart from './components/organisms/NetworkTrendsChart';

function App() {
  const [timeframe, setTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VTXO[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [trends, setTrends] = useState<NetworkStats[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [recentTxs, setRecentTxs] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/recent-transactions`)
      .then(res => res.json())
      .then((data: string[]) => setRecentTxs(data))
      .catch(err => console.error('Error fetching transactions:', err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch(`/api/stats?timeframe=${timeframe}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const trendsRes = await fetch(`/api/trends?timeframe=${timeframe}`);
        const trendsData = await trendsRes.json();
        
        if (Array.isArray(trendsData)) {
          setTrends(trendsData);
        } else {
          setTrends([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setTrends([]);
      }
    };

    fetchData();
  }, [timeframe]);
  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleTransactionClick = (txId: string) => {
    setSearchQuery(txId);
    handleSearch(txId);
  };

  const handleSearch = async (query?: string) => {
    // If query is an Event object (from the button click), ignore it and use state
    const searchTerm = typeof query === 'string' ? query : searchQuery;

    // Simple check: if empty or only spaces, stop here
    if (!searchTerm?.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?txid=${encodeURIComponent(searchTerm.trim())}`);

      if (!response.ok) throw new Error('Transaction not found');

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
          <NetworkTrendsChart trends={trends || []} />

          <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />

        {hasSearched && (
          <SearchResults
            results={searchResults}
            loading={searchLoading}
            error={searchError}
            searchQuery={searchQuery}
          />
        )}

        <TransactionList 
          transactions={recentTxs} 
          onTransactionClick={handleTransactionClick}
        />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;