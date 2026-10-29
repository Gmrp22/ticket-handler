# ticket-handler-backend

Backend to manage purchase tickets. The data comes from the Excel file of the technical test (`data/tickets-prueba.xlsx`).

**Stack:** Node.js, Express 5, PostgreSQL, Sequelize.

## Requirements

- Node.js 22 or newer
- Docker (it runs PostgreSQL)

## How to run it

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create the `.env` file from the example. You can change the values if you want:

   ```bash
   cp .env.example .env
   ```

3. Start the database and wait until it is `healthy`:

   ```bash
   docker compose up -d
   docker compose ps
   ```

4. Create the tables with the migrations:

   ```bash
   npm run migrate
   ```

5. Load the data of the Excel file:

   ```bash
   npm run import
   ```

   It loads 59 suppliers, 11 lands, 13 products, 367 tickets and 751 items. If the database already has tickets, the import is canceled and it does not duplicate data.

6. Start the server:

   ```bash
   npm run dev
   ```

   The API is at `http://localhost:3000/api`. To check it:

   ```bash
   curl http://localhost:3000/api/suppliers
   ```

## Environment variables

| Variable | Description | Default in `.env.example` |
|---|---|---|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `ticket_handler` |
| `PORT` | Port of the server (optional) | `3000` |
| `CORS_ORIGIN` | Origin of the frontend allowed to call the API (optional) | `http://localhost:5173` |

## Scripts

| Script | What it does |
|---|---|
| `npm start` | Runs the server |
| `npm run dev` | Runs the server and restarts it when a file changes |
| `npm run migrate` | Runs the pending migrations |
| `npm run migrate:undo` | Undoes the last migration |
| `npm run import` | Loads the Excel data into the database. Run it after the migrations |
| `npm run format` | Formats the code with Prettier |
| `npm run format:check` | Checks the format without changing anything |

## Start again from zero

This deletes the database and its data:

```bash
docker compose down -v
docker compose up -d
npm run migrate
npm run import
```

## Data model

- `suppliers`, `lands` and `products`: each has `id`, `code` (unique) and `name`.
- `tickets`: `code` (unique), `date`, and the supplier and land of the purchase.
- `ticket_items`: the lines of a ticket, with the product, `quantity` and `price`.

The total of a ticket is not stored, it is calculated from its items.

## Project structure

```
src/
├── config/        database connection and configuration
├── controllers/   read the request and send the response
├── middlewares/   global error handler
├── migrations/    create the tables
├── models/        describe the tables and their relations
├── routes/        URLs of the API
├── scripts/       import of the Excel file
├── services/      queries to the database and business errors
├── utils/         custom errors
├── app.js         Express configuration
└── server.js      connects to the database and starts the server
```

## More documentation

- [API for the frontend](docs/api.md)
- [Analysis of the Excel file and technical decisions](docs/analysis-and-decisions.md)
