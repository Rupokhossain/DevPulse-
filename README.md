# DevPulse – Internal Tech Issue & Feature Tracker

**DevPulse** is a collaborative backend platform designed for software teams to report bugs, suggest features, and coordinate resolutions efficiently. Built with a focus on strict data integrity, modular architecture, and raw SQL performance — no ORMs, no shortcuts.

- **Live API:** https://dev-pulse-pi.vercel.app/
- **Repository:** https://github.com/Rupokhossain/DevPulse

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (LTS) |
| Language | TypeScript (Strict Mode) |
| Framework | Express.js |
| Database | PostgreSQL (NeonDB) |
| DB Driver | Native `pg` (no ORM) |
| Auth | JSON Web Token (JWT) |
| Security | Bcrypt password hashing |

> **Design Constraint:** All database operations use raw `pool.query()` calls. No ORMs (Prisma, Sequelize, etc.) and no SQL JOINs are used anywhere in the codebase.

---

## Key Features

- **Modular Architecture** — Organized into independent, scalable modules (`auth`, `issues`) for clean separation of concerns.
- **Role-Based Access Control (RBAC)** — Two distinct roles with enforced permission boundaries at the API level.
- **Raw SQL Performance** — Direct PostgreSQL queries for full control over execution, with zero ORM overhead.
- **Dynamic Filtering & Sorting** — Issues can be filtered by `type` and `status`, and sorted by `newest` or `oldest` — all without SQL JOINs.
- **Centralized Error Handling** — A global middleware catches all errors and returns consistent, structured JSON responses.

---

## Role Permissions

| Action | Contributor | Maintainer |
|---|:---:|:---:|
| Register / Login | ✅ | ✅ |
| Create an issue | ✅ | ✅ |
| Update **own** open issues | ✅ | ✅ |
| Update **any** issue | ❌ | ✅ |
| Change issue workflow status | ❌ | ✅ |
| Delete any issue | ❌ | ✅ |

---

## Database Schema

### `users`
```sql
CREATE TABLE users (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100)        NOT NULL,
  email     VARCHAR(150) UNIQUE NOT NULL,
  password  TEXT                NOT NULL,  -- bcrypt hashed
  role      VARCHAR(20)         NOT NULL DEFAULT 'contributor', -- 'contributor' | 'maintainer'
  created_at TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);
```

### `issues`
```sql
CREATE TABLE issues (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,
  type        VARCHAR(50)   NOT NULL,  -- 'bug' | 'feature' | 'improvement'
  status      VARCHAR(50)   NOT NULL DEFAULT 'open',  -- 'open' | 'in_progress' | 'resolved'
  reporter_id INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Rupokhossain/DevPulse.git
cd DevPulse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:
```env
PORT=5000
CONNECTIONSTRING=your_neondb_postgres_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Run the application
```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

---

## API Reference

All protected routes require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```

---

### Authentication

#### `POST /api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "name": "Siam Ahmed",
  "email": "siam@example.com",
  "password": "securepassword123",
  "role": "contributor"
}
```

**Response `201`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Siam Ahmed",
    "email": "siam@example.com",
    "role": "contributor"
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "siam@example.com",
  "password": "securepassword123"
}
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Issues

#### `POST /api/issues` — 🔒 Protected
Create a new issue. The reporter is identified from the JWT token.

**Request Body:**
```json
{
  "title": "Login button unresponsive on mobile",
  "description": "The login button does not trigger any action on iOS Safari.",
  "type": "bug"
}
```

**Response `201`:**
```json
{
  "message": "Issue created successfully",
  "issue": {
    "id": 12,
    "title": "Login button unresponsive on mobile",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2025-05-23T10:00:00.000Z"
  }
}
```

---

#### `GET /api/issues`
Retrieve all issues. Supports optional filtering and sorting via query parameters.

**Query Parameters:**

| Parameter | Type | Values | Description |
|---|---|---|---|
| `type` | string | `bug`, `feature`, `improvement` | Filter by issue type |
| `status` | string | `open`, `in_progress`, `resolved` | Filter by status |
| `sort` | string | `newest`, `oldest` | Sort by creation date |

**Example Request:**
```
GET /api/issues?type=bug&status=open&sort=newest
```

**Response `200`:**
```json
{
  "total": 2,
  "issues": [
    {
      "id": 12,
      "title": "Login button unresponsive on mobile",
      "type": "bug",
      "status": "open",
      "reporter_id": 1,
      "created_at": "2025-05-23T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/issues/:id`
Retrieve a single issue by ID.

**Response `200`:**
```json
{
  "id": 12,
  "title": "Login button unresponsive on mobile",
  "description": "The login button does not trigger any action on iOS Safari.",
  "type": "bug",
  "status": "open",
  "reporter_id": 1,
  "created_at": "2025-05-23T10:00:00.000Z",
  "updated_at": "2025-05-23T10:00:00.000Z"
}
```

---

#### `PATCH /api/issues/:id` — 🔒 Protected
Update an issue. Contributors can only update their own `open` issues. Maintainers can update any issue and change `status`.

**Request Body (Contributor):**
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Request Body (Maintainer — can also change status):**
```json
{
  "status": "in_progress"
}
```

**Response `200`:**
```json
{
  "message": "Issue updated successfully",
  "issue": { "id": 12, "status": "in_progress", "updated_at": "2025-05-23T11:00:00.000Z" }
}
```

---

#### `DELETE /api/issues/:id` — 🔒 Maintainer Only
Permanently delete an issue.

**Response `200`:**
```json
{
  "message": "Issue deleted successfully"
}
```

---

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Unauthorized: You can only update your own open issues",
  "statusCode": 403
}
```

---

## Author

**Siam Ahmed**
GitHub: [@Rupokhossain](https://github.com/Rupokhossain)
