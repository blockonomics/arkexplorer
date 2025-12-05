package main

import (
	"encoding/json"
	"bufio"
	"fmt"
	"log"
	"context"
	"database/sql"
	"net/http"
	"strings"
	"time"
    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/mysqldialect"
    _ "github.com/go-sql-driver/mysql"
)

type Events struct {
    Timestamp_ms int64  `bun:",pk"`
    Eventdata    string `bun:",type:text,notnull"`
}


func main() {
	  // Connect to database
sqldb, err := sql.Open("mysql", "root:root@tcp(localhost:3306)/ark?parseTime=true")
if err != nil {
    panic(err)
}
db := bun.NewDB(sqldb, mysqldialect.New())	  

ctx := context.Background()
 // Create table
    _, err = db.NewCreateTable().Model((*Events)(nil)).IfNotExists().Exec(ctx)
    if err != nil {
        panic(err)
    }



	fmt.Println("Successfully connected to the database!")

	// 2. Start the SSE client to consume the stream
	sseURL := "https://arkade.computer/v1/txs" // Replace with your actual SSE source URL
	go consumeSSEStream(sseURL)

	// Keep the main function running
	fmt.Println("Web server running, waiting for events...")
	select {}
}

func consumeSSEStream(url string) {
	client := &http.Client{Timeout: 0} // No timeout for long-lived SSE connection
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Fatalf("Error creating request: %v", err)
	}
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Connection", "keep-alive")

	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Error connecting to SSE stream: %v", err)
	}
	defer resp.Body.Close()

	reader := bufio.NewReader(resp.Body)

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			log.Printf("Stream read error: %v. Reconnecting in 5 seconds...", err)
			time.Sleep(5 * time.Second)
			go consumeSSEStream(url) // Attempt reconnection
			return
		}

		line = strings.TrimSpace(line)
		go processEvent(line)
		}
}

func processEvent(data string) {
	if strings.HasPrefix(data, "data"){
		// Unmarshal the JSON string into the map
		var jsonData map[string]interface{}
		err := json.Unmarshal([]byte(data[6:]), &jsonData)
		if err != nil {
			fmt.Println("Error unmarshaling JSON:", err)
			return
		}
		if _, ok := jsonData["heartbeat"]; ok{
			//Don't record heartbeat events
			return
		}
		now := time.Now()
		unixMilliseconds := now.UnixMilli()
		event := &Events{Timestamp_ms: unixMilliseconds, Eventdata: data[6:]}
		ctx := context.Background()
		//TODO: Reuse database connection established in main
		sqldb, err := sql.Open("mysql", "root:root@tcp(localhost:3306)/ark?parseTime=true")
		if err != nil {
			panic(err)
		}
		db := bun.NewDB(sqldb, mysqldialect.New())	  
		_, err = db.NewInsert().Model(event).Exec(ctx)
		if err != nil {
			panic(err)
		}

		fmt.Println(jsonData)
	}
}

