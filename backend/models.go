package main

type Events struct {
    Timestamp_ms int64  `bun:",pk"`
    Eventdata    string `bun:",type:text,notnull"`
}

type VTXO struct {
    Txid      string `bun:",pk" json:"txid"`
    Vout      int    `bun:",pk" json:"vout"`
    Amount    int64  `json:"amount"`
    Script    string `json:"script"`
    CreatedAt int64  `json:"createdAt"`
    ExpiresAt int64  `json:"expiresAt"`
    IsSpent   bool   `json:"isSpent"`
    SpentBy   string `json:"spentBy"`
    TxType    string `json:"txType"`
}

type NetworkStats struct {
    ID               int   `bun:",pk,autoincrement" json:"id"`
    Timestamp        int64 `json:"timestamp"`
    OnboardingVolume int64 `json:"onboardingVolume"`
    OffboardingVolume int64 `json:"offboardingVolume"`
    NetworkLiquidity int64 `json:"networkLiquidity"`
    VirtualTxCount   int   `json:"virtualTxCount"`
    VirtualTxVolume  int64 `json:"virtualTxVolume"`
}