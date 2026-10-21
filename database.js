const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "taxi.db");

const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {
        console.log("Database error:", err.message);
    }
    else {
        console.log("Connected to SQLite database");
    }

});


db.serialize(() => {

    // Включаем Foreign Key
    db.run("PRAGMA foreign_keys = ON");


    // ==============================
    // PASSENGERS
    // ==============================

    db.run(`
        CREATE TABLE IF NOT EXISTS passengers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            rating REAL DEFAULT 5,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // ==============================
    // DRIVERS
    // ==============================

    db.run(`
        CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            license_number TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'available',
            rating REAL DEFAULT 5,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // ==============================
    // CARS
    // ==============================

    db.run(`
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL UNIQUE,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            plate_number TEXT NOT NULL UNIQUE,
            color TEXT,
            year INTEGER,
            seats INTEGER DEFAULT 4,

            FOREIGN KEY (driver_id)
            REFERENCES drivers(id)
            ON DELETE CASCADE
        )
    `);


    // ==============================
    // TRIPS
    // ==============================

    db.run(`
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            passenger_id INTEGER NOT NULL,
            driver_id INTEGER,
            pickup_address TEXT NOT NULL,
            destination_address TEXT NOT NULL,
            distance REAL,
            price REAL,
            status TEXT DEFAULT 'waiting',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (passenger_id)
            REFERENCES passengers(id),

            FOREIGN KEY (driver_id)
            REFERENCES drivers(id)
        )
    `);


    // ==============================
    // PAYMENTS
    // ==============================

    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL UNIQUE,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            status TEXT DEFAULT 'paid',
            paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (trip_id)
            REFERENCES trips(id)
            ON DELETE CASCADE
        )
    `);


    // ==============================
    // TEST PASSENGERS
    // ==============================

    db.run(`
        INSERT OR IGNORE INTO passengers
        (name, phone, email, rating)

        VALUES
        ('Ramazan', '+77011111111', 'ramazan@gmail.com', 5)
    `);


    db.run(`
        INSERT OR IGNORE INTO passengers
        (name, phone, email, rating)

        VALUES
        ('Ali', '+77022222222', 'ali@gmail.com', 4.8)
    `);


    // ==============================
    // TEST DRIVERS
    // ==============================

    db.run(`
        INSERT OR IGNORE INTO drivers
        (name, phone, license_number, status, rating)

        VALUES
        ('Dias', '+77033333333', 'DRV001', 'available', 4.9)
    `);


    db.run(`
        INSERT OR IGNORE INTO drivers
        (name, phone, license_number, status, rating)

        VALUES
        ('Arman', '+77044444444', 'DRV002', 'available', 4.7)
    `);


    // ==============================
    // TEST CARS
    // ==============================

    db.run(`
        INSERT OR IGNORE INTO cars
        (
            driver_id,
            brand,
            model,
            plate_number,
            color,
            year,
            seats
        )

        SELECT
            id,
            'Toyota',
            'Camry',
            '777ABC02',
            'Black',
            2022,
            4

        FROM drivers

        WHERE license_number = 'DRV001'
    `);


    db.run(`
        INSERT OR IGNORE INTO cars
        (
            driver_id,
            brand,
            model,
            plate_number,
            color,
            year,
            seats
        )

        SELECT
            id,
            'Hyundai',
            'Elantra',
            '123XYZ02',
            'White',
            2021,
            4

        FROM drivers

        WHERE license_number = 'DRV002'
    `);

});


module.exports = db;