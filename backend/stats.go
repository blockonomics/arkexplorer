package main

import (
    "context"
    "time"
)

func StartStatsUpdater() {
    ticker := time.NewTicker(1 * time.Minute)
    go func() {
        for range ticker.C {
            updateNetworkStats()
        }
    }()
}

func updateNetworkStats() {
    ctx := context.Background()
    now := time.Now().UnixMilli()
    
    var liquidity int64
    DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("is_spent = ?", false).
        ColumnExpr("SUM(amount)").
        Scan(ctx, &liquidity)
    
    var vtxCount int
    DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "virtual").
        Where("created_at > ?", now - 86400000).
        Count(ctx)
    
    var onboardVol int64
    DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "onboard").
        Where("created_at > ?", now - 86400000).
        ColumnExpr("SUM(amount)").
        Scan(ctx, &onboardVol)
    
    var offboardVol int64
    DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "offboard").
        Where("created_at > ?", now - 86400000).
        ColumnExpr("SUM(amount)").
        Scan(ctx, &offboardVol)
    
    stats := &NetworkStats{
        Timestamp:         now,
        OnboardingVolume:  onboardVol,
        OffboardingVolume: offboardVol,
        NetworkLiquidity:  liquidity,
        VirtualTxCount:    vtxCount,
    }
    
    DB.NewInsert().Model(stats).Exec(ctx)
}