# Obelisk — Presentation Flow Script

**Live URL:** https://obelisk-n4ww.onrender.com
**Before you start:** Be logged out. Have MongoDB Atlas open in another tab.

---

## Opening

*"So this is Obelisk — our Trade Secret Protection System. The idea is simple: companies have confidential information they need to store securely — product formulas, business strategies, sensitive documents. Most companies just throw these in a shared drive or email, which has no encryption and no way to track who accessed what. Obelisk solves that."*

*"Let me walk you through the system live."*

---

## Step 1 — Login Page

**Show:** `https://obelisk-n4ww.onrender.com`

*"This is the login page. There's no public registration — accounts are created by an admin. That's intentional. You don't want just anyone signing up to a system that holds trade secrets."*

---

## Step 2 — Brute-force Protection

**Action:** Type `alice` as username, type `wrongpassword`, click Sign In

*"Let me enter the wrong password on purpose."*

**Action:** Point to the error message

*"The system tells me how many attempts I have left. After 5 failures, the account locks. The lockout duration escalates — first time is 10 minutes, second time is 20, then 40, then capped at 60. The more someone tries to brute-force it, the longer they wait."*

**Action:** Enter wrong password one more time

*"Each failed attempt is also recorded in the audit log. Nothing goes unnoticed."*

---

## Step 3 — Successful Login

**Action:** Enter `alice` / `Alice@123`, click Sign In

*"Now I log in with the correct credentials. The server verifies the password against a bcrypt hash — bcrypt is a one-way algorithm, so even we can't recover the original password from what's stored in the database. On success, a JWT token is issued, valid for one hour."*

---

## Step 4 — Dashboard

**Action:** Point around the dashboard

*"This is the dashboard. It shows a summary — how many secrets I have, recent activity. On the left sidebar, notice this timer at the bottom. That's the session countdown — 60 minutes from login. When it hits zero, the system logs me out automatically."*

*"There's also a 2-minute idle timeout. If I stop interacting with the page — no mouse movement, no clicks — I get logged out. This protects against someone walking up to an unattended screen."*

*"The security status panel shows all active protections. Everything is green — AES-256 encryption, JWT auth, re-authentication, brute-force guard, secure file access, audit logging."*

---

## Step 5 — Create a Secret

**Action:** Click "New Secret"

*"Let me create a trade secret."*

**Action:** Type title: `Product Formula`

**Action:** Type in the text area: `Mix compound A with B at 40 degrees Celsius. Ratio is 3 to 1.`

**Action:** Point to the green hint that appears below the text area

*"Notice this — it says the content will be encrypted with AES-256 before saving. That's not just a label. It's actually happening."*

**Action:** Upload a PDF file

*"I can also attach a file — PDF, Word document, images, up to 10 megabytes."*

**Action:** Click "Encrypt & Save"

*"When I hit save, the backend encrypts the text using AES-256-CBC with a random initialization vector, then stores the ciphertext in MongoDB. The file goes to the server's uploads folder — not publicly accessible."*

---

## Step 6 — Show Encrypted Data in MongoDB Atlas

**Action:** Switch to MongoDB Atlas tab → Browse Collections → secrets collection

*"Let me show you what's actually in the database."*

**Action:** Point to the `encryptedText` field

*"This is the encryptedText field. This is what AES-256 looks like in the database. The part before the colon is the initialization vector. The part after is the ciphertext. Completely unreadable. Even if someone stole this entire database, they cannot read the secret without the encryption key — which only exists on the server."*

*"The title is stored as plain text — we only encrypt the content. And the file is not in the database at all — only the filename and size are stored here."*

---

## Step 7 — View a Secret (Re-authentication)

**Action:** Go back to the app → Secrets page → click the eye icon on the secret

*"Now I want to view the secret I just created."*

**Action:** The re-authentication modal appears

*"Even though I'm already logged in, the system asks for my password again. This is re-authentication. It protects against someone who walks up to an unlocked computer — they can't just click View and read everything."*

**Action:** Enter wrong password once

*"If I enter the wrong password, the attempt is counted globally. Those dots at the top show how many attempts I've used. After 5 failures — across any combination of View, Edit, or Delete — all sensitive actions are blocked for 2 minutes. You can't bypass it by switching between actions."*

**Action:** Enter correct password `Alice@123`

*"Correct password. The backend verifies it, decrypts the secret in memory, and sends back the plaintext."*

**Action:** Point to the decrypted content and the timer

*"The secret is now visible. And there's a 3-minute countdown. After 3 minutes, the content automatically hides and I need to re-authenticate again. This is the minimum exposure principle — sensitive data should only be visible for as long as necessary."*

---

## Step 8 — Per-Secret Trust

**Action:** Click View on the same secret again (within 3 minutes)

*"If I click View on the same secret again within the 3-minute window — no password prompt. The trusted session is still active for this specific secret."*

**Action:** Click View on a different secret

*"But if I try a different secret — the modal appears again. The trust is per-secret. Verifying one does not unlock all of them."*

---

## Step 9 — Activity Logs

**Action:** Click "Activity Logs" in the sidebar

*"Now the audit logs. Every action in the system is recorded here — login attempts, failed logins, secret creation, re-authentication, views, downloads, deletions. All with timestamps."*

**Action:** Click the "FAILED LOGIN" filter

*"I can filter by action type. Here are the failed login attempts from earlier."*

*"These logs are never deleted. Even if I delete a secret, its entire history stays in the logs. If someone deletes a secret to cover their tracks, the log still shows they created it, viewed it, and deleted it."*

---

## Step 10 — Access Isolation

**Action:** Log out → log in as `bob` / `Bob@123` → go to Secrets

*"Last thing — let me log in as Bob, a different user."*

**Action:** Show the empty secrets page

*"Bob sees nothing. He can't see Alice's secrets. Every database query in the backend includes the user's ID from the JWT token. Even if Bob somehow knew the exact database ID of Alice's secret, the query would return nothing because the user ID doesn't match."*

---

## Closing

*"So to summarize — Obelisk protects trade secrets through 7 layers: bcrypt password hashing, AES-256 encryption at rest, JWT authentication, re-authentication for sensitive actions, progressive login lockout, global re-auth rate limiting, and session management with full audit logging. No single layer is relied upon alone — that's defence in depth."*

*"The system is live at obelisk-n4ww.onrender.com. We're happy to take questions."*

---

## Cheat Sheet

| What to prove | Action |
|---|---|
| Brute-force protection | Wrong password 2–3 times, show counter |
| bcrypt / no plain text passwords | Mention it during login |
| AES encryption | Show Atlas encryptedText field |
| Re-authentication | Click View, show modal |
| Per-secret trust | View same secret twice, then try different one |
| Global rate limiter | Wrong re-auth password, show dots |
| Access isolation | Log in as bob, show empty secrets |
| Audit trail | Logs page, filter by FAILED LOGIN |
| Session timer | Point to sidebar countdown |
| Idle timeout | Mention it, no need to wait 2 min |

---

## Credentials

| Username | Password | Role |
|---|---|---|
| alice | Alice@123 | admin |
| bob | Bob@123 | employee |
| charlie | Charlie@123 | employee |
