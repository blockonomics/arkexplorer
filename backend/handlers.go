package main

import (
    "context"
    "encoding/json"
    "net/http"
    "time"
    "log"
)

func GetStats(w http.ResponseWriter, r *http.Request) {
    ctx := context.Background()
    
    // Parse timeframe parameter (default to 24h)
    timeframe := r.URL.Query().Get("timeframe")
    if timeframe == "" {
        timeframe = "24h"
    }
    
    // Calculate period start based on timeframe
    now := time.Now().UnixMilli()
    var periodStartSeconds int64
    
    switch timeframe {
    case "24h":
        periodStartSeconds = (now - 24*3600000) / 1000
    case "1w":
        periodStartSeconds = (now - 7*24*3600000) / 1000
    case "1month":
        periodStartSeconds = (now - 30*24*3600000) / 1000
    case "all time":
        periodStartSeconds = 0 // Beginning of time
    default:
        http.Error(w, "Invalid timeframe. Use: 24h, 1w, 1month, or 'all time'", http.StatusBadRequest)
        return
    }
    
    var liquidity, vtxVolume, onboardVol, offboardVol int64
    var vtxCount int
    
    // Network liquidity (current unspent VTXOs)
    if err := DB.NewSelect().Model((*VTXO)(nil)).
        Where("is_spent = ?", false).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &liquidity); err != nil {
        log.Printf("Error calculating liquidity: %v", err)
        http.Error(w, "Error calculating stats", http.StatusInternalServerError)
        return
    }
    
    // Virtual tx count for period
    vtxCount, _ = DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ?", "virtual").
        Where("created_at > ?", periodStartSeconds).
        Count(ctx)
    
    // Virtual tx volume for period
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ?", "virtual").
        Where("created_at > ?", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &vtxVolume)
    
    // Onboarding volume for period
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ?", "onboard").
        Where("created_at > ?", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &onboardVol)
    
    // Offboarding volume for period
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ?", "offboard").
        Where("created_at > ?", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &offboardVol)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "onboardingVolume":  float64(onboardVol) / 100000000,
        "offboardingVolume": float64(offboardVol) / 100000000,
        "networkLiquidity":  float64(liquidity) / 100000000,
        "virtualTxCount":    vtxCount,
        "virtualTxVolume":   float64(vtxVolume) / 100000000,
        "timeframe":         timeframe,
        "timestamp":         now,
    })
}

func GetRecentTxs(w http.ResponseWriter, r *http.Request) {
    var vtxos []VTXO
    ctx := context.Background()
    DB.NewSelect().Model(&vtxos).Order("created_at DESC").Limit(20).Scan(ctx, &vtxos)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(vtxos)
}

func SearchTx(w http.ResponseWriter, r *http.Request) {
    txid := r.URL.Query().Get("txid")
    
    var vtxos []VTXO
    ctx := context.Background()
    DB.NewSelect().Model(&vtxos).Where("txid = ?", txid).Scan(ctx, &vtxos)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(vtxos)
}