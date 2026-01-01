export interface NetworkStats {
  onboardingVolume: number;
  offboardingVolume: number;
  networkLiquidity: number;
  virtualTxCount: number;
  virtualTxVolume: number;
  timeframe: string;
  // Add these trend fields:
  txCountChange?: number; // e.g., 12.5 or -5.0
  volumeChange?: number;   // e.g., 2.3 or -10.1
}

export interface VTXO {
  txid: string;
  vout: number;
  amount: number;
  createdAt: number;
  txType: string;
  isSpent: boolean;
  expiresAt: number;
  spentBy: string;
  script: string;
}