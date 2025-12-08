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
    txType := "virtual"
    
    spendableVtxos := arkTx["spendableVtxos"].([]interface{})
    if len(spendableVtxos) == 0 {
        txType = "offboard"
    }
    
    for _, v := range spendableVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
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
        
        DB.NewInsert().Model(vtxoRecord).On("DUPLICATE KEY UPDATE").Exec(ctx)
    }
    
    spentVtxos := arkTx["spentVtxos"].([]interface{})
    for _, v := range spentVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
        DB.NewUpdate().
            Model((*VTXO)(nil)).
            Set("is_spent = ?", true).
            Set("spent_by = ?", txid).
            Where("txid = ? AND vout = ?", outpoint["txid"].(string), parseInt(outpoint["vout"])). 
            Exec(ctx)
    }
}

func parseCommitmentTx(commitTx map[string]interface{}, timestamp int64, ctx context.Context) {
    spentVtxos := commitTx["spentVtxos"].([]interface{})
    spendableVtxos := commitTx["spendableVtxos"].([]interface{})
    
    txType := "onboard"
    if len(spendableVtxos) == 0 {
        txType = "offboard"
    } else if len(spentVtxos) > 0 {
        firstVtxo := spentVtxos[0].(map[string]interface{})
        if isSwept, ok := firstVtxo["isSwept"].(bool); ok && isSwept {
            txType = "refresh"
        }
    }
    
    for _, v := range spendableVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
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
        
        DB.NewInsert().Model(vtxoRecord).On("DUPLICATE KEY UPDATE").Exec(ctx)
    }
    
    for _, v := range spentVtxos {
        vtxo := v.(map[string]interface{})
        outpoint := vtxo["outpoint"].(map[string]interface{})
        
        DB.NewUpdate().
            Model((*VTXO)(nil)).
            Set("is_spent = ?", true).
            Where("txid = ? AND vout = ?", outpoint["txid"].(string), parseInt(outpoint["vout"])). 
            Exec(ctx)
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
    }
    
    fmt.Println("Backfill complete! Updating stats...")
    updateNetworkStats()
    fmt.Println("Done!")
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