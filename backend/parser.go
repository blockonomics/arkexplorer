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
    if err := json.Unmarshal([]byte(data[6:]), &jsonData); err != nil {
        return
    }
    
    if _, ok := jsonData["heartbeat"]; ok {
        return
    }

    ctx := context.Background()
    now := time.Now().UnixMilli()
    
    // Store raw event
    DB.NewInsert().Model(&Events{Timestamp_ms: now, Eventdata: data[6:]}).Exec(ctx)
    
    // Parse and store VTXOs
    go parseAndStore(jsonData, ctx)
}

func parseAndStore(data map[string]interface{}, ctx context.Context) {
    if arkTx, ok := data["arkTx"].(map[string]interface{}); ok {
        processTransaction(arkTx, false, ctx)
    } else if commitTx, ok := data["commitmentTx"].(map[string]interface{}); ok {
        processTransaction(commitTx, true, ctx)
    }
}

func processTransaction(tx map[string]interface{}, isCommitmentTx bool, ctx context.Context) {
    spentVtxos := tx["spentVtxos"].([]interface{})
    spendableVtxos := tx["spendableVtxos"].([]interface{})
    // txid := tx["txid"].(string)
    
    hasInputs := len(spentVtxos) > 0
    hasOutputs := len(spendableVtxos) > 0
    
    // Check if refresh transaction (swept inputs)
    isRefresh := false
    if hasInputs {
        if first := spentVtxos[0].(map[string]interface{}); first["isSwept"] == true {
            isRefresh = true
        }
    }
    
    // Insert spendable VTXOs
    for _, v := range spendableVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        isSwept := vtxo["isSwept"] == true
        
        txType := determineTxType(hasInputs, hasOutputs, isCommitmentTx, isRefresh, isSwept)
        
        DB.NewInsert().Model(&VTXO{
            Txid:      outpoint["txid"].(string),
            Vout:      parseInt(outpoint["vout"]),
            Amount:    parseAmount(vtxo["amount"]),
            Script:    vtxo["script"].(string),
            CreatedAt: parseInt64(vtxo["createdAt"]),
            ExpiresAt: parseInt64(vtxo["expiresAt"]),
            IsSpent:   false,
            TxType:    txType,
        }).On("DUPLICATE KEY UPDATE").Set("tx_type = VALUES(tx_type)").Exec(ctx)
    }
    
    // Process spent VTXOs too (NEW - this is the minimal addition needed)
    for _, v := range spentVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        isSwept := vtxo["isSwept"] == true
        
        var txType string
        if isSwept {
            txType = "offboard"
        } else {
            txType = determineTxType(hasInputs, hasOutputs, isCommitmentTx, isRefresh, isSwept)
        }
        
        DB.NewInsert().Model(&VTXO{
            Txid:      outpoint["txid"].(string),
            Vout:      parseInt(outpoint["vout"]),
            Amount:    parseAmount(vtxo["amount"]),
            Script:    vtxo["script"].(string),
            CreatedAt: parseInt64(vtxo["createdAt"]),
            ExpiresAt: parseInt64(vtxo["expiresAt"]),
            IsSpent:   true, // Note: spent VTXOs should have IsSpent = true
            TxType:    txType,
        }).On("DUPLICATE KEY UPDATE").Set("tx_type = VALUES(tx_type)").Exec(ctx)
    }
}

func determineTxType(hasInputs, hasOutputs, isCommitmentTx, isRefresh, isSwept bool) string {
    if isRefresh {
        return "refresh"
    }
    
    // Unilateral offboarding (swept)
    if isCommitmentTx && isSwept {
        return "offboard"
    }
    
    // Cooperative offboarding: spends VTXOs but creates no new spendable VTXOs
    if isCommitmentTx && hasInputs && !hasOutputs {
        return "offboard"
    }
    
    // Onboarding: creates new spendable VTXOs
    if isCommitmentTx && hasOutputs && !isSwept {
        return "onboard"
    }
    
    // Virtual transfers
    if hasInputs && hasOutputs {
        return "virtual"
    }
    
    return "unknown"
}

func BackfillEvents() {
    ctx := context.Background()
    fmt.Println("Starting backfill from events table...")
    
    var events []Events
    if err := DB.NewSelect().Model(&events).Order("timestamp_ms ASC").Scan(ctx); err != nil {
        log.Printf("Error fetching events: %v", err)
        return
    }
    
    fmt.Printf("Found %d events to process\n", len(events))
    
    for i, event := range events {
        var jsonData map[string]interface{}
        if err := json.Unmarshal([]byte(event.Eventdata), &jsonData); err != nil {
            continue
        }
        parseAndStore(jsonData, ctx)
        
        if (i+1)%100 == 0 {
            fmt.Printf("Processed %d/%d events\n", i+1, len(events))
        }
    }
    
    fmt.Println("Backfill complete! Updating stats...")
    UpdateNetworkStats()
    fmt.Println("Done!")
}

func UpdateNetworkStats(periodHours ...int) {
    ctx := context.Background()
    now := time.Now().UnixMilli()
    
    hours := 24
    if len(periodHours) > 0 && periodHours[0] > 0 {
        hours = periodHours[0]
    }
    periodStartSeconds := (now - int64(hours)*3600000) / 1000
    
    var liquidity, vtxVolume, onboardVol, offboardVol int64
    var vtxCount int
    
    // Network liquidity
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("is_spent = ?", false).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &liquidity)
    
    // Virtual transactions
    vtxCount, _ = DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ? AND created_at > ?", "virtual", periodStartSeconds).
        Count(ctx)
    
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ? AND created_at > ?", "virtual", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &vtxVolume)
    
    // Onboarding volume
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ? AND created_at > ?", "onboard", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &onboardVol)
    
    // Offboarding volume
    DB.NewSelect().Model((*VTXO)(nil)).
        Where("tx_type = ? AND created_at > ?", "offboard", periodStartSeconds).
        ColumnExpr("COALESCE(SUM(amount), 0)").
        Scan(ctx, &offboardVol)
    
    DB.NewInsert().Model(&NetworkStats{
        Timestamp:         now,
        OnboardingVolume:  onboardVol,
        OffboardingVolume: offboardVol,
        NetworkLiquidity:  liquidity,
        VirtualTxCount:    vtxCount,
        VirtualTxVolume:   vtxVolume,
    }).Exec(ctx)
    
    log.Printf("Stats updated (%dh): liquidity=%d, vtx_count=%d, vtx_vol=%d, onboard=%d, offboard=%d",
        hours, liquidity, vtxCount, vtxVolume, onboardVol, offboardVol)
}

func parseAmount(amount interface{}) int64 {
    switch v := amount.(type) {
    case string:
        var val int64
        fmt.Sscanf(v, "%d", &val)
        return val
    case float64:
        return int64(v)
    case int64:
        return v
    default:
        return 0
    }
}

func parseInt(val interface{}) int {
    switch v := val.(type) {
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
    default:
        return 0
    }
}