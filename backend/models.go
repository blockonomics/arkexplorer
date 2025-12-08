package main

type Events struct {
    Timestamp_ms int64  `bun:",pk"`
    Eventdata    string `bun:",type:text,notnull"`
}

type VTXO struct {
    Txid      string `bun:",pk"`
    Vout      int    `bun:",pk"`
    Amount    int64
    Script    string
    CreatedAt int64
    ExpiresAt int64
    IsSpent   bool
    SpentBy   string
    TxType    string
}

type NetworkStats struct {
    ID                    int    `bun:",pk,autoincrement"`
    Timestamp             int64
    OnboardingVolume      int64
    OffboardingVolume     int64
    NetworkLiquidity      int64
    VirtualTxCount        int
    VirtualTxVolume       int64
}