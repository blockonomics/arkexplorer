import React from 'react';
import { Button } from '../../atoms/Button';


interface TimeframeTabsProps {
  active: string;
  onChange: (timeframe: string) => void;
}

export function TimeframeTabs({ active, onChange }: TimeframeTabsProps) {
  const timeframes = ['24h', '1w', '1month', 'all time'];
  
  return (
    <div className="inline-flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
      {timeframes.map((tf) => (
        <Button
          key={tf}
          active={active === tf}
          onClick={() => onChange(tf)}
        >
          {tf}
        </Button>
      ))}
    </div>
  );
}