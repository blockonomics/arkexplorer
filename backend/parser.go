package main

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strings"
    "time"
)

func ConsumeSSEStream(url string) {
    client := &http.Client{Timeout: 0}
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        log.Fatalf("Error creating request: %v", err)
    }
    req.Header.Set("Accept", "text/event-stream")

    resp, err := client.Do(req)
    if err != nil {
        log.Fatalf("Error connecting to SSE stream: %v", err)
    }
    defer resp.Body.Close()

    reader := bufio.NewReader(resp.Body)

    for {
        line, err := reader.ReadString('\n')
        if err != nil {
            log.Printf("Stream read error: %v. Reconnecting...", err)
            time.Sleep(5 * time.Second)
            go ConsumeSSEStream(url)
            return
        }

        line = strings.TrimSpace(line)
        go processEvent(line)
    }
}

func processEvent(data string) {
    if !strings.HasPrefix(data, "data") {
        return
    }
    
    var jsonData map[string]interface{}
    err := json.Unmarshal([]byte(data[6:]), &jsonData)
    if err != nil {
        fmt.Println("Error unmarshaling JSON:", err)
        return
    }
    
    if _, ok := jsonData["heartbeat"]; ok {
        return
    }

    now := time.Now().UnixMilli()
    event := &Events{Timestamp_ms: now, Eventdata: data[6:]}
    
    ctx := context.Background()
    _, err = DB.NewInsert().Model(event).Exec(ctx)
    if err != nil {
        log.Printf("Error inserting event: %v", err)
        return
    }

    go parseAndStore(jsonData, now, ctx)
}

func parseAndStore(data map[string]interface{}, timestamp int64, ctx context.Context) {
    if arkTx, ok := data["arkTx"].(map[string]interface{}); ok {
        parseArkTx(arkTx, timestamp, ctx)
    } else if commitTx, ok := data["commitmentTx"].(map[string]interface{}); ok {
        parseCommitmentTx(commitTx, timestamp, ctx)
    }
}

func parseArkTx(arkTx map[string]interface{}, timestamp int64, ctx context.Context) {
    txid := arkTx["txid"].(string)
    
    spentVtxos := arkTx["spentVtxos"].([]interface{})
    spendableVtxos := arkTx["spendableVtxos"].([]interface{})
    hasInputs := len(spentVtxos) > 0
    
    // Process spendable VTXOs (outputs)
    for _, v := range spendableVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
        // Determine transaction type
        txType := determineTxType(vtxo, hasInputs)
        
        vtxoRecord := &VTXO{
            Txid:      outpoint["txid"].(string),
            Vout:      parseInt(outpoint["vout"]), 
            Amount:    parseAmount(vtxo["amount"]),
            Script:    vtxo["script"].(string),
            CreatedAt: parseInt64(vtxo["createdAt"]), 
            ExpiresAt: parseInt64(vtxo["expiresAt"]), 
            IsSpent:   false,
            TxType:    txType,
        }
        
        _, err := DB.NewInsert().
            Model(vtxoRecord).
            On("DUPLICATE KEY UPDATE").
            Set("tx_type = VALUES(tx_type)").
            Exec(ctx)
        if err != nil {
            log.Printf("Error inserting VTXO %s:%d: %v", vtxoRecord.Txid, vtxoRecord.Vout, err)
        }
    }
    
    // Update spent VTXOs
    for _, v := range spentVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
        _, err := DB.NewUpdate().
            Model((*VTXO)(nil)).
            Set("is_spent = ?", true).
            Set("spent_by = ?", txid).
            Where("txid = ? AND vout = ?", outpoint["txid"].(string), parseInt(outpoint["vout"])). 
            Exec(ctx)
        if err != nil {
            log.Printf("Error updating spent VTXO: %v", err)
        }
    }
}

func parseCommitmentTx(commitTx map[string]interface{}, timestamp int64, ctx context.Context) {
    spentVtxos := commitTx["spentVtxos"].([]interface{})
    spendableVtxos := commitTx["spendableVtxos"].([]interface{})
    hasInputs := len(spentVtxos) > 0
    
    // Check if this is a refresh/sweep transaction
    isRefresh := false
    if hasInputs {
        firstVtxo := spentVtxos[0].(map[string]interface{})
        if isSwept, ok := firstVtxo["isSwept"].(bool); ok && isSwept {
            isRefresh = true
        }
    }
    
    // Process spendable VTXOs
    for _, v := range spendableVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
        // Determine transaction type
        var txType string
        if isRefresh {
            txType = "virtual" // Refresh is essentially a virtual tx
        } else {
            txType = determineTxType(vtxo, hasInputs)
        }
        
        vtxoRecord := &VTXO{
            Txid:      outpoint["txid"].(string),
            Vout:      parseInt(outpoint["vout"]), 
            Amount:    parseAmount(vtxo["amount"]),
            Script:    vtxo["script"].(string),
            CreatedAt: parseInt64(vtxo["createdAt"]), 
            ExpiresAt: parseInt64(vtxo["expiresAt"]), 
            IsSpent:   false,
            TxType:    txType,
        }
        
        _, err := DB.NewInsert().
            Model(vtxoRecord).
            On("DUPLICATE KEY UPDATE").
            Set("tx_type = VALUES(tx_type)").
            Exec(ctx)
        if err != nil {
            log.Printf("Error inserting VTXO: %v", err)
        }
    }
    
    // Update spent VTXOs
    for _, v := range spentVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
        _, err := DB.NewUpdate().
            Model((*VTXO)(nil)).
            Set("is_spent = ?", true).
            Where("txid = ? AND vout = ?", outpoint["txid"].(string), parseInt(outpoint["vout"])). 
            Exec(ctx)
        if err != nil {
            log.Printf("Error updating spent VTXO: %v", err)
        }
    }
}

