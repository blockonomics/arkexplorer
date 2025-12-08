package main

import (
    "context"
    "flag"
    "fmt"
    "log"
    "net/http"
)

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next(w, r)
    }
}

func main() {
    backfill := flag.Bool("backfill", false, "Backfill events from database")
    enableCors := flag.Bool("enable-cors", false, "Enable CORS for API endpoints")
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
        return // Exit after backfill
    }

    // Start background jobs
    go ConsumeSSEStream("https://arkade.computer/v1/txs")
    go StartStatsUpdater()

    // Setup HTTP routes
    if *enableCors {
        http.HandleFunc("/api/stats", enableCORS(GetStats))
        http.HandleFunc("/api/recent-transactions", enableCORS(GetRecentTxs))
        http.HandleFunc("/api/search", enableCORS(SearchTx))
    } else {
        http.HandleFunc("/api/stats", GetStats)
        http.HandleFunc("/api/recent-transactions", GetRecentTxs)
        http.HandleFunc("/api/search", SearchTx)
    }

    fmt.Println("Server starting on :8080...")
    log.Fatal(http.ListenAndServe(":8080", nil))
}