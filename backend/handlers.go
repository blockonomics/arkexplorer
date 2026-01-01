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
    ctx := context.Background()

    var results []struct {
        Txid      string
        CreatedAt int64
    }

    err := DB.NewSelect().
        Model((*VTXO)(nil)).
        ColumnExpr("DISTINCT txid, created_at").
        Order("created_at DESC").
        Limit(10).
        Scan(ctx, &results)

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Extract just the txids
    txids := make([]string, len(results))
    for i, r := range results {
        txids[i] = r.Txid
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(txids)
}

func SearchTx(w http.ResponseWriter, r *http.Request) {
    txid := r.URL.Query().Get("txid")
    if txid == "" {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "txid required"})
        return
    }
    
    var vtxos []VTXO
    ctx := context.Background()
    DB.NewSelect().Model(&vtxos).Where("txid = ?", txid).Scan(ctx, &vtxos)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(vtxos)
}

func GetNetworkTrends(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    timeframe := r.URL.Query().Get("timeframe")
    if timeframe == "" { timeframe = "24h" }
    
    now := time.Now().Unix()
    var periodStartSeconds int64
    var limit int
    
    dateFormat := "DATE(FROM_UNIXTIME(created_at))"

    switch timeframe {
    case "24h":
        periodStartSeconds = now - (24 * 3600)
        limit = 24
        dateFormat = "DATE_FORMAT(FROM_UNIXTIME(created_at), '%Y-%m-%d %H:00')"
    case "1w":
        periodStartSeconds = now - (7 * 24 * 3600)
        limit = 7
    case "1month":
        periodStartSeconds = now - (30 * 24 * 3600)
        limit = 30
    case "all time":
        periodStartSeconds = 0     // No time floor
        limit = 2000               // Large limit to capture all history
    default:
        periodStartSeconds = now - (30 * 24 * 3600)
        limit = 30
    }

    type TrendPoint struct {
        DisplayDate       string  `json:"displayDate" bun:"display_date"`
        OnboardingVolume  float64 `json:"onboardingVolume" bun:"onboarding_volume"`
        OffboardingVolume float64 `json:"offboardingVolume" bun:"offboarding_volume"`
        VirtualTxVolume   float64 `json:"virtualTxVolume" bun:"virtual_tx_volume"`
        VirtualTxCount    int     `json:"virtualTxCount" bun:"virtual_tx_count"`
    }

    history := make([]TrendPoint, 0)

    err := DB.NewSelect().
        Model((*VTXO)(nil)).
        ColumnExpr(dateFormat + " AS display_date").
        ColumnExpr("SUM(CASE WHEN tx_type = 'onboard' THEN amount ELSE 0 END) / 100000000.0 AS onboarding_volume").
        ColumnExpr("SUM(CASE WHEN tx_type = 'offboard' THEN amount ELSE 0 END) / 100000000.0 AS offboarding_volume").
        ColumnExpr("SUM(CASE WHEN tx_type = 'virtual' THEN amount ELSE 0 END) / 100000000.0 AS virtual_tx_volume").
        ColumnExpr("COUNT(CASE WHEN tx_type = 'virtual' THEN 1 END) AS virtual_tx_count").
        Where("created_at >= ?", periodStartSeconds).
        Group("display_date").
        Order("display_date ASC").
        Limit(limit).
        Scan(ctx, &history)

    if err != nil {
        log.Printf("SQL Error: %v", err)
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode([]TrendPoint{})
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(history)
}