func determineTxType(vtxo map[string]interface{}, hasInputs bool) string {
    // 1. Check if being settled on-chain (offboarding)
    if settledBy, ok := vtxo["settledBy"].(string); ok && settledBy != "" {
        return "offboard"
    }
    
    // 2. If transaction has inputs, it's a virtual (internal) transfer
    if hasInputs {
        return "virtual"
    }
    
    // 3. Otherwise, it's fresh funds entering the Ark (onboarding)
    return "onboard"
}

func BackfillEvents() {
    ctx := context.Background()
    
    fmt.Println("Starting backfill from events table...")
    
    var events []Events
    err := DB.NewSelect().Model(&events).Order("timestamp_ms ASC").Scan(ctx)
    if err != nil {
        log.Printf("Error fetching events: %v", err)
        return
    }
    
    fmt.Printf("Found %d events to process\n", len(events))
    
    for i, event := range events {
        var jsonData map[string]interface{}
        err := json.Unmarshal([]byte(event.Eventdata), &jsonData)
        if err != nil {
            fmt.Printf("Skipping event %d: parse error\n", i)
            continue
        }
        
        parseAndStore(jsonData, event.Timestamp_ms, ctx)
        
        // Progress indicator
        if (i+1) % 100 == 0 {
            fmt.Printf("Processed %d/%d events\n", i+1, len(events))
        }
    }
    
    fmt.Println("Backfill complete! Updating stats...")
    UpdateNetworkStats()
    fmt.Println("Done!")
}

// Fixed UpdateNetworkStats with proper error handling and all metrics
// periodHours: time period to calculate stats for (default 24 hours)
func UpdateNetworkStats(periodHours ...int) {
    ctx := context.Background()
    now := time.Now().UnixMilli()
    
    // Default to 24 hours if not specified
    hours := 24
    if len(periodHours) > 0 && periodHours[0] > 0 {
        hours = periodHours[0]
    }
    
    periodMs := int64(hours) * 3600000 // hours to milliseconds
    periodStart := now - periodMs
    
    // Convert to seconds for comparison with VTXO timestamps
    periodStartSeconds := periodStart / 1000
    
    var liquidity, vtxVolume, onboardVol, offboardVol int64
    var vtxCount int
    
    // Network liquidity: sum of all unspent VTXOs
    if err := DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("is_spent = ?", false).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &liquidity); err != nil {
        log.Printf("Error calculating liquidity: %v", err)
        return
    }
    
    // Virtual transaction count (for specified period)
    vtxCount, err := DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "virtual").
        Where("created_at > ?", periodStartSeconds).
        Count(ctx)
    if err != nil {
        log.Printf("Error counting virtual txs: %v", err)
    }
    
    // Virtual transaction volume (for specified period)
    if err := DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "virtual").
        Where("created_at > ?", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &vtxVolume); err != nil {
        log.Printf("Error calculating virtual tx volume: %v", err)
    }
    
    // Onboarding volume (for specified period)
    if err := DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "onboard").
        Where("created_at > ?", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &onboardVol); err != nil {
        log.Printf("Error calculating onboard volume: %v", err)
    }
    
    // Offboarding volume (for specified period)
    if err := DB.NewSelect().
        Model((*VTXO)(nil)).
        Where("tx_type = ?", "offboard").
        Where("created_at > ?", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &offboardVol); err != nil {
        log.Printf("Error calculating offboard volume: %v", err)
    }
    
    stats := &NetworkStats{
        Timestamp:         now,
        OnboardingVolume:  onboardVol,
        OffboardingVolume: offboardVol,
        NetworkLiquidity:  liquidity,
        VirtualTxCount:    vtxCount,
        VirtualTxVolume:   vtxVolume,
    }
    
    if _, err := DB.NewInsert().Model(stats).Exec(ctx); err != nil {
        log.Printf("Error inserting stats: %v", err)
    } else {
        log.Printf("Stats updated (%dh period): liquidity=%d, vtx_count=%d, vtx_vol=%d, onboard=%d, offboard=%d",
            hours, liquidity, vtxCount, vtxVolume, onboardVol, offboardVol)
    }
}

func parseAmount(amount interface{}) int64 {
    switch v := amount.(type) {
    case string:
        var val int64
        fmt.Sscanf(v, "%d", &val)
        return val
    case float64:
        return int64(v)
    case int:
        return int64(v)
    case int64:
        return v
    default:
        fmt.Printf("Warning: unexpected amount type: %T\n", amount)
        return 0
    }
}

func parseInt(val interface{}) int {
    switch v := val.(type) {
    case string:
        var i int
        fmt.Sscanf(v, "%d", &i)
        return i
    case float64:
        return int(v)
    case int:
        return v
    default:
        return 0
    }
}

func parseInt64(val interface{}) int64 {
    switch v := val.(type) {
    case string:
        var i int64
        fmt.Sscanf(v, "%d", &i)
        return i
    case float64:
        return int64(v)
    case int64:
        return v
    case int:
        return int64(v)
    default:
        return 0
    }
}