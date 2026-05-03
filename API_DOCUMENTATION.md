# Obelisk — API Documentation

**Base URL (Development):** `http://localhost:5000/api`
**Base URL (Production):** `https://obelisk-n4ww.onrender.com/api`

> Protected routes require the header: `Authorization: Bearer <token>`

---

## Authentication Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 1 | `/api/auth/login` | POST | Authenticate user with username and password. Issues a signed JWT valid for 1 hour. Tracks failed attempts and locks account after 5 failures. | `{ token, user }` | 200 OK |
| 2 | `/api/auth/verify-password` | POST | Re-authenticate the logged-in user by verifying their password. Required before viewing, editing, or deleting a secret. Requires valid JWT. | `{ verified: true }` | 200 OK |

---

## Secret Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 3 | `/api/secrets` | GET | Fetch all secrets belonging to the logged-in user. Returns metadata only — content is not decrypted. | Array of secret objects | 200 OK |
| 4 | `/api/secrets/:id` | GET | Fetch and decrypt a single secret by ID. Only the owner can access it. Logs a VIEW_SECRET action. | `{ _id, title, content, hasFile, originalFileName, fileSize, createdAt, updatedAt }` | 200 OK |
| 5 | `/api/secrets` | POST | Create a new secret with optional text and/or file. Text is AES-256 encrypted before storage. Accepts multipart/form-data. | `{ _id, title, hasText, hasFile, createdAt }` | 201 Created |
| 6 | `/api/secrets/:id` | PUT | Update an existing secret's title, text, or file. Only the owner can update. Re-encrypts content if changed. Accepts multipart/form-data. | `{ _id, title, updatedAt }` | 200 OK |
| 7 | `/api/secrets/:id` | DELETE | Permanently delete a secret and remove its file from disk. Only the owner can delete. Logs a DELETE_SECRET action. | `{ message: "Secret deleted" }` | 200 OK |
| 8 | `/api/secrets/:id/download` | GET | Download the file attached to a secret. Verifies ownership before streaming the file. Logs a FILE_DOWNLOAD action. | File stream (binary) | 200 OK |

---

## Log Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 9 | `/api/logs` | GET | Fetch the activity log for the logged-in user. Returns up to 100 entries sorted by newest first. | Array of log objects | 200 OK |
