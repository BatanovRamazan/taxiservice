const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");

const db = require("./database");

const app = express();
const port = 3000;


// View Engine
app.engine(
    "handlebars",
    engine({
        defaultLayout: "main"
    })
);

app.set("view engine", "handlebars");

app.set(
    "views",
    path.join(__dirname, "views")
);


// Middleware
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// Logging
app.use((req, res, next) => {

    console.log(req.method, req.url);

    next();
});


// Home page
app.get("/", (req, res) => {

    res.render("home", {
        title: "Taxi Service"
    });

});


// Trips page
app.get("/trips", (req, res) => {

    const sql = `
        SELECT
            trips.id,
            trips.pickup_address,
            trips.destination_address,
            trips.distance,
            trips.price,
            trips.status,
            trips.created_at,
            passengers.name AS passenger_name,
            drivers.name AS driver_name

        FROM trips

        LEFT JOIN passengers
        ON trips.passenger_id = passengers.id

        LEFT JOIN drivers
        ON trips.driver_id = drivers.id

        ORDER BY trips.id DESC
    `;


    db.all(
        sql,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).send(
                    "Database error"
                );
            }


            res.render("trips", {
                title: "Trips",
                trips: rows
            });

        }
    );

});


// Get all passengers
app.get("/api/passengers", (req, res) => {

    db.all(
        "SELECT * FROM passengers",
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            res.status(200).json(rows);

        }
    );

});


// Get one passenger
app.get("/api/passengers/:id", (req, res) => {

    const id = Number(req.params.id);


    db.get(
        "SELECT * FROM passengers WHERE id = ?",
        [id],
        (err, passenger) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            if (!passenger) {

                return res.status(404).json({
                    error: "Passenger not found"
                });
            }


            res.status(200).json(passenger);

        }
    );

});


// Get all drivers
app.get("/api/drivers", (req, res) => {

    db.all(
        "SELECT * FROM drivers",
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            res.status(200).json(rows);

        }
    );

});


// Get all cars
app.get("/api/cars", (req, res) => {

    const sql = `
        SELECT
            cars.*,
            drivers.name AS driver_name

        FROM cars

        JOIN drivers
        ON cars.driver_id = drivers.id
    `;


    db.all(
        sql,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            res.status(200).json(rows);

        }
    );

});


// Get all trips
app.get("/api/trips", (req, res) => {

    const sql = `
        SELECT
            trips.*,
            passengers.name AS passenger_name,
            drivers.name AS driver_name

        FROM trips

        LEFT JOIN passengers
        ON trips.passenger_id = passengers.id

        LEFT JOIN drivers
        ON trips.driver_id = drivers.id

        ORDER BY trips.id
    `;


    db.all(
        sql,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            res.status(200).json(rows);

        }
    );

});


// Get trip as XML
app.get("/api/trips/:id/xml", (req, res) => {

    const id = Number(req.params.id);


    db.get(
        "SELECT * FROM trips WHERE id = ?",
        [id],
        (err, trip) => {

            if (err) {

                return res.status(500).send(
                    "Database error"
                );
            }


            if (!trip) {

                return res
                    .status(404)
                    .type("application/xml")
                    .send(`
                        <error>
                            Trip not found
                        </error>
                    `);
            }


            res
                .status(200)
                .type("application/xml")
                .send(`
                    <trip>
                        <id>${trip.id}</id>
                        <passenger_id>${trip.passenger_id}</passenger_id>
                        <driver_id>${trip.driver_id || ""}</driver_id>
                        <pickup_address>${trip.pickup_address}</pickup_address>
                        <destination_address>${trip.destination_address}</destination_address>
                        <distance>${trip.distance || 0}</distance>
                        <price>${trip.price || 0}</price>
                        <status>${trip.status}</status>
                    </trip>
                `);

        }
    );

});


