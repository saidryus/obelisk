# Obelisk — Defense & Presentation Guide

A reviewer's guide explaining **what** the system does, **what technologies** were used, and **why** every design decision was made.
Read this before your presentation so you can answer any question confidently.

---

## Table of Contents

- [System Overview](#system-overview)
- [Tech Stack Summary](#tech-stack-summary)
- [Core Functionalities](#core-functionalities)
1. [Why MERN Stack?](#1-why-mern-stack)
2. [Why MongoDB?](#2-why-mongodb)
3. [Why Express.js?](#3-why-expressjs)
4. [Why React?](#4-why-react)
5. [Why Node.js?](#5-why-nodejs)
6. [Why bcrypt for passwords?](#6-why-bcrypt-for-passwords)
7. [Why JWT for authentication?](#7-why-jwt-for-authentication)
8. [Why AES-256 for encryption?](#8-why-aes-256-for-encryption)
9. [Why re-authentication before viewing secrets?](#9-why-re-authentication-before-viewing-secrets)
10. [Why a per-secret trusted session?](#10-why-a-per-secret-trusted-session)
11. [Why progressive login lockout?](#11-why-progressive-login-lockout)
12. [Why a global re-auth rate limiter?](#12-why-a-global-re-auth-rate-limiter)
13. [Why session expiry and idle timeout?](#13-why-session-expiry-and-idle-timeout)
14. [Why Multer for file uploads?](#14-why-multer-for-file-uploads)
15. [Why are files not publicly accessible?](#15-why-are-files-not-publicly-accessible)
16. [Why activity logging?](#16-why-activity-logging)
17. [Why no public registration?](#17-why-no-public-registration)
18. [Why store the IV with the ciphertext?](#18-why-store-the-iv-with-the-ciphertext)
19. [Why localStorage for JWT?](#19-why-localstorage-for-jwt)
20. [Why React custom hooks for security logic?](#20-why-react-custom-hooks-for-security-logic)
21. [Common Instructor Questions](#21-common-instructor-questions)

---

## System Overview

**Obelisk** is a full-stack MERN web application that allows authorized company employees to securely store, manage, and access confidential trade secrets. It is designed around the principle of **defence in depth** — multiple overlapping security layers so that no single failure exposes all data.

- **Deployed at:** https://obelisk-n4ww.onrender.com
- **Database:** MongoDB Atlas (cloud-hosted)
- **Demo credentials:** alice / Alice@123 · bob / Bob@123 · charlie / Charlie@123

---

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 18 | Component-based UI, hooks for security logic |
| Client Routing | React Router | v6 | Protected routes, client-side navigation |
| HTTP Client | Axios | 1.x | API calls with JWT interceptors |
| Notifications | React Hot Toast | 2.x | Non-blocking toast feedback |
| Backend Framework | Express.js | 4.x | REST API, middleware chaining |
| Runtime | Node.js | 18+ | Server-side JavaScript, built-in crypto |
| Database | MongoDB + Mongoose | 7.x | Document storage, schema modeling |
| Auth Tokens | jsonwebtoken (JWT) | 9.x | Stateless authentication, 1-hour expiry |
| Password Security | bcryptjs | 2.x | One-way hashing, cost factor 12 |
| Encryption | Node.js crypto (built-in) | — | AES-256-CBC encryption/decryption |
| File Uploads | Multer | 1.x | Multipart form handling, type/size validation |
| Environment Config | dotenv | 16.x | Secure environment variable management |
| Styling | Custom CSS + CSS Variables | — | Hand-written dark theme, no framework |
| Deployment | Render (backend) | — | Free tier Node.js hosting |
| Database Hosting | MongoDB Atlas | — | Free tier cloud database |

---

## Core Functionalities

### 1. User Authentication
- Login with username and password
- No public registration — accounts pre-created via seed script
- JWT issued on login, expires in 1 hour
- Token stored in localStorage, attached to every API request via Axios interceptor
- Expired/invalid tokens automatically redirect to login

### 2. Trade Secret Management (CRUD)
- **Create** — add a secret with a title, text content, and/or file attachment
- **Read** — list all your secrets (metadata only, no content exposed in list)
- **Update** — edit title, text, or replace the file attachment
- **Delete** — permanently removes the secret and its file from disk
- All operations scoped to the logged-in user — users cannot access each other's secrets

### 3. AES-256 Encryption
- Text content is encrypted with AES-256-CBC before being saved to MongoDB
- A random 16-byte IV is generated per encryption
- Stored as `ivHex:ciphertextHex` — unreadable without the AES key
- Decryption happens in memory on the backend — plaintext never written to the database
- The AES key lives only in the server's `.env` file

### 4. File Upload and Secure Download
- Files uploaded via Multer (PDF, TXT, DOCX, PNG, JPG, GIF — max 10 MB)
- Stored in `/uploads` on the server — not publicly accessible
- Downloads go through an authenticated route that verifies JWT and ownership
- Every download is logged as `FILE_DOWNLOAD`

### 5. Re-authentication for Sensitive Actions
- Viewing, editing, or deleting a secret requires re-entering your password
- Backend verifies password via `POST /api/auth/verify-password`
- Per-secret trusted session: verify once → 3-minute window for that specific secret
- After 3 minutes, content auto-hides and trust is revoked
- Timer persists across tab switches (stored in sessionStorage)

### 6. Session Management
- Visible countdown timer in sidebar (60 minutes from login)
- Warning toast at 5 minutes remaining
- Idle timeout: auto-logout after 2 minutes of no activity
- Tab-close cleanup: JWT removed from localStorage on tab close (best-effort)

### 7. Brute-force Protection
- **Login:** 5 failed attempts → progressive lockout (10 → 20 → 40 → 60 minutes)
- **Re-auth:** 5 global failed attempts → 2-minute cooldown on all sensitive actions
- Global re-auth counter cannot be reset by switching between View/Edit/Delete
- All lockout data stored in MongoDB (persists across server restarts)

### 8. Activity Logging
- Every significant action recorded: userId + action + detail + timestamp
- 10 action types: LOGIN_ATTEMPT, FAILED_LOGIN, CREATE_SECRET, VIEW_SECRET, UPDATE_SECRET, DELETE_SECRET, FILE_UPLOAD, FILE_DOWNLOAD, REAUTH_SUCCESS, FAILED_REAUTH
- Logs are never deleted — even deleting a secret keeps its audit trail
- Filterable logs page in the UI

---

## 1. Why MERN Stack?

**MERN = MongoDB + Express + React + Node.js**

All four technologies use **JavaScript**, which means:
- One language across the entire codebase (frontend and backend)
- Easier to maintain and understand
- Large community, lots of documentation
- Free and open source — no licensing costs

For a university project, MERN is ideal because it is widely taught, well-documented, and fast to develop with.

---

## 2. Why MongoDB?

MongoDB is a **NoSQL document database**. We chose it because:

- Trade secrets have flexible structures — some have text, some have files, some have both. MongoDB handles this naturally without needing to alter a table schema.
- Mongoose (the ODM library) lets us define schemas in JavaScript, keeping everything in one language.
- MongoDB Atlas provides a free cloud-hosted database, making deployment straightforward.
- It integrates natively with Node.js through the Mongoose library.

**Why not MySQL or PostgreSQL?**
Relational databases work well too, but they require a fixed schema. MongoDB's flexibility suits a project where secret content types may vary. For a student project, the simpler setup of MongoDB was also a practical advantage.

---

## 3. Why Express.js?

Express is a **minimal web framework for Node.js**. We chose it because:

- It is the most widely used Node.js framework — well-documented and easy to learn.
- It gives full control over routing, middleware, and request handling without enforcing a rigid structure.
- Middleware chaining makes it easy to add JWT verification, file upload handling, and error handling as reusable layers.
- It is lightweight — no unnecessary features that would complicate the codebase.

---

## 4. Why React?

React is a **JavaScript library for building user interfaces**. We chose it because:

- **Component-based architecture** — each UI element (sidebar, modal, secret card) is a self-contained component that can be reused.
- **Hooks** — React hooks (`useState`, `useEffect`, custom hooks) allow security logic like session management and re-authentication to be encapsulated cleanly and reused across pages.
- **React Router** — enables client-side navigation and protected routes that redirect unauthenticated users.
- It is the most popular frontend library, meaning extensive community support and resources.

---

## 5. Why Node.js?

Node.js runs JavaScript on the server. We chose it because:

- It shares the same language as the frontend, reducing context switching.
- It has a built-in `crypto` module that provides AES encryption without any external dependencies.
- It handles asynchronous operations (database queries, file I/O) efficiently with async/await.
- npm (Node Package Manager) gives access to bcrypt, JWT, Multer, and Mongoose — all the libraries this project needs.

---

## 6. Why bcrypt for passwords?

**bcrypt is a password hashing algorithm specifically designed for security.**

Key reasons:
- **One-way hashing** — a bcrypt hash cannot be reversed. Even if the database is stolen, passwords cannot be recovered.
- **Built-in salt** — bcrypt automatically generates a random salt for each password. Two users with the same password will have completely different hashes, preventing rainbow table attacks.
- **Cost factor (work factor)** — we use cost factor 12, meaning bcrypt performs 2¹² = 4,096 iterations. This makes each hash slow to compute, which defeats brute-force attacks. As hardware gets faster, the cost factor can be increased.

**Why not MD5 or SHA-256?**
MD5 and SHA-256 are fast hashing algorithms — they can compute billions of hashes per second on modern hardware, making brute-force attacks trivial. bcrypt is intentionally slow, which is exactly what you want for passwords.

---

## 7. Why JWT for authentication?

**JWT (JSON Web Token) is a stateless authentication mechanism.**

How it works:
1. User logs in → server verifies credentials → server signs a token with a secret key → token sent to client
2. Client stores token and sends it with every request
3. Server verifies the token's signature on every request — no database lookup needed

Why JWT over sessions:
- **Stateless** — the server does not need to store session data. This scales better and is simpler to implement.
- **Self-contained** — the token carries the user's ID, username, and role. The server can read this without a database query.
- **Expiry** — tokens have a built-in expiry (`exp` claim). Ours expire after 1 hour, forcing re-login.

**What if someone steals the token?**
This is a known limitation of JWTs. We mitigate it with short expiry (1 hour), idle timeout (2 minutes), and tab-close cleanup. In production, HTTPS ensures the token cannot be intercepted in transit.

---

## 8. Why AES-256 for encryption?

**AES (Advanced Encryption Standard) is the global standard for symmetric encryption.**

Key reasons:
- **AES-256** uses a 256-bit key — considered unbreakable with current technology. The US government uses AES-256 for top-secret data.
- **Built into Node.js** — the `crypto` module provides AES without any external library.
- **CBC mode with random IV** — Cipher Block Chaining mode with a fresh Initialization Vector per encryption ensures that encrypting the same text twice produces different ciphertext, preventing pattern analysis.
- **Symmetric encryption** is appropriate here because the same system that encrypts also decrypts — there is no need for asymmetric (public/private key) encryption.

**Why not RSA?**
RSA is asymmetric and designed for key exchange, not bulk data encryption. AES is faster and more appropriate for encrypting text content.

**What is stored in the database?**
The format is `ivHex:ciphertextHex`. The IV is not secret — it just needs to be unique per encryption. The ciphertext is unreadable without the AES key, which lives only in the server's environment file.

---

## 9. Why re-authentication before viewing secrets?

This protects against the **unattended screen attack** — a scenario where someone walks up to an unlocked computer where a user is already logged in.

Without re-auth: anyone at the keyboard can view all secrets immediately.
With re-auth: they need the password even if the session is active.

This is a real-world pattern used in banking apps (re-enter PIN before transferring money) and password managers (re-enter master password before showing a password).

---

## 10. Why a per-secret trusted session?

After verifying your password, you get a **3-minute trusted window for that specific secret**.

**Why per-secret instead of global?**
If the trusted session were global, verifying once would unlock ALL secrets for 3 minutes. If an attacker gets brief access and verifies once, they can view everything.

Per-secret trust limits the damage — verifying secret A only unlocks secret A. Secret B still requires its own verification.

**Why 3 minutes?**
Long enough to be convenient (read, copy, act on the secret), short enough to limit exposure if the user walks away.

---

## 11. Why progressive login lockout?

Standard lockouts (flat 10 minutes every time) can be worked around by an attacker who simply waits and tries again repeatedly.

**Progressive escalation** makes repeated attacks increasingly costly:
- 1st lockout: 10 minutes
- 2nd lockout: 20 minutes
- 3rd lockout: 40 minutes
- 4th+: 60 minutes (cap)

An attacker who keeps trying faces exponentially longer waits. After 4 lockout cycles, they are blocked for an hour each time — making automated attacks impractical.

**Why reset on successful login?**
A legitimate user who forgets their password and eventually gets it right should not be permanently penalized. Resetting on success is standard practice.

---

## 12. Why a global re-auth rate limiter?

Without a global limiter, an attacker could bypass per-action limits by switching between View, Edit, and Delete — effectively getting 3× the attempts.

The global limiter uses a **module-level singleton** in JavaScript. Because JavaScript modules are cached after the first import, every component that calls `useSecureAction()` shares the same counter object. There is no way to reset it by switching actions or navigating between pages.

5 failures from any combination of actions → 2-minute cooldown on everything.

---

## 13. Why session expiry and idle timeout?

**Session expiry (1 hour):**
JWT tokens expire after 1 hour. This limits the window of opportunity if a token is stolen. The user must re-authenticate, which also re-verifies their identity.

**Idle timeout (2 minutes):**
If a user leaves their computer without logging out, the system automatically logs them out after 2 minutes of inactivity. This is standard in banking and healthcare systems.

**Why 2 minutes for idle?**
Short enough to protect against someone walking up to an unattended screen, long enough not to be annoying during normal use (reading a document, typing slowly).

---

## 14. Why Multer for file uploads?

Multer is the standard Node.js middleware for handling `multipart/form-data` (file uploads). We chose it because:

- It integrates directly with Express as middleware.
- It provides `fileFilter` to whitelist allowed file types.
- It provides `limits` to enforce maximum file size (10 MB).
- It handles the storage destination and filename generation.
- It is the most widely used and documented file upload library for Node.js.

---

## 15. Why are files not publicly accessible?

The `/uploads` folder is **not served as a static directory**. This means there is no URL that directly serves a file.

**Why?**
If files were publicly accessible, anyone who guessed or found a file URL could download it without authentication. By routing all downloads through `GET /api/secrets/:id/download`, we enforce:
1. JWT verification — must be logged in
2. Ownership check — the file must belong to the requesting user
3. Audit logging — every download is recorded

This is the same pattern used by Google Drive, Dropbox, and similar services.

---

## 16. Why activity logging?

Logs serve two purposes:

**Accountability** — every action is tied to a user ID and timestamp. If a secret is deleted or viewed inappropriately, the logs show exactly who did it and when.

**Forensics** — if a security incident occurs, logs provide the evidence trail needed to understand what happened. This is a legal requirement in many industries (healthcare, finance, legal).

We log 10 action types covering all sensitive operations. The logs are stored in MongoDB and are read-only from the user's perspective — they cannot be deleted through the UI.

---

## 17. Why no public registration?

Trade secret systems are for **authorized personnel only**. Allowing anyone to register would defeat the purpose — a competitor could create an account and attempt to access secrets.

In a real deployment, an administrator would create accounts for verified employees. We simulate this with a seed script that pre-creates known demo users.

---

## 18. Why store the IV with the ciphertext?

The IV (Initialization Vector) is stored as `ivHex:ciphertextHex` in the database.

**Why is this safe?**
The IV is not secret — it just needs to be unique per encryption to prevent pattern analysis. Storing it with the ciphertext is standard practice (this is how most encryption libraries work, including OpenSSL). The security comes from the AES key, which is never stored in the database.

**Why a random IV per encryption?**
If the same IV were reused, encrypting the same text twice would produce the same ciphertext. An attacker could detect that two secrets have the same content without decrypting either. A random IV ensures each encryption is unique.

---

## 19. Why localStorage for JWT?

We store the JWT in `localStorage` for simplicity. The alternatives are:

- **HttpOnly cookies** — more secure against XSS attacks, but require CORS configuration and same-origin setup that adds complexity.
- **sessionStorage** — cleared when the tab closes, but doesn't persist across tabs.
- **localStorage** — persists across tabs and page refreshes, simple to implement.

For a student project demo, localStorage is acceptable. In production, HttpOnly cookies would be preferred. We mitigate the XSS risk by keeping the app simple with no user-generated HTML rendering.

---

## 20. Why React custom hooks for security logic?

Security logic is centralized in two custom hooks:

**`useSessionManager`** — handles session countdown, idle timeout, and tab-close cleanup. By putting this in one hook called once in `App.js`, the logic runs globally for all pages without duplicating code.

**`useSecureAction`** — handles re-authentication flow, trusted sessions, and rate limiting. Any component that needs to gate an action behind a password just calls `secure.run('Action Name', callback, secretId)`. The hook handles everything else.

**Why hooks instead of putting logic in components?**
- **Reusability** — the same logic works across SecretsPage and AddSecretPage without copy-pasting.
- **Separation of concerns** — UI components focus on rendering; hooks focus on security logic.
- **Testability** — hooks can be tested independently.
- **The module-level singleton pattern** — the global rate limiter works because the hook module is loaded once and shared. This would not be possible if the logic lived inside components.

---

## 21. Common Instructor Questions

**Q: Why not use HTTPS locally?**
HTTPS is handled by the deployment platform (Render provides it automatically). Locally, we use HTTP for simplicity since the data never leaves the machine.

**Q: Is AES-256 really unbreakable?**
With current technology, yes. A brute-force attack on AES-256 would require more energy than exists in the observable universe. The real risk is key management (someone stealing the key), not breaking the algorithm — which is why we discuss key management services as a production improvement.

**Q: What happens if the JWT secret is leaked?**
An attacker could forge valid tokens. This is why the JWT secret should be a long random string stored securely. In production, it would be rotated regularly and stored in a secrets manager.

**Q: Why not use a third-party auth service like Auth0?**
For a university project demonstrating security concepts, implementing authentication ourselves shows understanding of how it works. Auth0 abstracts away the implementation details, which would reduce the educational value of the project.

**Q: Can users see each other's secrets?**
No. Every database query includes `userId: req.user.id` — the ID extracted from the verified JWT. Even if a user knows another secret's MongoDB ID, the query returns null because the userId doesn't match.

**Q: What is the difference between hashing and encryption?**
Hashing is one-way — you cannot recover the original value from a hash. It is used for passwords because you never need to recover the original password, only verify it. Encryption is two-way — you can decrypt ciphertext back to plaintext with the key. It is used for secrets because users need to read the original content.

**Q: Why does the decrypted content disappear after 3 minutes?**
This is the "minimum exposure" principle — sensitive data should only be visible for as long as necessary. After 3 minutes, the content is hidden and the trusted session is revoked, requiring re-authentication to view it again. This limits the damage if someone walks up to an unattended screen.

**Q: Why use MongoDB Atlas instead of a local database for deployment?**
A local database only exists on the developer's machine. Atlas is a cloud-hosted database that is accessible from anywhere — including the Render deployment server. It also provides automatic backups, monitoring, and high availability.

**Q: What is defence in depth?**
It means using multiple overlapping security controls so that if one fails, others remain. In Obelisk: even if someone steals the JWT (bypassing authentication), they still need the password for re-auth. Even if they get the password, they need the AES key to read the database. Even if they get database access, the data is encrypted. No single point of failure exposes everything.
