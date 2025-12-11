export interface NetworkStats {
  onboardingVolume: number;
  offboardingVolume: number;
  networkLiquidity: number;
  virtualTxCount: number;
  virtualTxVolume: number;
  timeframe: string;
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