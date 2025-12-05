import React from 'react';
import { TransactionItem } from '../../molecules/TransactionItem';


interface TransactionListProps {
  transactions: string[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {transactions.map((tx, idx) => (
          <TransactionItem key={idx} txId={tx} />
        ))}
      </div>
    </div>
  );
}