// Get one trip
app.get("/api/trips/:id", (req, res) => {

    const id = Number(req.params.id);


    if (!Number.isInteger(id)) {

        return res.status(400).json({
            error: "Trip ID must be a number"
        });
    }


    const sql = `
        SELECT
            trips.*,
            passengers.name AS passenger_name,
            drivers.name AS driver_name

        FROM trips

        LEFT JOIN passengers
        ON trips.passenger_id = passengers.id

        LEFT JOIN drivers
        ON trips.driver_id = drivers.id

        WHERE trips.id = ?
    `;


    db.get(
        sql,
        [id],
        (err, trip) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            if (!trip) {

                return res.status(404).json({
                    error: "Trip not found"
                });
            }


            res.status(200).json(trip);

        }
    );

});


// Create trip
app.post("/api/trips", (req, res) => {

    const {
        passenger_id,
        pickup_address,
        destination_address,
        distance
    } = req.body;


    if (
        passenger_id === undefined ||
        !pickup_address ||
        !destination_address
    ) {

        return res.status(400).json({
            error: "Required fields are missing"
        });
    }


    if (typeof passenger_id !== "number") {

        return res.status(400).json({
            error: "Passenger ID must be a number"
        });
    }


    if (
        distance !== undefined &&
        (
            typeof distance !== "number" ||
            distance < 0
        )
    ) {

        return res.status(400).json({
            error: "Distance must be a positive number"
        });
    }


    db.get(
        "SELECT * FROM passengers WHERE id = ?",
        [passenger_id],
        (err, passenger) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            if (!passenger) {

                return res.status(404).json({
                    error: "Passenger not found"
                });
            }


            let price = null;


            if (distance !== undefined) {
                price = distance * 150;
            }


            const sql = `
                INSERT INTO trips
                (
                    passenger_id,
                    pickup_address,
                    destination_address,
                    distance,
                    price,
                    status
                )

                VALUES (?, ?, ?, ?, ?, ?)
            `;


            db.run(
                sql,
                [
                    passenger_id,
                    pickup_address,
                    destination_address,
                    distance || null,
                    price,
                    "waiting"
                ],

                function(err) {

                    if (err) {

                        return res.status(500).json({
                            error: "Could not create trip"
                        });
                    }


                    res.status(201).json({

                        message: "Trip created",

                        trip: {
                            id: this.lastID,
                            passenger_id: passenger_id,
                            driver_id: null,
                            pickup_address: pickup_address,
                            destination_address: destination_address,
                            distance: distance || null,
                            price: price,
                            status: "waiting"
                        }

                    });

                }
            );

        }
    );

});


// Update trip
app.put("/api/trips/:id", (req, res) => {

    const id = Number(req.params.id);


    const {
        driver_id,
        pickup_address,
        destination_address,
        distance,
        status
    } = req.body;


    const allowedStatuses = [
        "waiting",
        "accepted",
        "in_progress",
        "completed",
        "cancelled"
    ];


    db.get(
        "SELECT * FROM trips WHERE id = ?",
        [id],
        (err, trip) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            if (!trip) {

                return res.status(404).json({
                    error: "Trip not found"
                });
            }


            if (
                status &&
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({
                    error: "Invalid trip status"
                });
            }


            if (
                driver_id !== undefined &&
                driver_id !== null &&
                typeof driver_id !== "number"
            ) {

                return res.status(400).json({
                    error: "Driver ID must be a number"
                });
            }


            if (
                distance !== undefined &&
                (
                    typeof distance !== "number" ||
                    distance < 0
                )
            ) {

                return res.status(400).json({
                    error: "Distance must be a positive number"
                });
            }


            const updateTrip = () => {

                const newDriverId =
                    driver_id !== undefined
                        ? driver_id
                        : trip.driver_id;


                const newPickup =
                    pickup_address ||
                    trip.pickup_address;


                const newDestination =
                    destination_address ||
                    trip.destination_address;


                const newDistance =
                    distance !== undefined
                        ? distance
                        : trip.distance;


                let newPrice = trip.price;


                if (newDistance !== null) {
                    newPrice = newDistance * 150;
                }


                const newStatus =
                    status ||
                    trip.status;


                const sql = `
                    UPDATE trips

                    SET
                        driver_id = ?,
                        pickup_address = ?,
                        destination_address = ?,
                        distance = ?,
                        price = ?,
                        status = ?

                    WHERE id = ?
                `;


                db.run(
                    sql,
                    [
                        newDriverId,
                        newPickup,
                        newDestination,
                        newDistance,
                        newPrice,
                        newStatus,
                        id
                    ],

                    function(err) {

                        if (err) {

                            return res.status(500).json({
                                error: "Could not update trip"
                            });
                        }


                        res.status(200).json({

                            message: "Trip updated",

                            trip: {
                                id: id,
                                passenger_id: trip.passenger_id,
                                driver_id: newDriverId,
                                pickup_address: newPickup,
                                destination_address: newDestination,
                                distance: newDistance,
                                price: newPrice,
                                status: newStatus
                            }

                        });

                    }
                );

            };


            if (
                driver_id !== undefined &&
                driver_id !== null
            ) {

                db.get(
                    "SELECT * FROM drivers WHERE id = ?",
                    [driver_id],
                    (err, driver) => {

                        if (err) {

                            return res.status(500).json({
                                error: "Database error"
                            });
                        }


                        if (!driver) {

                            return res.status(404).json({
                                error: "Driver not found"
                            });
                        }


                        updateTrip();

                    }
                );

            }
            else {

                updateTrip();

            }

        }
    );

});


