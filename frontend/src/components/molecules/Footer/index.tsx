import React from 'react';
import { ExternalLink, Github, Globe, Wallet } from 'lucide-react';
import blockonomicsLogo from '../../../assets/blockonomics-logo.svg';
export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Ark Server Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Connected Server
            </h3>
            <a
              href="https://arkade.money"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm">arkade.money</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Contribute */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Contribute
            </h3>
            <a
              href="https://github.com/blockonomics/arkexplorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm">blockonomics/arkexplorer</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <p className="text-xs text-gray-500 mt-2">
              Explorer & Statistics for Ark Protocol
            </p>
          </div>

          {/* Blockonomics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Brought to you by
            </h3>
            <a
              href="https://www.blockonomics.co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group mb-2"
            >
            <img
              src={blockonomicsLogo}
              alt="Blockonomics"
              className="w-44"
            />
            </a>
            <p className="text-xs text-gray-500">
              Best way of receiving Bitcoin for your E-Commerce store
            </p>
          </div>

          {/* Learn More */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Learn More
            </h3>
            <div className="space-y-2">
              <a
                href="https://ark-protocol.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm group"
              >
                <Globe className="w-4 h-4" />
                <span>What is Ark?</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="https://arkade.money"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm group"
              >
                <Wallet className="w-4 h-4" />
                <span>Create Ark Wallet</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Ark Explorer. Open source Bitcoin Layer 2 network statistics.
          </p>
        </div>
      </div>
    </footer>
  );
}