import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Button({ children, active = false, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-md font-medium text-sm transition-all ${
        active
          ? 'bg-blue-500 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}