// Delete trip
app.delete("/api/trips/:id", (req, res) => {

    const id = Number(req.params.id);


    db.run(
        "DELETE FROM trips WHERE id = ?",
        [id],

        function(err) {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            if (this.changes === 0) {

                return res.status(404).json({
                    error: "Trip not found"
                });
            }


            res.status(200).json({
                message: "Trip deleted"
            });

        }
    );

});


// Get payments
app.get("/api/payments", (req, res) => {

    db.all(
        "SELECT * FROM payments",
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            res.status(200).json(rows);

        }
    );

});


// Create payment
app.post("/api/payments", (req, res) => {

    const {
        trip_id,
        amount,
        method
    } = req.body;


    if (
        trip_id === undefined ||
        amount === undefined ||
        !method
    ) {

        return res.status(400).json({
            error: "trip_id, amount and method are required"
        });
    }


    if (
        typeof trip_id !== "number" ||
        typeof amount !== "number"
    ) {

        return res.status(400).json({
            error: "trip_id and amount must be numbers"
        });
    }


    if (amount <= 0) {

        return res.status(400).json({
            error: "Amount must be greater than zero"
        });
    }


    const allowedMethods = [
        "cash",
        "card"
    ];


    if (!allowedMethods.includes(method)) {

        return res.status(400).json({
            error: "Payment method must be cash or card"
        });
    }


    db.get(
        "SELECT * FROM trips WHERE id = ?",
        [trip_id],
        (err, trip) => {

            if (err) {

                return res.status(500).json({
                    error: "Database error"
                });
            }


            if (!trip) {

                return res.status(404).json({
                    error: "Trip not found"
                });
            }


            const sql = `
                INSERT INTO payments
                (
                    trip_id,
                    amount,
                    method,
                    status
                )

                VALUES (?, ?, ?, ?)
            `;


            db.run(
                sql,
                [
                    trip_id,
                    amount,
                    method,
                    "paid"
                ],

                function(err) {

                    if (err) {

                        if (
                            err.code ===
                            "SQLITE_CONSTRAINT"
                        ) {

                            return res.status(409).json({
                                error: "Payment for this trip already exists"
                            });
                        }


                        return res.status(500).json({
                            error: "Could not create payment"
                        });
                    }


                    res.status(201).json({

                        message: "Payment registered",

                        payment: {
                            id: this.lastID,
                            trip_id: trip_id,
                            amount: amount,
                            method: method,
                            status: "paid"
                        }

                    });

                }
            );

        }
    );

});


// 404
app.use((req, res) => {

    res.status(404).json({
        error: "Endpoint not found"
    });

});


// Error handler
app.use((err, req, res, next) => {

    console.log(err);

    res.status(500).json({
        error: "Internal server error"
    });

});


// Start server
app.listen(port, () => {

    console.log(
        `Server is running on http://localhost:${port}`
    );

});