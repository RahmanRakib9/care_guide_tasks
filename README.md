# Secure Note-Taking Application

A production-ready, secure, full-stack Note-Taking Application built with Node.js, Express.js, MongoDB (Mongoose), and React (Vite). Designed strictly according to pragmatic software engineering principles, featuring robust JWT authentication, fine-grained Role-Based Access Control (RBAC), explicit MongoDB indexing strategies, and mandatory MongoDB aggregation pipelines.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [Monorepo Architecture](#4-monorepo-architecture)
5. [Prerequisites & Getting Started](#5-prerequisites--getting-started)
6. [Environment Variables](#6-environment-variables)
7. [Running the Application](#7-running-the-application)
8. [Database Seeding](#8-database-seeding)
9. [Automated Testing Suite](#9-automated-testing-suite)
10. [REST API Documentation](#10-rest-api-documentation)
11. [Authentication & Token Lifecycle](#11-authentication--token-lifecycle)
12. [Role-Based Access Control (RBAC)](#12-role-based-access-control-rbac)
13. [Database Schemas & Design](#13-database-schemas--design)
14. [Indexing Strategy & Justifications (Interview Deep Dive)](#14-indexing-strategy--justifications-interview-deep-dive)
15. [MongoDB Aggregation Pipelines (Interview Deep Dive)](#15-mongodb-aggregation-pipelines-interview-deep-dive)
16. [Example API Requests & Responses](#16-example-api-requests--responses)
17. [Development Credentials](#17-development-credentials)

---

## 1. Project Overview

The Secure Note-Taking Application is a backend-focused system engineered with simplicity, security, and query efficiency at its core. It isolates private user notes behind strict ownership boundaries while granting administrators oversight over users, notes, and analytical aggregation pipelines.

The architecture emphasizes:
- **Zero unnecessary abstraction**: Straightforward `Route -> Validator -> Auth/RBAC -> Controller -> Service -> Model` execution flow.
- **Fail-early validation**: Every incoming request payload (body, query, route params) is validated with Zod before reaching business logic.
- **Defensive indexing**: Every index created is justified by an actual query pattern or aggregation stage; no speculative or redundant indexes are present.
- **Strict aggregation adherence**: The two required aggregation scenarios run in exactly ONE aggregation call each, without using in-memory JavaScript grouping or split queries.

---

## 2. Key Features

- **JWT Authentication**: Secure stateless token issuance and verification with bcrypt salted password hashing (rounds = 10).
- **Role-Based Access Control (RBAC)**: Distinguishes `user` and `admin` roles. Normal users are isolated to their own private notes; admins can manage users and view all notes.
- **Self-Preservation & Privilege Escalation Guards**:
  - Public registration cannot assign the `admin` role (strictly forced to `user`).
  - Administrators cannot delete or demote their own account.
  - The system prevents demoting or deleting the last remaining administrator.
- **Mandatory Pagination**: Every list endpoint (`/api/notes`, `/api/admin/users`, `/api/posts`, `/api/admin/users/interests`) implements stable pagination with total records and total page counts.
- **MongoDB Aggregation Scenario 1 (Interest Grouping)**: Groups users by their `interests` array in **exactly ONE** `collection.aggregate()` call using `$unwind`, `$group`, `$sort`, and `$facet`.
- **MongoDB Aggregation Scenario 2 ($lookup Posts)**: Joins user posts from an independent collection in **one aggregation pipeline** utilizing an indexed foreign key.
- **Centralized Error Handling**: Standardized error response envelopes avoiding sensitive data or internal stack traces in production.
- **Turnkey Development**: Starts smoothly with an external MongoDB URI, or seamlessly boots an isolated development database if no external daemon is running.
- **Minimal React Frontend**: Fast, functional Vite-based client to demonstrate all user and admin flows.

---

## 3. Technology Stack

### Backend
- **Runtime**: Node.js (v20+ / ES Modules)
- **Framework**: Express.js (v4.21+)
- **Database & ODM**: MongoDB with Mongoose (v8.9+)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Request Validation**: Zod (`zod`)
- **Security & Hardening**: `helmet`, `cors`, `express-rate-limit`
- **Testing**: Vitest (`vitest`), Supertest (`supertest`), `mongodb-memory-server`

### Frontend
- **Framework**: React 18 (Vite)
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios with automatic JWT bearer interceptor
- **Styling**: Pure semantic modern CSS (no heavyweight UI framework bloat)

---

## 4. Monorepo Architecture

The monorepo uses npm workspaces with two independent packages:

```
project-root/
├── client/                     # Minimal React Frontend
│   ├── src/
│   │   ├── api/                # Axios instance & interceptors
│   │   ├── components/         # Navbar, ProtectedRoute, AdminRoute, Pagination, Alert
│   │   ├── context/            # AuthContext (state, login, register, logout)
│   │   ├── pages/              # Login, Register, Dashboard, NotesList, NoteForm,
│   │   │                       # PostsList, AdminUsers, AdminNotes, AdminInterests
│   │   ├── App.jsx             # Client routing configuration
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Clean minimal stylesheet
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express.js REST API
│   ├── src/
│   │   ├── config/             # DB connection & environment configuration
│   │   ├── constants/          # Role constants ('user', 'admin')
│   │   ├── controllers/        # Request handling & HTTP response formatting
│   │   ├── middlewares/        # Auth, RBAC, Zod validation, rate limiter, error handling
│   │   ├── models/             # Mongoose schemas with explicit schema.index()
│   │   ├── routes/             # Express route definitions
│   │   ├── scripts/            # Idempotent database seed script
│   │   ├── services/           # Core business logic & single-call aggregations
│   │   ├── tests/              # 42 Vitest integration & unit tests
│   │   ├── utils/              # ApiResponse, ApiError, pagination helpers
│   │   ├── validators/         # Zod schemas for body, query, and params
│   │   ├── app.js              # Express application setup
│   │   └── server.js           # Server entry point & graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── vitest.config.js
│
├── package.json                # Root workspace configuration
├── README.md                   # Complete architectural and setup guide
└── .gitignore
```

---

## 5. Prerequisites & Getting Started

### Prerequisites
- Node.js (version 20 or higher recommended)
- npm (version 10 or higher)
- Optional: MongoDB running locally or on MongoDB Atlas (if not present, the development server automatically initializes an in-memory database instance).

### Installation
Clone or navigate to the repository root and install dependencies across all workspaces:

```bash
npm install
```

---

## 6. Environment Variables

Create `.env` inside the `server/` folder (or copy from `server/.env.example`):

```bash
cp server/.env.example server/.env
```

Default configuration (`server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/secure_notes
JWT_SECRET=super_secret_jwt_key_for_development_replace_in_prod
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

---

## 7. Running the Application

### 1. Run Backend and Frontend Concurrently (Recommended)
```bash
npm run dev
```
- Server runs on: `http://localhost:5000`
- Client runs on: `http://localhost:5173`

### 2. Run Backend Independently
```bash
npm run dev:server
# or
npm run start:server
```

### 3. Run Frontend Independently
```bash
npm run dev:client
```

---

## 8. Database Seeding

To populate the database with development accounts, notes, and posts:

```bash
npm run seed
```

This runs `server/src/scripts/seed.js`, which is **fully idempotent**. It creates:
- 1 Admin account (`admin@example.com`)
- 3 Normal user accounts (`alice@example.com`, `bob@example.com`, `charlie@example.com`) with overlapping interests (`coding`, `architecture`, `cloud`, `reading`, `security`)
- 8 Private notes assigned to different users
- 5 Public posts assigned to different users

---

## 9. Automated Testing Suite

The backend contains 42 automated tests spanning authentication, RBAC, notes CRUD, validation, aggregation pipelines, and index execution verification:

```bash
npm test
```

### Test Coverage Highlights:
- **Authentication**: Successful registration, duplicate email rejection, registration privilege escalation prevention (role override ignored), login credentials validation, invalid password rejection, JWT expiration/format rejection.
- **RBAC**: Normal users forbidden from admin routes (403), users forbidden from viewing/updating/deleting notes of other users (403), admins permitted to manage all users and view all notes.
- **Admin Safety Rules**: Admin self-demotion prevention (400), admin self-deletion prevention (400), last administrator preservation check (400).
- **Notes CRUD & Pagination**: Creation, retrieval, update, deletion, pagination parameters (`page`, `limit`, `total`, `totalPages`).
- **Aggregation Scenario 1**: Interest grouping, total users per interest count, handling empty interests, pagination on groups.
- **Aggregation Scenario 2**: `$lookup` pipeline joining user posts, empty posts handling, non-existent user 404, invalid ObjectId 400.
- **Explicit Indexing Verification**: Verifies unique indexes, compound indexes, and queries using `explain('executionStats')` with `IXSCAN`.

---

## 10. REST API Documentation

### Base URL: `/api`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **Health** | | | |
| `GET` | `/api/health` | Public | Service health check |
| **Authentication** | | | |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register a new user (`name`, `email`, `password`, `interests`) |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Login with email and password, returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| **Notes** | | | |
| `POST` | `/api/notes` | Authenticated | Create a private note |
| `GET` | `/api/notes` | Authenticated | List notes (Users see own; Admins see all) (Paginated) |
| `GET` | `/api/notes/:id` | Authenticated | Get note by ID (Owner or Admin only) |
| `PATCH` | `/api/notes/:id` | Authenticated | Update note by ID (Owner or Admin only) |
| `DELETE` | `/api/notes/:id` | Authenticated | Delete note by ID (Owner or Admin only) |
| **Admin User Management** | | | |
| `POST` | `/api/admin/users` | Admin Only | Create user with explicit role assignment |
| `GET` | `/api/admin/users` | Admin Only | List all users (Paginated) |
| `GET` | `/api/admin/users/:id` | Admin Only | Get single user details |
| `PATCH` | `/api/admin/users/:id` | Admin Only | Update user role or profile (Protected against self-demotion & last admin demotion) |
| `DELETE` | `/api/admin/users/:id` | Admin Only | Delete user and cascade delete notes/posts (Protected against self-deletion & last admin deletion) |
| **Admin Aggregation** | | | |
| `GET` | `/api/admin/users/interests` | Admin Only | **Scenario 1**: Single aggregate call grouping users by interest (Paginated) |
| **Posts** | | | |
| `POST` | `/api/posts` | Authenticated | Create a public post |
| `GET` | `/api/posts` | Public | List all public posts (Paginated) |
| `GET` | `/api/posts/users/:userId` | Public | **Scenario 2**: Retrieve user profile and all posts via `$lookup` pipeline |

---

## 11. Authentication & Token Lifecycle

### Chosen Strategy
- Stateless JWT tokens passed in HTTP `Authorization: Bearer <token>` header.
- The token payload contains:
  ```json
  {
    "id": "<user_id>",
    "role": "user"
  }
  ```
- Expiration is set via `JWT_EXPIRES_IN` (default `1d`).

### Trade-offs & Security Considerations
1. **Stateless Scalability vs. Immediate Invalidation**:
   - *Advantage*: Stateless JWTs require no database session lookups on every request, allowing seamless horizontal API scaling.
   - *Mitigation*: Our `authenticate` middleware loads the current user record from the database to ensure the user still exists and their account has not been deleted or modified.
2. **Short-lived Expiry**:
   - Protects against replay attacks if a token is intercepted.
3. **Role Verification Boundary**:
   - The frontend role check is strictly a UI/UX convenience. The backend always extracts identity and role from the verified JWT and trusted database state.

---

## 12. Role-Based Access Control (RBAC)

Two distinct roles are implemented:

```
          [Public Client]
                 |
        +--------+--------+
        |                 |
  (Register/Login)   (Public Posts Feed)
        |                 |
        v                 v
   [Authenticated User]
        |-- Create / View / Update / Delete Own Notes
        |-- Create Public Posts
        |
        v
      [Admin] (Inherits all user permissions)
        |-- View / Edit / Delete ANY note in system
        |-- Manage User accounts (Create, Role Change, Delete)
        |-- View Aggregation Views (Interest grouping)
```

### Safety Rules Enforced on Backend:
1. **No Public Admin Creation**: The public registration endpoint forces `role: 'user'` regardless of body contents.
2. **Admin Self-Demotion Guard**: An administrator cannot change their own role to 'user' (`400 Bad Request`).
3. **Last Admin Demotion Guard**: Demoting the only administrator in the system is rejected (`400 Bad Request`).
4. **Admin Self-Deletion Guard**: An administrator cannot delete their own account (`400 Bad Request`).
5. **Last Admin Deletion Guard**: Deleting the final administrator is rejected (`400 Bad Request`).

---

## 13. Database Schemas & Design

### User Schema (`server/src/models/user.model.js`)
```javascript
{
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  interests: { type: [String], default: [] },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```

### Note Schema (`server/src/models/note.model.js`)
```javascript
{
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```

### Post Schema (`server/src/models/post.model.js`)
```javascript
{
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```

---

## 14. Indexing Strategy & Justifications (Interview Deep Dive)

Every index is declared explicitly using `schema.index()`. Redundant indexes and duplicate `_id` indexes are completely avoided.

### 1. `User` Collection Indexes

| Index Definition | Type | Queries / Aggregations Supported | Technical Justification | Limitations |
|---|---|---|---|---|
| `userSchema.index({ email: 1 }, { unique: true })` | Single / Unique | `User.findOne({ email })` during `/api/auth/login` and duplicate check in registration | Enforces data uniqueness at database engine level and provides $O(1)$ B-Tree index lookup. | Case-insensitive matching requires string normalization before query (handled by `lowercase: true`). |
| `userSchema.index({ createdAt: -1 })` | Single | `User.find().sort({ createdAt: -1 })` during admin user listing | Satisfies stable reverse chronological sorting for paginated user listing without in-memory sorting (`SORT` stage). | Does not index user fields other than `createdAt`. |
| `userSchema.index({ interests: 1 })` | Multikey | Queries filtering users by interest and `$unwind` stage in aggregation | Each element in the `interests` array receives an index entry in the B-Tree, speeding up interest lookups. | Multikey indexes have higher write overhead when array elements are frequently appended/removed. |

### 2. `Note` Collection Indexes

| Index Definition | Type | Queries / Aggregations Supported | Technical Justification | Limitations |
|---|---|---|---|---|
| `noteSchema.index({ userId: 1, createdAt: -1 })` | Compound | `Note.find({ userId }).sort({ createdAt: -1 })` for user-specific note list | Strictly follows MongoDB's **ESR rule** (Equality on `userId`, Sort on `createdAt`). Allows both filtering and sorting directly in the index scan (`IXSCAN`), eliminating expensive memory sorting. | Queries that filter *only* on `createdAt` cannot use this index because `userId` is the index prefix. |
| `noteSchema.index({ createdAt: -1 })` | Single | `Note.find().sort({ createdAt: -1 })` for admin note list | Supports admin queries that list all users' notes without a `userId` filter. | Only supports queries sorted by `createdAt`. |

### 3. `Post` Collection Indexes

| Index Definition | Type | Queries / Aggregations Supported | Technical Justification | Limitations |
|---|---|---|---|---|
| `postSchema.index({ userId: 1, createdAt: -1 })` | Compound | **$lookup foreignField join** from User to Post on `userId`, plus user-specific post sorting | **CRITICAL for Aggregation Scenario 2**: In `$lookup`, `foreignField: "userId"` must be indexed. Without this index, MongoDB performs a full collection scan (`COLLSCAN`) of `posts` for every matched user. | Prefix is `userId`; queries filtering only on `title` or `content` do not use it. |
| `postSchema.index({ createdAt: -1 })` | Single | `Post.find().sort({ createdAt: -1 })` for public feed | Supports reverse chronological feed sorting with pagination without in-memory sorting. | Single field index. |

---

## 15. MongoDB Aggregation Pipelines (Interview Deep Dive)

### Scenario 1: Group Users by Interests (Single Pipeline)

**Requirement**: User profiles contain an `interests` array. Build a view that groups users by interests. Use **exactly ONE** `collection.aggregate()` call. No additional queries, no `find()`, no `populate()`, and no in-memory grouping in JavaScript.

**Implementation (`server/src/services/user.service.js`)**:
```javascript
User.aggregate([
  // Stage 1: Match users who have a non-empty interests array
  {
    $match: {
      interests: { $exists: true, $type: 'array', $ne: [] }
    }
  },
  // Stage 2: Deconstruct interests array so each interest is a separate document
  {
    $unwind: '$interests'
  },
  // Stage 3: Normalize whitespace
  {
    $addFields: {
      interestClean: { $trim: { input: '$interests' } }
    }
  },
  // Stage 4: Filter out empty strings
  {
    $match: {
      interestClean: { $ne: '' }
    }
  },
  // Stage 5: Group by interest, collecting users and computing total count
  {
    $group: {
      _id: '$interestClean',
      users: {
        $push: {
          _id: '$_id',
          name: '$name',
          email: '$email',
          role: '$role',
          createdAt: '$createdAt'
        }
      },
      totalUsers: { $sum: 1 }
    }
  },
  // Stage 6: Sort interests by popularity (totalUsers desc), then alphabetically
  {
    $sort: {
      totalUsers: -1,
      _id: 1
    }
  },
  // Stage 7: Project structured output
  {
    $project: {
      _id: 1,
      interest: '$_id',
      users: 1,
      totalUsers: 1
    }
  },
  // Stage 8: Paginate within the same single aggregate call using $facet
  {
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: 'count' }]
    }
  }
]);
```

**Why this satisfies the interview requirements**:
1. **Single Database Call**: Both the grouped interest data and the total group count are returned in one atomic operation using `$facet`.
2. **Zero In-Memory JavaScript Manipulation**: Grouping and sorting are pushed down to MongoDB's C++ aggregation engine.
3. **Empty Array Safety**: Users with empty or missing interests arrays are filtered in Stage 1 and do not create null/empty groups.

---

### Scenario 2: User Posts with $lookup (Single Pipeline)

**Requirement**: Retrieve a user and all posts belonging to that user using **one aggregation pipeline with a `$lookup` stage**. Handle non-existent users and invalid IDs. Ensure the foreign field is indexed.

**Implementation (`server/src/services/post.service.js`)**:
```javascript
User.aggregate([
  // Stage 1: Match the specific user by their _id
  {
    $match: {
      _id: userObjectId
    }
  },
  // Stage 2: Join posts collection on foreignField "userId"
  {
    $lookup: {
      from: 'posts',
      localField: '_id',
      foreignField: 'userId',
      as: 'posts',
      pipeline: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $project: { __v: 0 } }
      ]
    }
  },
  // Stage 3: Project user data, joined posts, and computed totalPosts
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      interests: 1,
      createdAt: 1,
      posts: 1,
      totalPosts: { $size: '$posts' }
    }
  }
]);
```

**Why this satisfies the interview requirements**:
1. **Index-Supported Join**: The `posts` collection has a compound index `{ userId: 1, createdAt: -1 }`. MongoDB resolves `foreignField: "userId"` directly via this index rather than a collection scan.
2. **Sub-pipeline Sorting**: Posts within the `$lookup` are sorted at the database level.
3. **Zero Multiple Queries**: Neither `Post.find()` nor Mongoose `populate()` is used. If the user does not exist, an empty array is returned and converted to an explicit `404 ApiError`.

---

## 16. Example API Requests & Responses

### 1. User Login
`POST /api/auth/login`
```json
{
  "email": "alice@example.com",
  "password": "Password123!"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6af2fe8f202ed1c0a2365868",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "user",
      "interests": ["coding", "react", "architecture", "reading"],
      "createdAt": "2026-11-10T11:22:55.928Z",
      "updatedAt": "2026-11-10T11:22:55.928Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Paginated Notes Retrieval
`GET /api/notes?page=1&limit=2`
`Headers: Authorization: Bearer <token>`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": {
    "notes": [
      {
        "_id": "6af2fe8f202ed1c0a2365870",
        "title": "React Architecture Best Practices",
        "content": "Keep state as local as possible...",
        "userId": {
          "_id": "6af2fe8f202ed1c0a2365868",
          "name": "Alice Johnson",
          "email": "alice@example.com",
          "role": "user"
        },
        "createdAt": "2026-11-10T11:22:55.934Z",
        "updatedAt": "2026-11-10T11:22:55.934Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 3,
    "totalPages": 2
  }
}
```

### 3. Scenario 1 — Grouped Interests Aggregation
`GET /api/admin/users/interests?page=1&limit=2`
`Headers: Authorization: Bearer <admin_token>`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Users grouped by interests retrieved successfully",
  "data": {
    "groups": [
      {
        "_id": "coding",
        "interest": "coding",
        "totalUsers": 3,
        "users": [
          {
            "_id": "6af2fe8f202ed1c0a2365867",
            "name": "System Admin",
            "email": "admin@example.com",
            "role": "admin"
          },
          {
            "_id": "6af2fe8f202ed1c0a2365868",
            "name": "Alice Johnson",
            "email": "alice@example.com",
            "role": "user"
          }
        ]
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 8,
    "totalPages": 4
  }
}
```

### 4. Scenario 2 — User Posts with $lookup
`GET /api/posts/users/6af2fe8f202ed1c0a2365868`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "User posts retrieved successfully via $lookup aggregation",
  "data": {
    "user": {
      "_id": "6af2fe8f202ed1c0a2365868",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "user",
      "interests": ["coding", "react", "architecture", "reading"],
      "posts": [
        {
          "_id": "6af2fe8f202ed1c0a2365879",
          "title": "Why MongoDB Indexes Matter for List Queries",
          "content": "Without compound indexes adhering to ESR...",
          "userId": "6af2fe8f202ed1c0a2365868",
          "createdAt": "2026-11-10T11:22:55.939Z"
        }
      ],
      "totalPosts": 2
    }
  }
}
```

---

## 17. Development Credentials

Pre-configured development accounts created by `npm run seed`:

| Name | Email | Password | Role | Interests |
|---|---|---|---|---|
| **System Admin** | `admin@example.com` | `Password123!` | `admin` | `security`, `cloud`, `architecture`, `coding` |
| **Alice Johnson** | `alice@example.com` | `Password123!` | `user` | `coding`, `react`, `architecture`, `reading` |
| **Bob Smith** | `bob@example.com` | `Password123!` | `user` | `coding`, `cloud`, `devops` |
| **Charlie Davis** | `charlie@example.com` | `Password123!` | `user` | `reading`, `design`, `security` |
