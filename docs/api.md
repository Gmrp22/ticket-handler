# API documentation

Everything the frontend needs to know to use this API.

## General

- **Base URL:** `http://localhost:3000/api` (the port comes from `PORT`, and it is 3000 by default).
- **Format:** JSON. Requests with a body need the header `Content-Type: application/json`.
- **CORS:** only the frontend origin `http://localhost:5173` can call the API (it can be changed with `CORS_ORIGIN`).
- **Authentication:** none.
- **Ids:** numbers. They are in the URL (`/suppliers/1`).

## Errors

Every error has the same shape:

```json
{ "status": 404, "error": "Supplier not found" }
```

`error` is a text. It can also be a list of texts.

| Status | When |
|---|---|
| `400` | Invalid JSON body, an invalid `sort` or `order`, or a ticket points to a supplier, land or product that does not exist |
| `404` | The resource does not exist |
| `409` | A `code` already exists, or the resource cannot be deleted because it is used by tickets |
| `500` | Server error. The message is always `Internal Server Error` |

Not validated yet: a missing field (for example a `POST` without `name`) or an `id` that is not a number answer `500`, not `400`.

## Things to keep in mind

- **Decimal numbers come as text.** `quantity`, `price` and `total` are strings like `"1475.000"`. Convert them with `Number(...)` before doing math.
- **Dates** are `YYYY-MM-DD` (for example `"2023-01-07"`) for `date`. `createdAt` and `updatedAt` are full ISO dates.
- **The ticket total is calculated** by the API (sum of `quantity x price` of its items). It is never sent in a request.
- **`DELETE` answers `204` with no body.** Do not call `response.json()` on it.
- **Related data keeps the model name** as key: `Supplier`, `Land`, `TicketItems`, `Product`.

## Suppliers, lands and products

The three resources work the same. Replace `suppliers` with `lands` or `products`.

Object:

```json
{ "id": 1, "code": "SUP009", "name": "Vendor Iota Trading", "createdAt": "...", "updatedAt": "..." }
```

| Method | URL | Body | Success | Errors |
|---|---|---|---|---|
| `GET` | `/suppliers` | | `200`, list of objects ordered by `id` (no pagination) | |
| `GET` | `/suppliers/:id` | | `200`, one object | `404` |
| `POST` | `/suppliers` | `{ "code": "SUP999", "name": "Name" }` | `201`, the created object | `409` code already exists |
| `PUT` | `/suppliers/:id` | `{ "code": "SUP999", "name": "Name" }` | `200`, the updated object | `404`, `409` code already exists |
| `DELETE` | `/suppliers/:id` | | `204` | `404`, `409` it has tickets |

For `products`, the `409` on delete means "it is used in tickets".

## Tickets

### List

`GET /tickets?page=1&limit=20&sort=date&order=desc`

- `page` starts at 1 (default 1). `limit` is the size of the page (default 20, maximum 100).
- `sort` is the field to sort by: `date` (default), `code` or `id`. `order` is `asc` or `desc` (default `desc`). Any other value answers `400`.
- The items are **not** included in the list.

```json
{
  "data": [
    {
      "id": 1,
      "code": "1115651",
      "date": "2023-01-07",
      "supplier_id": 1,
      "land_id": 1,
      "total": "6845.000",
      "createdAt": "...",
      "updatedAt": "...",
      "Supplier": { "id": 1, "code": "SUP009", "name": "Vendor Iota Trading" },
      "Land": { "id": 1, "code": "LOC010", "name": "Processing Hub 2" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 367, "totalPages": 19 }
}
```

### One ticket

`GET /tickets/:id` answers `200` with the ticket and its items. `404` if it does not exist.

```json
{
  "id": 1,
  "code": "1115651",
  "date": "2023-01-07",
  "supplier_id": 1,
  "land_id": 1,
  "total": "6845.000",
  "Supplier": { "id": 1, "code": "SUP009", "name": "Vendor Iota Trading" },
  "Land": { "id": 1, "code": "LOC010", "name": "Processing Hub 2" },
  "TicketItems": [
    {
      "id": 1,
      "ticket_id": 1,
      "product_id": 1,
      "quantity": "1475.000",
      "price": "0.700",
      "Product": { "id": 1, "code": "PRD003", "name": "Product Gamma" }
    }
  ]
}
```

### Create

`POST /tickets`

```json
{
  "code": "1234567",
  "date": "2023-03-01",
  "supplier_id": 1,
  "land_id": 1,
  "items": [
    { "product_id": 1, "quantity": 100, "price": 0.7 },
    { "product_id": 2, "quantity": 50, "price": 1.25 }
  ]
}
```

- `201` with the full ticket, like `GET /tickets/:id`.
- `409` if the `code` already exists.
- `400` if `supplier_id`, `land_id` or a `product_id` does not exist.
- The same product can be in more than one item.

### Update

`PUT /tickets/:id` with the same body as the create. It **replaces** the ticket and **all** its items, so send the full list of items.

- `200` with the full ticket.
- `404` if the ticket does not exist.
- `409` and `400` like the create.

### Delete

`DELETE /tickets/:id` answers `204`. Its items are deleted too. `404` if it does not exist.

## Weekly payments

`GET /payments?year=2023&week=3&sort=name&order=asc`

What we pay to each supplier in one ISO week (the week starts on Monday), with the tickets that make each payment.

- `year` is the ISO year and `week` is the ISO week (1 to 53). Both are required.
- The ISO year can be different from the year of the date. For example, 2024-12-30 is week 1 of 2025.
- `sort` is the field to sort the suppliers by: `name` (default) or `code`. `order` is `asc` (default) or `desc`. Any other value answers `400`. The tickets of each supplier are always ordered by `date`.
- `400` if `year` (1900 to 2100) or `week` (1 to 53) is missing or is not a whole number.
- A week without tickets answers `200` with `"suppliers": []` and `"total": "0.000"`.
- A ticket with all its items in quantity 0 is included, with total `"0.000"`.
- The items of a ticket are not included. Use `GET /tickets/:id` to see them.

```json
{
  "year": 2023,
  "week": 3,
  "total": "12345.000",
  "suppliers": [
    {
      "supplier": { "id": 1, "code": "SUP009", "name": "Vendor Iota Trading" },
      "total": "6845.000",
      "tickets": [
        { "id": 1, "code": "1115651", "date": "2023-01-16", "total": "6845.000" }
      ]
    }
  ]
}
```

## Not available yet

- Filter by `code`.
- Validation of the request data.
