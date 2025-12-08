package main

import (
    "context"
    "encoding/json"
    "net/http"
)

func GetStats(w http.ResponseWriter, r *http.Request) {
    var stats NetworkStats
    ctx := context.Background()
    DB.NewSelect().Model(&stats).Order("timestamp DESC").Limit(1).Scan(ctx, &stats)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "onboardingVolume": float64(stats.OnboardingVolume) / 100000000,
        "offboardingVolume": float64(stats.OffboardingVolume) / 100000000,
        "networkLiquidity": float64(stats.NetworkLiquidity) / 100000000,
        "virtualTxCount": stats.VirtualTxCount,
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