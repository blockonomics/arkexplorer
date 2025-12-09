export interface NetworkStats {
  onboardingVolume: number;
  offboardingVolume: number;
  networkLiquidity: number;
  virtualTxCount: number;
}

export interface VTXO {
  txid: string;
  vout: number;
  amount: number;
  createdAt: number;
}