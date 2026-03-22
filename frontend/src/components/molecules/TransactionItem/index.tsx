// TransactionItem.tsx
interface TransactionItemProps {
  txid: string;
  onClick?: () => void;
}

export function TransactionItem({ txid, onClick }: TransactionItemProps) {
  return (
    <div
      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
      onClick={onClick}
    >
      <div className="font-mono text-sm text-gray-900 break-all">{txid}</div>
    </div>
  );
}
