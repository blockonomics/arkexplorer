import React, { useState, useEffect } from 'react';
import { TimeframeTabs } from './components/organisms/TimeframeTabs';
import { SearchBar } from './components/molecules/SearchBar';
import { TransactionList } from './components/organisms/TransactionList';
import type { NetworkStats, VTXO, TrendPoint } from './types';
import NetworkFlowDiagram from './components/organisms/NetworkFlowDiagram';
import { SearchResults } from './components/molecules/SearchResults';
import { Footer } from './components/molecules/Footer';
import { Navbar } from './components/organisms/Navbar';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

function getPage() {
  return window.location.hash.slice(1) || 'home';
}

function App() {
  const [activePage, setActivePage] = useState(getPage);
  const [timeframe, setTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VTXO[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [recentTxs, setRecentTxs] = useState<{ txid: string; createdAt: number; txType: string }[]>([]);

  useEffect(() => {
    const onHashChange = () => setActivePage(getPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (page: string) => {
    window.location.hash = page;
    setActivePage(page);
  };

  useEffect(() => {
    fetch(`/api/recent-transactions`)
      .then(res => res.json())
      .then((data) => setRecentTxs(data))
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

  const handleTransactionClick = (txId: string) => {
    setSearchQuery(txId);
    handleSearch(txId);
    navigate('home');
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = typeof query === 'string' ? query : searchQuery;

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

  const isStaticPage = activePage === 'privacy' || activePage === 'terms';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar activePage={activePage} onNavigate={navigate} />

      <div className="flex-1">
        {activePage === 'privacy' && <PrivacyPage />}
        {activePage === 'terms' && <TermsPage />}
        {activePage === 'analytics' && (
          <AnalyticsPage
            trends={trends}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        )}

        {!isStaticPage && activePage !== 'analytics' && (
          <>
            {!stats ? (
              <div className="flex-1 flex items-center justify-center py-32">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
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

                  <TransactionList
                    transactions={recentTxs}
                    onTransactionClick={handleTransactionClick}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default App;
