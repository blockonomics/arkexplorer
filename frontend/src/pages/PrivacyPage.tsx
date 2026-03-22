import React from 'react';

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No personal data collected</h2>
          <p>
            Ark Explorer is a read-only block explorer. We do not require accounts, logins, or
            any form of registration. We do not collect, store, or process any personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Blockchain data is public</h2>
          <p>
            All transaction and network data displayed on this site is sourced from the Ark
            network and Bitcoin blockchain, both of which are public by design. Searching for a
            transaction ID does not reveal your identity to us — we never log search queries.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Third-party data sources</h2>
          <p>
            To display estimated fees and BTC price context, this site makes requests to{' '}
            <a href="https://mempool.space" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mempool.space</a>{' '}
            and{' '}
            <a href="https://www.coinbase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Coinbase</a>.
            These requests are made from your browser and are subject to their respective privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cookies &amp; tracking</h2>
          <p>
            We do not use cookies, analytics, or any tracking scripts. There are no third-party
            advertising or analytics services embedded in this site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Open source</h2>
          <p>
            This explorer is fully open source. You can inspect exactly what it does at{' '}
            <a
              href="https://github.com/blockonomics/arkexplorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              github.com/blockonomics/arkexplorer
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
