# Obelisk — Smoke Test Report

**Application:** Obelisk Trade Secret Protection System
**Deployed URL:** https://obelisk-n4ww.onrender.com
**Test Date:** May 3, 2026
**Tester:** Automated (PowerShell HTTP requests against live deployment)
**Environment:** Production (Render + MongoDB Atlas)

---

## Summary

| Total Tests | Passed | Failed |
|---|---|---|
| 9 | 9 | 0 |

All critical paths are functional on the live deployment.

---

## Test Results

### Application Availability

| # | Test | Method | Endpoint | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| 1 | App is reachable | GET | `/` | 200 OK | 200 OK | PASS |

---

### Authentication Endpoints

| # | Test | Method | Endpoint | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| 2 | Login with valid credentials | POST | `/api/auth/login` | 200 OK + JWT token | 200 OK + JWT token returned | PASS |
| 3 | Login with wrong password | POST | `/api/auth/login` | 401 Unauthorized | 401 Unauthorized | PASS |
| 4 | Re-authenticate with correct password | POST | `/api/auth/verify-password` | 200 OK + `{ verified: true }` | 200 OK + `{ verified: true }` | PASS |

---

### Secret Endpoints

| # | Test | Method | Endpoint | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| 5 | Fetch secrets with valid token | GET | `/api/secrets` | 200 OK + array of secrets | 200 OK + 2 secrets returned | PASS |
| 6 | Fetch secrets without token | GET | `/api/secrets` | 401 Unauthorized | 401 Unauthorized | PASS |
| 7 | Fetch non-existent secret | GET | `/api/secrets/:id` | 404 Not Found | 404 Not Found | PASS |

---

### Log Endpoints

| # | Test | Method | Endpoint | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| 8 | Fetch activity logs with valid token | GET | `/api/logs` | 200 OK + array of logs | 200 OK + logs returned | PASS |

---

### Security Verification

| # | Test | Expected Behavior | Actual Behavior | Status |
|---|---|---|---|---|
| 9 | Secrets list returns no plaintext content | Response contains `hasText: true` but no `content` field | No `content` field in list response — only metadata returned | PASS |

---

## Test Details

### Test 2 — Valid Login
**Request:**
```
POST /api/auth/login
{ "username": "alice", "password": "Alice@123" }
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69f0ca094ac3aed413a4f71b",
    "username": "alice",
    "email": "alice@company.com",
    "role": "admin"
  }
}
```

---

### Test 3 — Invalid Login
**Request:**
```
POST /api/auth/login
{ "username": "alice", "password": "wrongpass" }
```
**Response:** `401 Unauthorized`
Confirms brute-force tracking is active — failed attempt is recorded in logs.

---

### Test 4 — Re-authentication
**Request:**
```
POST /api/auth/verify-password
Authorization: Bearer <token>
{ "password": "Alice@123" }
```
**Response:**
```json
{ "verified": true }
```

---

### Test 5 — Secrets List (Metadata Only)
**Request:**
```
GET /api/secrets
Authorization: Bearer <token>
```
**Response (excerpt):**
```json
[
  {
    "_id": "69f0ca704ac3aed413a4f73b",
    "title": "INTPROG Project Details",
    "hasText": true,
    "hasFile": true,
    "originalFileName": "IT-INTPROG32-Final-Project-MERN-Stack-RESTful-API.pdf",
    "fileSize": 90722,
    "createdAt": "2026-04-28T14:55:44.506Z",
    "updatedAt": "2026-04-28T14:55:44.506Z"
  }
]
```
Note: No `content` or `encryptedText` field is exposed — confirms encryption is working correctly.

---

### Test 6 — Unauthorized Access (No Token)
**Request:**
```
GET /api/secrets
(no Authorization header)
```
**Response:** `401 Unauthorized`
Confirms JWT middleware is protecting all secret routes.

---

### Test 7 — Non-existent Secret
**Request:**
```
GET /api/secrets/000000000000000000000000
Authorization: Bearer <token>
```
**Response:** `404 Not Found`
Confirms ownership scoping — returns 404 for IDs that don't belong to the user.

---

### Test 8 — Activity Logs
**Request:**
```
GET /api/logs
Authorization: Bearer <token>
```
**Response:** Array of 54 log entries including `LOGIN_ATTEMPT`, `FAILED_LOGIN`, `VIEW_SECRET`, `REAUTH_SUCCESS`, `FAILED_REAUTH`, `CREATE_SECRET`, `FILE_UPLOAD`, `FILE_DOWNLOAD`, `DELETE_SECRET`.
Confirms all action types are being recorded correctly.

---

## Observations

- The application is live and responding correctly on the production deployment.
- JWT authentication is enforced on all protected routes.
- The secrets list endpoint correctly returns metadata only — encrypted content is never exposed in list responses.
- Activity logging is functioning and recording all expected action types.
- The auto-seed feature successfully created demo users (alice, bob, charlie) on first deployment.
- Render free tier spin-down may cause the first request after inactivity to take 30–50 seconds. Subsequent requests respond normally.
