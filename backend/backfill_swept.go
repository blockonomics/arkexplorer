package main

import (
    "context"
    "encoding/json"
    "log"
)

func BackfillSweptVTXOs() {
    ctx := context.Background()
    
    var events []Events
    
    err := DB.NewSelect().
        Model(&events).
        Scan(ctx)
    
    if err != nil {
        log.Fatalf("Failed to fetch events: %v", err)
    }
    
    log.Printf("Processing %d events for swept VTXO backfill...", len(events))
    
    updated := 0
    errors := 0
    sweptFound := 0
    notFoundInDB := 0
    
    for idx, event := range events {
        var data map[string]interface{}
        if err := json.Unmarshal([]byte(event.Eventdata), &data); err != nil {
            errors++
            continue
        }
        
        // Check for arkTx or commitmentTx
        var txData map[string]interface{}
        if arkTx, ok := data["arkTx"].(map[string]interface{}); ok {
            txData = arkTx
        } else if commitTx, ok := data["commitmentTx"].(map[string]interface{}); ok {
            txData = commitTx
        } else {
            continue
        }
        
        // Process both spentVtxos and spendableVtxos
        vtxoArrays := []string{"spentVtxos", "spendableVtxos"}
        
        for _, arrayName := range vtxoArrays {
            arrayData, exists := txData[arrayName]
            if !exists {
                continue
            }
            
            vtxos, ok := arrayData.([]interface{})
            if !ok {
                continue
            }
            
            for _, v := range vtxos {
                vtxo, ok := v.(map[string]interface{})
                if !ok {
                    continue
                }
                
                isSwept, _ := vtxo["isSwept"].(bool)
                if !isSwept {
                    continue
                }
                
                sweptFound++
                
                outpoint, ok := vtxo["outpoint"].(map[string]interface{})
                if !ok {
                    log.Printf("Warning: outpoint missing")
                    continue
                }
                
                txid, _ := outpoint["txid"].(string)
                vout, _ := outpoint["vout"].(float64)
                
                if txid == "" {
                    log.Printf("Warning: txid is empty")
                    continue
                }
                
                if sweptFound <= 5 {  // Log first 5
                    log.Printf("Found swept VTXO #%d: %s:%d in %s (event %d)", sweptFound, txid, int(vout), arrayName, idx)
                }
                
                result, err := DB.NewUpdate().
                    Model((*VTXO)(nil)).
                    Set("tx_type = ?", "offboard").
                    Where("txid = ? AND vout = ?", txid, int(vout)).
                    Exec(ctx)
                
                if err != nil {
                    log.Printf("Error updating VTXO %s:%d: %v", txid, int(vout), err)
                    errors++
                    continue
                }
                
                rows, _ := result.RowsAffected()
                if rows > 0 {
                    updated++
                    if updated <= 5 {
                        log.Printf("✓ Updated VTXO %s:%d to offboard", txid, int(vout))
                    }
                } else {
                    notFoundInDB++
                    if notFoundInDB <= 5 {
                        log.Printf("✗ VTXO %s:%d not found in database", txid, int(vout))
                    }
                }
            }
        }
    }
    
    log.Printf("Backfill complete:")
    log.Printf("  - Found %d swept VTXOs in events", sweptFound)
    log.Printf("  - Updated %d VTXOs to offboard", updated)
    log.Printf("  - %d VTXOs not found in database", notFoundInDB)
    log.Printf("  - %d errors", errors)
}