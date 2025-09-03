# Optivus Protocol Backend Documentation

This document outlines the backend API required to support the Optivus Protocol frontend application. It covers authentication, user management, financial operations, and administrative functions, reflecting the current implementation found in the frontend code.

## Table of Contents
1.  [General Principles](#1-general-principles)
2.  [API Endpoint List](#2-api-endpoint-list)
3.  [Detailed Endpoints](#3-detailed-endpoints)
    - [Authentication](#authentication)
    - [User Profile & Settings](#user-profile--settings)
    - [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
    - [Dashboard & Team](#dashboard--team)
    - [KYC (Know Your Customer)](#kyc-know-your-customer)
    - [Transactions & Withdrawals](#transactions--withdrawals)
    - [Admin](#admin)
    - [Public](#public)
4.  [Key Flows](#4-key-flows)
    - [Authentication Flow](#authentication-flow)
    - [User Registration](#user-registration)
    - [KYC & Withdrawal Process](#kyc--withdrawal-process)

---

## 1. General Principles

-   **Base URL**: All API endpoints should be hosted under a consistent base URL (e.g., `/api/v1/`).
-   **Authentication**: Endpoints are protected using JWT Bearer tokens in the `Authorization` header, unless specified otherwise.
-   **Data Format**: All requests and responses should be in `application/json` format, except for file uploads which use `multipart/form-data`.
-   **Error Handling**: Errors should be returned with appropriate HTTP status codes (e.g., 400, 401, 403, 404, 500) and a JSON body containing a `detail` or `message` key with a descriptive error message.
-   **Monetary Values**: All monetary values (balances, transactions, etc.) should be handled as **strings** representing fixed-point decimals to avoid floating-point inaccuracies.
-   **Pagination**: List endpoints (e.g., transactions, users) should support pagination via query parameters like `?page=1&page_size=20`.

---

## 2. API Endpoint List

### Authentication
- `POST /auth/login/`: Login for users and admins.
- `POST /auth/register/`: Register a new user.
- `POST /auth/2fa/verify/`: Verify a 2FA token after login.
- `POST /auth/password/reset/`: Request a password reset link.
- `POST /auth/password/reset/confirm/`: Confirm a new password with a reset token.

### User Profile & Settings
- `GET /users/profile/`: Get the current user's profile.
- `PATCH /users/profile/`: Update the user's profile information.
- `POST /users/change-password/`: Change the user's password.
- `POST /users/set-pin/`: Set the user's withdrawal PIN.
- `PATCH /users/change-pin/`: Change the user's existing withdrawal PIN.
- `POST /users/verify-pin/`: Verify the user's PIN for an action.

### Two-Factor Authentication (2FA)
- `GET /users/2fa/generate/`: Generate a new 2FA secret and QR code URL.
- `POST /users/2fa/enable/`: Enable 2FA with a verification token.
- `POST /users/2fa/disable/`: Disable 2FA with a verification token.

### Dashboard & Team
- `GET /dashboard/stats/`: Get statistics for the user dashboard.
- `GET /team/tree/`: Get the user's referral team structure.

### KYC (Know Your Customer)
- `GET /kyc/status/`: Get the user's current KYC status.
- `POST /kyc/submit/`: Submit KYC documents for verification.

### Transactions & Withdrawals
- `GET /transactions/`: List the user's transactions.
- `GET /transactions/{id}/`: Get a specific transaction detail.
- `POST /withdrawals/`: Create a new withdrawal request.
- `GET /withdrawals/`: List the user's withdrawal requests.

### Admin
- `GET /admin/stats/`: Get platform-wide statistics for the admin dashboard.
- `GET /admin/users/`: List all users.
- `POST /admin/users/`: Create a new user.
- `PATCH /admin/users/{id}/`: Update a specific user's details.
- `GET /admin/kyc/`: List all pending KYC requests.
- `POST /admin/kyc/{id}/process/`: Approve or reject a KYC request.
- `GET /admin/withdrawals/`: List all pending withdrawal requests.
- `POST /admin/withdrawals/{id}/approve/`: Approve a withdrawal request.
- `POST /admin/withdrawals/{id}/deny/`: Deny a withdrawal request.
- `GET /admin/transactions/`: List all transactions on the platform.

### Public
- `POST /contact/`: Submit the public contact form.

---

## 3. Detailed Endpoints

### Authentication

#### `POST /auth/login/`
Authenticates a user (regular or admin) and returns JWTs.
- **Public**: Yes
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response (200 - No 2FA)**:
  ```json
  {
    "refresh": "string",
    "access": "string"
  }
  ```
- **Success Response (200 - 2FA Required)**:
  ```json
  {
    "two_factor_required": true,
    "user_id": "string"
  }
  ```

#### `POST /auth/register/`
Registers a new user.
- **Public**: Yes
- **Request Body**:
  ```json
  {
    "email": "string",
    "username": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "referralCode": "string"
  }
  ```
- **Success Response (201)**: User object is returned, and JWTs are provided to log the user in immediately.

#### `POST /auth/2fa/verify/`
Verifies the 2FA token provided after login.
- **Public**: Yes
- **Request Body**:
  ```json
  {
    "user_id": "string",
    "token": "string"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "refresh": "string",
    "access": "string"
  }
  ```

---

### User Profile & Settings

#### `GET /users/profile/`
Gets the profile of the currently authenticated user.
- **Auth**: Required
- **Success Response (200)**:
  ```json
  {
    "id": "string",
    "email": "string",
    "username": "string",
    "firstName": "string",
    "lastName": "string",
    "referral_code": "string",
    "is_kyc_verified": "boolean",
    "balance": "string",
    "hasPin": "boolean",
    "is2faEnabled": "boolean",
    "role": "'user' | 'admin'",
    "status": "'active' | 'frozen'",
    "withdrawalStatus": "'active' | 'paused'"
  }
  ```

#### `PATCH /users/profile/`
Updates the authenticated user's profile.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string"
  }
  ```
- **Success Response (200)**: Updated user object.

#### `POST /users/change-password/`
Changes the user's password.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "old_password": "string",
    "new_password": "string"
  }
  ```
- **Success Response (200)**: `{ "detail": "Password changed successfully." }`

#### `POST /users/set-pin/`
Sets the initial withdrawal PIN for the user.
- **Auth**: Required
- **Request Body**: `{ "pin": "string" }`
- **Success Response (200)**: `{ "detail": "PIN set successfully." }`

#### `PATCH /users/change-pin/`
Changes an existing withdrawal PIN by verifying the user's current login password.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "currentPassword": "string",
    "newPin": "string"
  }
  ```
- **Success Response (200)**: `{ "detail": "PIN changed successfully." }`

#### `POST /users/verify-pin/`
Verifies the user's PIN before a sensitive action like a withdrawal.
- **Auth**: Required
- **Request Body**: `{ "pin": "string" }`
- **Success Response (200)**: `{ "detail": "PIN verified." }`

---

### Two-Factor Authentication (2FA)

#### `GET /users/2fa/generate/`
Generates a new secret key and QR code URL for setting up 2FA.
- **Auth**: Required
- **Success Response (200)**:
  ```json
  {
    "secret_key": "string",
    "qr_code_url": "string"
  }
  ```
  - `qr_code_url`: A URL that generates a QR code scannable by standard TOTP applications (e.g., Google Authenticator, Authy). It should encode a standard `otpauth://` URI.

#### `POST /users/2fa/enable/`
Enables 2FA by verifying the token from the authenticator app.
- **Auth**: Required
- **Request Body**: `{ "token": "string" }`
- **Success Response (200)**: `{ "detail": "2FA enabled successfully." }`

#### `POST /users/2fa/disable/`
Disables 2FA by verifying a final token.
- **Auth**: Required
- **Request Body**: `{ "token": "string" }`
- **Success Response (200)**: `{ "detail": "2FA disabled successfully." }`

---
### Dashboard & Team

_Endpoints for user-specific dashboard data would be detailed here._

---

### KYC (Know Your Customer)

_Endpoints for user KYC submission and status checks would be detailed here._

---

### Transactions & Withdrawals

_Endpoints for viewing transaction history and creating withdrawal requests would be detailed here._

---

### Admin

#### `GET /admin/stats/`
Retrieves platform-wide statistics for the admin dashboard.
- **Auth**: Admin Role Required
- **Success Response (200)**:
  ```json
  {
      "totalUsers": "integer",
      "totalUserReferralEarnings": "string",
      "adminReferralEarnings": "string",
      "pendingWithdrawalsCount": "integer",
      "protocolBalance": "string"
  }
  ```
  - `totalUserReferralEarnings`: Cumulative referral earnings distributed to **all users** across the platform.
  - `adminReferralEarnings`: Referral earnings collected specifically by the **master admin account**.
  - `protocolBalance`: The total funds held by the protocol after commissions have been paid out.

_Other admin endpoints for managing users, KYC, and withdrawals would be detailed here._

---

### Public

#### `POST /contact/`
Submits a message from the public contact form.
- **Public**: Yes
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "subject": "string",
    "message": "string"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Your message has been received."
  }
  ```
---

## 4. Key Flows

### Authentication Flow
1.  **Login**: Client sends `email` and `password` to `POST /auth/login/`.
2.  **Backend Check**:
    -   If credentials are valid and 2FA is **disabled**, return JWT `access` and `refresh` tokens.
    -   If credentials are valid and 2FA is **enabled**, return `{ "two_factor_required": true, "user_id": "..." }`.
3.  **2FA Verification** (if required):
    -   Client prompts user for 2FA token.
    -   Client sends `user_id` and `token` to `POST /auth/2fa/verify/`.
    -   If valid, backend returns JWT tokens.
4.  **Authenticated Requests**: Client includes the `access` token in the `Authorization: Bearer <token>` header for all protected endpoints. This flow applies to both regular users and admins.

### User Registration
1.  **Form Submission**: User fills out the signup form, including an optional `referralCode`.
2.  **Payment**: The frontend should handle the £50 payment via a payment gateway (e.g., Stripe) *before* calling the registration endpoint.
3.  **API Call**: Upon successful payment, the client sends user details to `POST /auth/register/`.
4.  **Backend Process**:
    -   The backend creates the new user account.
    -   It associates the user with the referrer if a valid `referralCode` was provided.
    -   It immediately returns JWTs to log the new user in.

### KYC & Withdrawal Process
1.  **KYC Submission**: User submits identity documents via `POST /kyc/submit/`. The status becomes `pending`.
2.  **Admin Review**: An admin reviews the submission from an admin panel list (`GET /admin/kyc/`).
3.  **Admin Action**: Admin approves or rejects the request (`POST /admin/kyc/{id}/process/`). The user's `is_kyc_verified` status is updated.
4.  **Withdrawal Prerequisite**: User must have `is_kyc_verified: true` and a `hasPin: true` to initiate a withdrawal.
5.  **Withdrawal Request**:
    -   User verifies their PIN via `POST /users/verify-pin/`.
    -   Upon success, the user submits the withdrawal details to `POST /withdrawals/`.
6.  **Admin Approval**: The request appears in the admin queue (`GET /admin/withdrawals/`). An admin must approve it (`POST /admin/withdrawals/{id}/approve/`) before funds are disbursed.
