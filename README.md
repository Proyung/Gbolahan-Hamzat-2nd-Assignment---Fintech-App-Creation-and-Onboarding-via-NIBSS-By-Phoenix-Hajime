# NIBSS Bank API

Express + MongoDB backend for customer onboarding, accounts and transfers, built on the NibssByPhoenix APIs.

## Setup

1. Fill in `.env`: `NIBSS_BASE_URL`, `NIBSS_API_KEY`, `NIBSS_API_SECRET` (from the Fintech-Onboarding step), `MONGO_URI`, `JWT_SECRET`.
2. `npm install`
3. `npm run dev`

The app logs in to NIBSS with the API key/secret by itself and caches/refreshes the token. Customers authenticate to *this* API with their own JWT.

## Structure

```
bankapp.js            app entry: middleware, routes, DB connection
config/               database.js (Mongo), nibssconfig.js (axios client + NIBSS token)
Services/             nibssservice.js - one function per NIBSS endpoint
controller/           auth, onboarding, account, transfer logic
routes/               URL -> controller mapping
models/               Customer, Account, Transaction
middleware/           auth.js (JWT guard), errorHandler.js
Utility/              AppError, helpers
```

## Flow and endpoints

All routes except register/login need `Authorization: Bearer <token>`.

| Step | Method & path | Body |
|---|---|---|
| Register | `POST /api/auth/register` | `firstName, lastName, email, dob (YYYY-MM-DD), password, phone?` |
| Login | `POST /api/auth/login` | `email, password` |
| Onboard with BVN | `POST /api/onboarding/bvn` | `bvn` (11 digits, test value) - customer must have registered with `phone` |
| ...or with NIN | `POST /api/onboarding/nin` | `nin` (11 digits, test value) |
| Open account | `POST /api/accounts` | - |
| My account | `GET /api/accounts/me` | - |
| Balance | `GET /api/accounts/me/balance` | - |
| Name enquiry | `GET /api/accounts/name-enquiry/:accountNumber` | - |
| Transfer | `POST /api/transfers` | `to, amount, narration?` |
| History | `GET /api/transfers/history?page=1&limit=20` | - |
| Status (TSQ) | `GET /api/transfers/:reference/status` | - |

## Business rules

- **Onboarding before accounts:** BVN/NIN is created on NIBSS (using the customer's registered name, dob and - for BVN - phone) and then validated; the validated name/dob must match the customer's profile. Only then is the customer marked `kycVerified`. `POST /api/accounts` returns 403 until that happens.
- **One account per customer:** checked in the controller and enforced by a unique index on `Account.customer`.
- **₦15,000 pre-funding:** applied by NIBSS on account creation; the create response reads the balance back to show it.
- **Transfers:** name enquiry runs first to confirm the recipient. A transfer is *intra-bank* when the recipient's bank code (from name enquiry) matches ours (returned with the NIBSS token), otherwise *inter-bank*. Recipients who are customers of this app also get a credit entry in their history.
- **Data isolation:** the customer is always taken from the JWT, never from the URL or body. Balance, transfers (source account), history and TSQ all operate only on the caller's own account and transactions. A TSQ for someone else's reference returns 404.
