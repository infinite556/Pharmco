# Backend API

This directory contains the Express.js and MongoDB backend for the project.
The backend uses ES modules, Mongoose, HTTP-only authentication cookies, and
refresh-session rotation.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB, either a local instance or MongoDB Atlas

## First-time setup

From this directory:

```bash
npm install
```

Update `.env` with a real MongoDB connection string and unique secrets.
Never commit `.env` or share its secret values.

Example:

`DB_URL` must not end with a backslash. It must include a valid database name,
for example:

```env
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/final_project
```

## Running the server

Development mode uses Nodemon:

```bash
npm start
```

The API is available at `http://localhost:4000`. The port can be changed
through `PORT`.

## Authentication API

All authentication routes use the `/api/v1/auth` prefix.

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json
```

Request body:

```json
{
  "name": "Jane Doe",
  "phone": "+123456789",
  "email": "jane@example.com",
  "password": "StrongPassword1!",
  "passwordConfirm": "StrongPassword1!"
}
```

Successful registration creates a refresh session and sets HTTP-only access
and refresh cookies.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "jane@example.com",
  "password": "StrongPassword1!"
}
```

### Get the current user

```http
GET /api/v1/auth/me
```

The request must include the access-token cookie or an authorization header:

```http
Authorization: Bearer <access-token>
```

### Refresh credentials

```http
POST /api/v1/auth/refresh
```

The browser sends the refresh cookie automatically. The server verifies the
stored hash, atomically rotates the refresh token, and sets new credentials.
The refresh token is never returned in the JSON response.

### Logout from the current session

```http
POST /api/v1/auth/logout
```

This revokes the refresh session associated with the current refresh cookie and
clears both authentication cookies.

### Logout from all devices

```http
POST /api/v1/auth/logout-all
```

This requires authentication and revokes all active refresh sessions belonging
to the current user.

## Frontend integration

When using browser cookies, frontend requests must include credentials:

```js
fetch("http://localhost:4000/api/v1/auth/login", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
```

For cross-origin frontend and backend deployments:

1. Add the frontend origin to `TRUSTED_ORIGINS`.
2. Do not use `*` as an origin with credentials.
3. Configure the frontend to use `credentials: "include"`.
4. Use `COOKIE_SAME_SITE=none` only when cross-site cookies are required.
5. Cross-site cookies require HTTPS and secure cookies in production.

State-changing requests are checked against the request `Origin`. The backend
does not treat `HttpOnly` cookies or CORS as a complete CSRF defense.

## Authentication design

- Access tokens are short-lived signed tokens.
- Access tokens contain only the user ID (`sub`) and `tokenType: "access"`.
- Refresh tokens are opaque values generated with `crypto.randomBytes()`.
- Only SHA-256 refresh-token hashes are stored in MongoDB.
- Refresh sessions support multiple browsers and devices per user.
- Refresh rotation uses an atomic database update so the same refresh token
  cannot be rotated successfully twice.
- Expired sessions are rejected in application logic and cleaned by a MongoDB
  TTL index.
- Access tokens remain valid until expiration after logout because they are
  stateless. Logout revokes refresh sessions and prevents new access tokens.

## Project structure

```text
backend/
├── app.js
├── controllers/
│   └── authController.js
├── db/
│   └── connectDB.js
├── middleware/
│   ├── csrf.js
│   └── protect.js
├── models/
│   ├── refreshSessionModel.js
│   └── userModel.js
├── routers/
│   └── authRouter.js
├── services/
│   └── authServices.js
└── utils/
    ├── appError.js
    └── catchAsync.js
```

Controllers handle HTTP requests and responses. Authentication and session
logic belongs in `services/authServices.js`. Database schemas belong in
`models/`.

## Team workflow

1. Pull the latest changes.
2. Run `npm install` after dependency changes.
3. Copy `.env.example` to `.env` on a new machine.
4. Use a separate local or test database; do not use production credentials.
5. Run `npm start`.
6. Test login and refresh flows with a client that supports cookies.
7. Do not commit `.env`, database credentials, JWT secrets, or refresh tokens.
8. Keep authentication business logic in the service layer.
9. Add tests for changes to login, refresh, logout, or protected routes.

## Verification

The repository currently does not contain an automated test suite. The
configured `npm test` command is still the default placeholder and reports
`Error: no test specified`.

Before opening a pull request, verify:

- The server starts with a valid `.env`.
- Registration and login set cookies.
- `/api/v1/auth/me` rejects requests without credentials.
- Refresh rotates the cookie and rejects reuse of the old token.
- Logout revokes the matching session.
- Logout-all does not affect a different user's sessions.