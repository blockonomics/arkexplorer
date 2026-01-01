package main

import (
    "context"
    "encoding/json"
    "net/http"
    "time"
    "log"
    "math"
)

func GetStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 1. Parse Timeframe
	timeframe := r.URL.Query().Get("timeframe")
	if timeframe == "" {
		timeframe = "24h"
	}

	now := time.Now().Unix()
	var periodSeconds int64
	isAllTime := timeframe == "all time"

	switch timeframe {
	case "24h":
		periodSeconds = 24 * 3600
	case "1w":
		periodSeconds = 7 * 24 * 3600
	case "1month":
		periodSeconds = 30 * 24 * 3600
	case "all time":
		periodSeconds = 0
	default:
		periodSeconds = 24 * 3600
	}

	// Calculate the two time windows
	currentStart := now - periodSeconds
	if isAllTime {
		currentStart = 0
	}
	previousStart := currentStart - periodSeconds

	// Data structures
	type PeriodMetrics struct {
		Volume float64 `bun:"volume"`
		Count  int     `bun:"count"`
	}
	var current, previous PeriodMetrics
	var liquidity, onboardVol, offboardVol float64

	// 2. Current Period Stats (Virtual TXs)
	// We use a single query to get both SUM and COUNT for efficiency
	err := DB.NewSelect().Model((*VTXO)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0) / 100000000.0 AS volume").
		ColumnExpr("COUNT(*) AS count").
		Where("tx_type = 'virtual' AND created_at >= ?", currentStart).
		Scan(ctx, &current)
	if err != nil {
		log.Printf("Error fetching current stats: %v", err)
	}

	// 3. Previous Period Stats (For Change Calculation)
	// We skip this if 'all time' because there is no 'before the beginning'
	if !isAllTime {
		DB.NewSelect().Model((*VTXO)(nil)).
			ColumnExpr("COALESCE(SUM(amount), 0) / 100000000.0 AS volume").
			ColumnExpr("COUNT(*) AS count").
			Where("tx_type = 'virtual' AND created_at >= ? AND created_at < ?", previousStart, currentStart).
			Scan(ctx, &previous)
	}

	// 4. Liquidity & Flows
	// Liquidity is always the total current unspent supply
	DB.NewSelect().Model((*VTXO)(nil)).
		Where("is_spent = ?", false).
		ColumnExpr("COALESCE(SUM(amount), 0) / 100000000.0").
		Scan(ctx, &liquidity)

	// Flows are tied to the selected timeframe
	DB.NewSelect().Model((*VTXO)(nil)).
		Where("tx_type = 'onboard' AND created_at >= ?", currentStart).
		ColumnExpr("COALESCE(SUM(amount), 0) / 100000000.0").
		Scan(ctx, &onboardVol)

	DB.NewSelect().Model((*VTXO)(nil)).
		Where("tx_type = 'offboard' AND created_at >= ?", currentStart).
		ColumnExpr("COALESCE(SUM(amount), 0) / 100000000.0").
		Scan(ctx, &offboardVol)

	// 5. Math Helper for Percentages
	calcChange := func(curr, prev float64) float64 {
		if prev == 0 {
			if curr > 0 { return 100.0 } // 100% growth if we went from 0 to something
			return 0
		}
		change := ((curr - prev) / prev) * 100
		return math.Round(change*10) / 10 // Round to 1 decimal place (e.g. 12.5)
	}

	// 6. Final Response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"onboardingVolume":  onboardVol,
		"offboardingVolume": offboardVol,
		"networkLiquidity":  liquidity,
		"virtualTxCount":    current.Count,
		"virtualTxVolume":   current.Volume,
		"txCountChange":     calcChange(float64(current.Count), float64(previous.Count)),
		"volumeChange":      calcChange(current.Volume, previous.Volume),
		"timeframe":         timeframe,
		"timestamp":         now * 1000, // Frontend expects milliseconds
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