# Taxi Service

Node.js + Express web service for managing taxi trips, passengers, drivers, cars and payments.

## REST API Endpoints

| Method | Endpoint | Description | Request | Response | Status |
|---|---|---|---|---|---|
| GET | /api/passengers | Get all passengers | - | JSON | 200 |
| GET | /api/passengers/:id | Get one passenger | id | JSON | 200 / 404 |
| GET | /api/drivers | Get all drivers | - | JSON | 200 |
| GET | /api/cars | Get all cars | - | JSON | 200 |
| GET | /api/trips | Get all trips | - | JSON | 200 |
| GET | /api/trips/:id | Get one trip | id | JSON | 200 / 404 |
| POST | /api/trips | Create a new trip | JSON | JSON | 201 / 400 |
| PUT | /api/trips/:id | Update trip or assign driver | JSON | JSON | 200 / 400 / 404 |
| DELETE | /api/trips/:id | Delete trip | id | JSON | 200 / 404 |
| GET | /api/trips/:id/xml | Get trip in XML format | id | XML | 200 / 404 |
| GET | /api/payments | Get all payments | - | JSON | 200 |
| POST | /api/payments | Register payment | JSON | JSON | 201 / 400 / 409 |
## Main Resources

- Passenger
- Driver
- Car
- Trip
- Payment
## Technologies

- Node.js
- Express
- SQLite
- Handlebars
- JSON
- XML
## Run Project

Install dependencies:

```bash
npm install

Start server:
node app.js

Open:
http://localhost:3000
