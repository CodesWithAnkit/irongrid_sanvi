# Sanvi API Reference

Base URL: http://localhost:3001/api

Authentication: Cookie-based JWT
- accessToken: HttpOnly cookie, 15m expiry
- refreshToken: HttpOnly cookie, 7d expiry
- SameSite: lax (dev) / none (prod), Secure in prod
- Frontend must send credentials (withCredentials: true)

Content-Type: application/json for request/response unless noted.

Swagger UI: http://localhost:3001/api/docs

---

## Auth

All routes under `/auth` are unprefixed here; remember the global `/api` prefix in URLs.

### POST /auth/login
Authenticate and set cookies.

Request
```json
{
  "email": "admin@sanvi.local",
  "password": "Admin@12345"
}
```

Response 200
```json
{
  "user": { "id": 1, "email": "admin@sanvi.local" }
}
```
- Sets `Set-Cookie: accessToken=...; HttpOnly` and `refreshToken=...; HttpOnly`.

Errors
- 401 Unauthorized: `{ "statusCode": 401, "message": "Invalid credentials", "error": "Unauthorized" }`
- 400 Bad Request (validation): `{ "statusCode": 400, "message": ["email must be an email", ...], "error": "Bad Request" }`

### POST /auth/logout
Clears cookies.

Response 200
```json
{ "ok": true }
```

### POST /auth/refresh
Rotate tokens (requires valid `refreshToken` cookie via `jwt-refresh` guard).

Response 200
```json
{ "ok": true }
```
- Sets new `accessToken` and `refreshToken` cookies.

Errors
- 401 Unauthorized on invalid/missing refresh token.

### GET /auth/me
Get current user profile (requires `accessToken`).

Response 200
```json
{ "id": 1, "email": "admin@sanvi.local", "firstName": null, "lastName": null }
```

Errors
- 401 Unauthorized

---

## Customers
Resource: `/customers` (all endpoints require `accessToken`).

Customer object
```json
{
  "id": 1,
  "name": "Acme Corp",
  "email": "buyer@acme.com",
  "phone": "+91-9999999999",
  "company": "Acme",
  "address": "Pune, MH",
  "createdAt": "2025-08-24T11:00:00.000Z",
  "updatedAt": "2025-08-24T11:00:00.000Z"
}
```

### POST /customers
Create a customer.

Request
```json
{ "name": "Acme Corp", "email": "buyer@acme.com", "phone": "", "company": "Acme", "address": "Pune" }
```

Response 201
```json
{ "id": 1, "name": "Acme Corp", "email": "buyer@acme.com", "phone": "", "company": "Acme", "address": "Pune", "createdAt": "...", "updatedAt": "..." }
```

Errors
- 400 Bad Request (validation)
- 401 Unauthorized

### GET /customers?skip=0&take=20
List customers (newest first).

Response 200
```json
[
  { "id": 1, "name": "Acme Corp", "email": "buyer@acme.com", "phone": "", "company": "Acme", "address": "Pune", "createdAt": "...", "updatedAt": "..." }
]
```

### GET /customers/:id
Get one customer.

Response 200
```json
{ "id": 1, "name": "Acme Corp", "email": "buyer@acme.com", "phone": "", "company": "Acme", "address": "Pune", "createdAt": "...", "updatedAt": "..." }
```
- Note: returns `null` if not found (no 404 thrown in current implementation).

### PATCH /customers/:id
Update a customer.

Request
```json
{ "name": "Acme India" }
```

Response 200
```json
{ "id": 1, "name": "Acme India", "email": "buyer@acme.com", "phone": "", "company": "Acme", "address": "Pune", "createdAt": "...", "updatedAt": "..." }
```

Errors
- 400 Bad Request (validation)
- 401 Unauthorized

### DELETE /customers/:id
Delete a customer.

Response 200
- Returns the deleted record
```json
{ "id": 1, "name": "Acme India", "email": "buyer@acme.com", "phone": "", "company": "Acme", "address": "Pune", "createdAt": "...", "updatedAt": "..." }
```

Errors
- 401 Unauthorized

---

## Quotations
Resource: `/quotations` (all endpoints require `accessToken`).

Quotation object (selected fields)
```json
{
  "id": 10,
  "quotationNumber": "Q-20250824...",
  "customerId": 1,
  "status": "DRAFT",
  "subtotal": "1000.00",
  "discountTotal": "50.00",
  "taxTotal": "0.00",
  "total": "950.00",
  "validUntil": "2025-09-01T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "...",
  "createdByUserId": 1
}
```

Quotation item
```json
{
  "id": 1,
  "quotationId": 10,
  "productId": 5,
  "quantity": 2,
  "unitPrice": "500.00",
  "discount": "50.00",
  "total": "950.00"
}
```

### POST /quotations
Create a quotation with line items.

Request
```json
{
  "customerId": 1,
  "validUntil": "2025-09-01",
  "items": [
    { "productId": 5, "quantity": 2, "unitPrice": 500, "discount": 50 }
  ]
}
```

