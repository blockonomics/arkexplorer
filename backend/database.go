package main

import (
    "database/sql"
    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/mysqldialect"
    _ "github.com/go-sql-driver/mysql"
)

var DB *bun.DB

func InitDB() error {
    sqldb, err := sql.Open("mysql", "root:root@tcp(localhost:3306)/ark?parseTime=true")
    if err != nil {
        return err
    }
    
    DB = bun.NewDB(sqldb, mysqldialect.New())
    return nil
}