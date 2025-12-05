import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../atoms/Input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder="Enter your ark /virtual tx id"
      icon={<Search className="w-5 h-5" />}
    />
  );
}