Response 201
```json
{
  "id": 10,
  "quotationNumber": "Q-20250824-001",
  "customerId": 1,
  "status": "DRAFT",
  "subtotal": "1000.00",
  "discountTotal": "50.00",
  "taxTotal": "0.00",
  "total": "950.00",
  "validUntil": "2025-09-01T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "...",
  "createdByUserId": 1,
  "items": [
    { "id": 1, "quotationId": 10, "productId": 5, "quantity": 2, "unitPrice": "500.00", "discount": "50.00", "total": "950.00" }
  ]
}
```

Errors
- 400 Bad Request: validation (e.g., missing items/customerId)
- 500 Internal Server Error: `{ "statusCode": 500, "message": "Quotation requires at least one item" }` (current behavior)
- 401 Unauthorized

### GET /quotations?skip=0&take=20
List quotations (newest first).

Response 200
```json
[
  {
    "id": 10,
    "quotationNumber": "Q-...",
    "customerId": 1,
    "status": "DRAFT",
    "subtotal": "1000.00",
    "discountTotal": "50.00",
    "taxTotal": "0.00",
    "total": "950.00",
    "validUntil": "2025-09-01T00:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "...",
    "createdByUserId": 1,
    "customer": {
      "id": 1,
      "name": "Acme Corp",
      "email": "buyer@acme.com",
      "phone": "",
      "company": "Acme",
      "address": "Pune",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
]
```

### GET /quotations/:id
Get a quotation with items and customer.

Response 200
```json
{
  "id": 10,
  "quotationNumber": "Q-...",
  "status": "DRAFT",
  "subtotal": "1000.00",
  "discountTotal": "50.00",
  "taxTotal": "0.00",
  "total": "950.00",
  "validUntil": "2025-09-01T00:00:00.000Z",
  "items": [ { "id": 1, "productId": 5, "quantity": 2, "unitPrice": "500.00", "discount": "50.00", "total": "950.00" } ],
  "customer": { "id": 1, "name": "Acme Corp" }
}
```
- Note: returns `null` if not found.

### PATCH /quotations/:id
Update status or validity.

Request
```json
{ "status": "SENT", "validUntil": "2025-09-15" }
```

Response 200
```json
{
  "id": 10,
  "status": "SENT",
  "validUntil": "2025-09-15T00:00:00.000Z",
  "items": [ ... ]
}
```

### DELETE /quotations/:id
Delete quotation.

Response 200
- Returns deleted record

### POST /quotations/:id/email
Send quotation via email.

Request
```json
{ "email": "recipient@example.com" }
```

Response 200 (sent)
```json
{ "status": "sent", "messageId": "<abc@mailer>" }
```

Response 200 (skipped when email not configured)
```json
{ "status": "skipped", "reason": "Email not configured. Set SMTP_* env vars and install nodemailer to enable." }
```

### POST /quotations/:id/pdf?format=html
Generate and store a PDF; returns a file record. When `format=html`, uses Puppeteer + Handlebars (skips if deps missing).

Response 200 (success)
```json
{
  "id": 42,
  "key": "uploads/1724490000000_quotation_Q-..._html.pdf",
  "originalName": "quotation_Q-..._html.pdf",
  "mimeType": "application/pdf",
  "size": 123456,
  "createdAt": "2025-08-24T11:10:00.000Z",
  "downloadUrl": "/api/files/42"
}
```

Response 200 (skipped when HTML->PDF deps missing)
```json
{ "status": "skipped", "reason": "HTML->PDF not available. Install dependencies: npm install puppeteer handlebars. Then retry with ?format=html" }
```

Errors
- 404 Not Found: `{ "statusCode": 404, "message": "Quotation not found", "error": "Not Found" }`

---

## Files
Resource: `/files` (requires `accessToken`).

### GET /files/health
```json
{ "ok": true }
```

### GET /files/:id
Streams the stored file (e.g., generated PDF).
- Sets `Content-Type` and `Content-Disposition` headers.
- 404 if file not found.

---

## Products (scaffold)

### GET /products
Response 200
```json
{ "message": "Products endpoint scaffold" }
```

---

## Orders (scaffold)

### GET /orders
Response 200
```json
{ "message": "Orders endpoint scaffold" }
```

---

## Users (scaffold)

### GET /users
Response 200
```json
{ "message": "Users endpoint scaffold" }
```

---

## Root

### GET /
With global `/api` prefix, available at `GET /api`
- Returns: plain string from `AppService.getHello()`

---

## Errors and Validation

- Validation errors (class-validator + ValidationPipe):
```json
{ "statusCode": 400, "message": ["<details>"], "error": "Bad Request" }
```
- Auth errors: 401 Unauthorized
- Not found: 404 Not Found (only where explicit `NotFoundException` is thrown)
- Other runtime errors: 500 Internal Server Error with a message

Notes
- Decimal monetary fields are returned as strings (Prisma Decimal serialization), e.g., "950.00".
- Pagination: list endpoints accept `skip` and `take` query params; responses are arrays without metadata in current implementation.
