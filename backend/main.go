package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
)

func main() {
		backfill := flag.Bool("backfill", false, "Backfill events from database")
    flag.Parse()
    if err := InitDB(); err != nil {
        log.Fatal(err)
    }
    
    ctx := context.Background()
    
    DB.NewCreateTable().Model((*Events)(nil)).IfNotExists().Exec(ctx)
    DB.NewCreateTable().Model((*VTXO)(nil)).IfNotExists().Exec(ctx)
    DB.NewCreateTable().Model((*NetworkStats)(nil)).IfNotExists().Exec(ctx)
    
    fmt.Println("Successfully connected to database!")
    
    if *backfill {
        BackfillEvents()
        return  // Exit after backfill
    }
    
    // Start background jobs
    go ConsumeSSEStream("https://arkade.computer/v1/txs")
    go StartStatsUpdater()
    
    // Setup HTTP routes
    http.HandleFunc("/api/stats", GetStats)
    http.HandleFunc("/api/recent-transactions", GetRecentTxs)
    http.HandleFunc("/api/search", SearchTx)
    
    fmt.Println("Server starting on :5173...")
    log.Fatal(http.ListenAndServe(":5173", nil))
}