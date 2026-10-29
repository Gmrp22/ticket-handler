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

`error` is a text. For `400` errors of invalid data it is a list of texts, one per wrong field:

```json
{ "status": 400, "error": ["code: cannot be empty", "items.0.price: must be a number"] }
```

The text starts with the path of the field (`items.0.price` is the price of the first item), then says what is wrong: `is required`, `must be a whole number`, `cannot be negative`...

| Status | When |
|---|---|
| `400` | Invalid JSON body, invalid data (a missing field, a wrong type, an `id` that is not a number, an invalid `sort`, `order`, `page` or `limit`), or a ticket points to a supplier, land or product that does not exist |
| `404` | The resource or the route does not exist |
| `409` | A `code` already exists, or the resource cannot be deleted because it is used by tickets |
| `500` | Server error. The message is always `Internal Server Error` |

The data of every request is validated before it is used:

- `code` and `name` are required texts, not empty, up to 255 characters.
- An `id` in the URL must be a whole number greater than 0.
- A ticket needs `code`, `date` (`YYYY-MM-DD`, a real date), `supplierId`, `landId` and at least one item. Every item needs `productId`, `quantity` and `price`, which are numbers from 0 up.
- Fields that are not part of the request are ignored.

## Things to keep in mind

- **Decimal numbers come as text.** `quantity`, `price` and `total` are strings like `"1475.000"`. Convert them with `Number(...)` before doing math.
- **Dates** are `YYYY-MM-DD` (for example `"2023-01-07"`) for `date`. `createdAt` and `updatedAt` are full ISO dates.
- **The ticket total is calculated** by the API (sum of `quantity x price` of its items). It is never sent in a request.
- **`DELETE` answers `204` with no body.** Do not call `response.json()` on it.
- **Names are in camelCase**, in the requests and in the responses: `supplierId`, `createdAt`. Related data uses the lowercase name: `supplier`, `land`, `items`, `product`.

## Suppliers, lands and products

The three resources work the same. Replace `suppliers` with `lands` or `products`.

Object:

```json
{ "id": 1, "code": "SUP009", "name": "Vendor Iota Trading", "createdAt": "...", "updatedAt": "..." }
```

| Method | URL | Body | Success | Errors |
|---|---|---|---|---|
| `GET` | `/suppliers` | | `200`, list of objects (no pagination). It can be sorted, see below | `400` invalid `sort` or `order` |
| `GET` | `/suppliers/:id` | | `200`, one object | `404` |
| `POST` | `/suppliers` | `{ "code": "SUP999", "name": "Name" }` | `201`, the created object | `409` code already exists |
| `PUT` | `/suppliers/:id` | `{ "code": "SUP999", "name": "Name" }` | `200`, the updated object | `404`, `409` code already exists |
| `DELETE` | `/suppliers/:id` | | `204` | `404`, `409` it has tickets |

For `products`, the `409` on delete means "it is used in tickets".

The list can be sorted, and it is optional: `GET /suppliers?sort=name&order=desc`. `sort` is `id` (default), `code` or `name`. `order` is `asc` (default) or `desc`. Without them the list comes by `id`, from the first to the last. Any other value answers `400`.

## Tickets

### List

`GET /tickets?page=1&limit=20&sort=date&order=desc`

- `page` starts at 1 (default 1). `limit` is the size of the page (default 20, maximum 100, a bigger number answers `400`).
- `sort` is the field to sort by: `date` (default), `code` or `id`. `order` is `asc` or `desc` (default `desc`). Any other value answers `400`.
- The items are **not** included in the list.

```json
{
  "data": [
    {
      "id": 1,
      "code": "1115651",
      "date": "2023-01-07",
      "supplierId": 1,
      "landId": 1,
      "total": "6845.000",
      "createdAt": "...",
      "updatedAt": "...",
      "supplier": { "id": 1, "code": "SUP009", "name": "Vendor Iota Trading" },
      "land": { "id": 1, "code": "LOC010", "name": "Processing Hub 2" }
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
  "supplierId": 1,
  "landId": 1,
  "total": "6845.000",
  "supplier": { "id": 1, "code": "SUP009", "name": "Vendor Iota Trading" },
  "land": { "id": 1, "code": "LOC010", "name": "Processing Hub 2" },
  "items": [
    {
      "id": 1,
      "ticketId": 1,
      "productId": 1,
      "quantity": "1475.000",
      "price": "0.700",
      "product": { "id": 1, "code": "PRD003", "name": "Product Gamma" }
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
  "supplierId": 1,
  "landId": 1,
  "items": [
    { "productId": 1, "quantity": 100, "price": 0.7 },
    { "productId": 2, "quantity": 50, "price": 1.25 }
  ]
}
```

- `201` with the full ticket, like `GET /tickets/:id`.
- `409` if the `code` already exists.
- `400` if `supplierId`, `landId` or a `productId` does not exist.
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
- An ISO year has 52 or 53 weeks. Week 53 only exists in some years (for example 2020 and 2026). In the other years (for example 2022 and 2023) it answers `400` with `week: the year 2022 only has 52 weeks`, it does not move to the next year.
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
  "total": "67143.047",
  "suppliers": [
    {
      "supplier": { "id": 1, "code": "SUP009", "name": "Vendor Iota Trading" },
      "total": "1747.200",
      "tickets": [
        { "id": 213, "code": "1114474", "date": "2023-01-16", "total": "1747.200" }
      ]
    }
  ]
}
```

## Not available yet

- Filter by `code`.
