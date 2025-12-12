// TransactionItem.tsx
interface TransactionItemProps {
  txId: string;
  onClick?: () => void;
}

export function TransactionItem({ txId, onClick }: TransactionItemProps) {
  return (
    <div 
      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="font-mono text-sm text-gray-900 break-all">{txId}</div>
    </div>
  );
}