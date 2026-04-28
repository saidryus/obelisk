# Trade Secret Protection System

A secure MERN web application for storing and protecting confidential trade secrets.

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/trade_secrets
JWT_SECRET=change_this_to_a_long_random_string
AES_SECRET_KEY=change_this_32_char_key_exactly!
```

> AES_SECRET_KEY MUST be exactly 32 characters.

Seed the database with demo users:

```bash
node seed.js
```

Start the backend:

```bash
npm run dev
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs at: http://localhost:3000

---

## Demo Credentials

| Username | Password    | Role     |
|----------|-------------|----------|
| alice    | Alice@123   | admin    |
| bob      | Bob@123     | employee |
| charlie  | Charlie@123 | employee |

---

## API Endpoints

| Method | Endpoint                    | Auth | Description                        |
|--------|-----------------------------|------|------------------------------------|
| POST   | /api/auth/login             | No   | Login, returns JWT                 |
| POST   | /api/auth/verify-password   | JWT  | Re-auth before viewing a secret    |
| GET    | /api/secrets                | JWT  | List user's secrets (no content)   |
| GET    | /api/secrets/:id            | JWT  | Get + decrypt a single secret      |
| POST   | /api/secrets                | JWT  | Create and encrypt a secret        |
| PUT    | /api/secrets/:id            | JWT  | Update a secret                    |
| DELETE | /api/secrets/:id            | JWT  | Delete a secret                    |
| GET    | /api/logs                   | JWT  | Get activity logs for current user |

---

## Security Features Explained

### 1. Password Protection (bcrypt)
Passwords are hashed with bcrypt (cost factor 12) before storage.
Plain-text passwords are never stored or logged.

### 2. Data Encryption (AES-256-CBC)
Secret content is encrypted with AES-256-CBC before being saved to MongoDB.
A random IV is generated per encryption, stored alongside the ciphertext as `iv:ciphertext`.
The AES key lives only in the `.env` file — never in the database.

### 3. Access Control (JWT)
Every protected route requires a valid JWT in the `Authorization: Bearer <token>` header.
The token payload contains the user's ID, which is used to scope all database queries —
users can only read/write their own secrets.

### 4. Session Expiration
JWTs expire after 1 hour. The frontend detects 401 responses and redirects to login.

### 5. Re-authentication for Sensitive Actions
Viewing a secret requires the user to re-enter their password via a modal.
The backend verifies the password before decrypting and returning the content.

### 6. Login Attempt Limiting (Brute-force Protection)
After 5 consecutive failed logins, the account is locked for 10 minutes.
The lock timestamp is stored in MongoDB. Remaining attempts are shown to the user.

### 7. Activity Logging
Key actions (LOGIN, FAILED_LOGIN, CREATE_SECRET, VIEW_SECRET, DELETE_SECRET, etc.)
are recorded with userId and timestamp for accountability and audit trails.

---

## Data Model Relationships

- User → Secrets: one-to-many (userId foreign key on Secret)
- User → Logs: one-to-many (userId foreign key on Log)
