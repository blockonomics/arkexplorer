// TransactionItem.tsx
const TYPE_COLORS: Record<string, string> = {
  virtual:  'bg-purple-50 text-purple-700 border-purple-100',
  onboard:  'bg-blue-50 text-blue-700 border-blue-100',
  offboard: 'bg-orange-50 text-orange-700 border-orange-100',
  refresh:  'bg-gray-50 text-gray-700 border-gray-100',
};

interface TransactionItemProps {
  txid: string;
  createdAt?: number;
  txType?: string;
  onClick?: () => void;
}

export function TransactionItem({ txid, createdAt, txType, onClick }: TransactionItemProps) {
  const time = createdAt
    ? new Date(createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 mb-0.5">
        <div className="font-mono text-sm text-gray-900 truncate">{txid}</div>
        {txType && (
          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${TYPE_COLORS[txType] ?? 'bg-gray-50 text-gray-700 border-gray-100'}`}>
            {txType}
          </span>
        )}
      </div>
      {time && <div className="text-xs text-gray-400">{time}</div>}
    </div>
  );
}
