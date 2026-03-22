import React from 'react';
import { Github } from 'lucide-react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  const linkClass = (page: string) =>
    `text-sm font-medium transition-colors ${
      activePage === page
        ? 'text-gray-900'
        : 'text-gray-500 hover:text-gray-900'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="font-bold text-lg tracking-tight"
        >
          <span className="text-amber-500">Ark</span>
          <span className="text-gray-900"> Explorer</span>
        </button>

        <div className="flex items-center gap-6">
          <button onClick={() => onNavigate('home')} className={linkClass('home')}>
            Home
          </button>
          <button onClick={() => onNavigate('analytics')} className={linkClass('analytics')}>
            Analytics
          </button>
          <a
            href="https://github.com/blockonomics/arkexplorer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="GitHub repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </nav>
  );
}
