import { AlertCircle } from "lucide-react";
import type { VTXO } from "../../../types";
import { ArkAddressField } from "../../atoms/ArkAddress";

interface SearchResultsProps {
  results: VTXO[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

export function SearchResults({ results, loading, error, searchQuery }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-600">Searching...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (results.length === 0 && searchQuery) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No results found for: {searchQuery}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const formatAmount = (amount: number) => {
    return (amount / 100000000).toFixed(8);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Group VTXOs by transaction ID
  const groupedByTxid = results.reduce((acc, vtxo) => {
    if (!acc[vtxo.txid]) {
      acc[vtxo.txid] = [];
    }
    acc[vtxo.txid].push(vtxo);
    return acc;
  }, {} as Record<string, VTXO[]>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Search Results ({results.length} output{results.length !== 1 ? 's' : ''})
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByTxid).map(([txid, vtxos]) => (
          <div
            key={txid}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                  <div className="font-mono text-sm break-all text-gray-900">{txid}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div className="text-xs text-gray-700">{formatDate(vtxos[0].createdAt)}</div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {vtxos.map((vtxo) => (
                <div key={`${vtxo.txid}-${vtxo.vout}`} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Output #{vtxo.vout}</span>
                      {vtxo.isSpent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          Spent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{formatAmount(vtxo.amount)} BTC</div>
                    </div>
                  </div>
                  <ArkAddressField vtxo={vtxo} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}