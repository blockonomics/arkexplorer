import React from 'react';

export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Free to use</h2>
          <p>
            Ark Explorer is free to use for anyone. No registration, payment, or agreement is
            required to browse network statistics or search transactions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No warranty on data accuracy</h2>
          <p>
            Network statistics and transaction data are provided on a best-effort basis. Data may
            lag, be incomplete, or contain errors. Do not rely solely on this explorer for
            financial decisions — always verify critical information through independent sources
            or your own node.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No liability</h2>
          <p>
            Ark Explorer and its contributors accept no liability for losses or damages arising
            from the use or inability to use this service, including reliance on displayed data.
            The service is provided "as is" without warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Open source</h2>
          <p>
            This project is open source and available at{' '}
            <a
              href="https://github.com/blockonomics/arkexplorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              github.com/blockonomics/arkexplorer
            </a>. Contributions are welcome.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Changes to these terms</h2>
          <p>
            These terms may be updated at any time. Continued use of the site constitutes
            acceptance of the current terms.
          </p>
        </section>
      </div>
    </div>
  );
}
