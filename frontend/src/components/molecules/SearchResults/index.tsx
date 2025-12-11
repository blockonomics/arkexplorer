import { AlertCircle} from "lucide-react";
import type { VTXO } from "../../../types";
import { ArkAddress } from "../../atoms/ArkAddress";

// Search Results Component
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return (amount / 100000000).toFixed(8);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Search Results ({results.length} output{results.length !== 1 ? 's' : ''})
        </h3>
      </div>

      <div className="space-y-4">
        {results.map((vtxo, index) => (
          <div
            key={`${vtxo.txid}-${vtxo.vout}`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="space-y-4">
              <div className="col-span-2">
                <div className="text-sm text-gray-600 mb-1">Transaction ID</div>
                <div className="font-mono text-sm break-all">{vtxo.txid}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Output Index</div>
                  <div className="font-semibold">{vtxo.vout}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Amount</div>
                  <div className="font-semibold">{formatAmount(vtxo.amount)} BTC</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Type</div>
                  <div className="font-semibold capitalize">{vtxo.txType || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div>
                    {vtxo.isSpent ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Spent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Created At</div>
                  <div className="text-sm">{formatDate(vtxo.createdAt)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Expires At</div>
                  <div className="text-sm">{formatDate(vtxo.expiresAt)}</div>
                </div>
              </div>

              <ArkAddress vtxo={vtxo} /> 

              {vtxo.isSpent && vtxo.spentBy && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Spent By</div>
                  <div className="font-mono text-sm break-all">{vtxo.spentBy}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}