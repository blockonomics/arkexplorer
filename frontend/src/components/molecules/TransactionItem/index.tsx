import React from 'react';

interface TransactionItemProps {
  txId: string;
  onClick?: () => void;
}

export function TransactionItem({ txId, onClick }: TransactionItemProps) {
  return (
    <div
      onClick={onClick}
      className="px-6 py-4 hover:bg-blue-50 cursor-pointer transition-colors group"
    >
      <div className="font-mono text-sm text-gray-600 group-hover:text-blue-600 break-all transition-colors">
        {txId}
      </div>
    </div>
  );
}