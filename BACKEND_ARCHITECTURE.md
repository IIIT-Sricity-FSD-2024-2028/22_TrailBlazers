# Wavevents Backend Layered Architecture & Viva Guide

This document describes the 5-layer backend architecture implemented for the **Event Management and Post-Event Analytics Platform**, detailing the design rationale, responsibilities of each layer, data access flows, and key technical concepts for academic viva defense.

---

## 1. Architecture Overview

The backend follows a strict **Separation of Concerns (SoC)** software engineering design pattern using Node.js, Express, and SQLite (`better-sqlite3`).

```
React (Frontend Client)
       │
       ▼ (HTTP REST API Request)
    Routes (URL Routing & Middleware Attachment)
       │
       ▼
  Middleware (JWT Authentication & Role Permission Verification)
       │
       ▼
  Controllers (Request Parsing, HTTP Status Codes & JSON Responses)
       │
       ▼
   Services (Business Rules, Validation & Analytics Engine)
       │
       ▼
 Repositories (Data Access Layer & Atomic SQL Queries)
       │
       ▼
 Database Engine (SQLite3 / db.js)
```

---

## 2. Layer Responsibilities & Implementation

### 1. Routes Layer (`backend/src/routes/`)
- **Responsibility**: Map HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and URL patterns to their respective controller methods, binding required authentication middleware.
- **Key Modules**:
  - `routes/auth.js`: `/api/auth/register`, `/api/auth/login`, `/api/auth/verify-email`, `/api/auth/me`, `/api/auth/logout`.
  - `routes/events.js`: `/api/events`, `/api/events/:id`, `/api/events/:id/questions`, `/api/events/questions/:id/upvote`, `/api/events/:id/polls/active`, `/api/events/polls/:id/respond`, `/api/events/:id/feedback`.
  - `routes/tickets.js`: `/api/tickets/register`, `/api/tickets/my`, `/api/tickets/:id`.
  - `routes/analytics.js`: `/api/analytics/dashboard`, `/api/analytics/events`, `/api/analytics/events/:id`, `/api/analytics/events/:id/*`, `/api/analytics/compare`.
- **Viva Note**: Routes contain **zero business logic** and **zero SQL queries**. They act purely as entry configuration handlers.

### 2. Middleware Layer (`backend/src/middleware/auth.js`)
- **Responsibility**: Validate JSON Web Tokens (JWT) attached in the `Authorization: Bearer <token>` HTTP header, decode the payload, attach the authenticated user context to `req.user`, and enforce role-based access control (RBAC).
- **Key Exports**:
  - `generateToken(user)`: Signs JWT with 7-day expiration containing user ID, email, role, and organization.
  - `authenticateToken(req, res, next)`: Verifies signature and token validity before passing control to next handler.

### 3. Controllers Layer (`backend/src/controllers/`)
- **Responsibility**: Interface between HTTP transport layer and business services. Extract payload from `req.body`, `req.params`, `req.query`, and `req.user`, pass formatted arguments to services, and send consistent HTTP status responses (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Error`).
- **Key Modules**:
  - `controllers/auth.controller.js`
  - `controllers/events.controller.js`
  - `controllers/tickets.controller.js`
  - `controllers/analytics.controller.js`

### 4. Services Layer (`backend/src/services/`)
- **Responsibility**: Encapsulate all business logic, business rules, dynamic calculations, security checks, and notification triggers.
- **Key Modules**:
  - `services/auth.service.js`: User registration logic, bcrypt password hashing, 6-digit email verification code generation, authentication comparison.
  - `services/events.service.js`: Event search filtering, Q&A question submission eligibility, unique upvote checking, active poll filtering, completed-event feedback restrictions.
  - `services/tickets.service.js`: Ticket availability checks, private invitation code/token validation, dynamic subtotal + platform fee calculations, atomic transaction invocation.
  - `services/analyticsService.js`: Post-event analytics calculation engine (Attendance Rate, Engagement Score, Satisfaction Rate, Weighted Performance Score, CSV Report generator).
  - `services/notificationService.js`: In-app notification creation, unread counting, deduplication.

### 5. Repositories Layer (`backend/src/repositories/`)
- **Responsibility**: Pure Data Access Object (DAO) pattern. Perform synchronous, optimized SQL queries using `better-sqlite3` prepared statements.
- **Key Modules**:
  - `repositories/users.repository.js`
  - `repositories/events.repository.js`
  - `repositories/tickets.repository.js`
  - `repositories/analytics.repository.js`

### 6. Database Layer (`backend/src/db.js`)
- **Engine**: SQLite3 (`ffsd_events.db`).
- **Driver**: `better-sqlite3` (synchronous execution, foreign key constraints enabled via `PRAGMA foreign_keys = ON`).

---

## 3. End-to-End Request Lifecycle Example: "User Clicks Attend Event"

Here is the exact step-by-step sequence when an attendee registers for an event:

```
[React UI: PaymentModal.jsx]
       │  Submits POST /api/tickets/register with { eventId, quantity: 2, paymentMethod: 'UPI' }
       ▼
[Express Router: routes/tickets.js]
       │  Matches POST /api/tickets/register
       │  Executes authenticateToken middleware
       ▼
[Middleware: middleware/auth.js]
       │  Decodes Bearer JWT token, validates signature, attaches user object to req.user
       │  Calls next()
       ▼
[Controller: controllers/tickets.controller.js]
       │  Invokes ticketsController.registerTicket(req, res)
       │  Extracts { eventId, quantity, paymentMethod } from req.body and user from req.user
       │  Calls ticketsService.registerTicket(...)
       ▼
[Service: services/tickets.service.js]
       │  1. Verifies user email is verified (findUserVerifiedStatus)
       │  2. Verifies event exists (findEventById)
       │  3. Validates private invitation token/code if event.type === 'CLOSED'
       │  4. Verifies availableTickets >= quantity
       │  5. Calculates price: subtotal = price * qty, platformFee = 5% + ₹25, total = subtotal + fee
       │  6. Generates unique Ticket Number (EVT-2026-XXXXXX) and Transaction ID (TXN-2026-XXXXXXXX)
       │  7. Invokes ticketsRepository.executeRegistrationTransaction(...)
       ▼
[Repository: repositories/tickets.repository.js]
       │  Executes SQLite Atomic Transaction:
       │  - INSERT INTO tickets
       │  - INSERT INTO payments
       │  - UPDATE events SET availableTickets = availableTickets - qty
       │  - UPDATE event_invitations SET status = 'accepted' (if private code used)
       ▼
[Service -> Controller -> React Response]
       │  Returns HTTP 201 Created with ticket details and payment confirmation receipt.
       ▼
[React UI Updates]
       │  Displays confirmation dialog, updates ticket count, navigates to "My Tickets".
```

---

## 4. Key Questions & Answers for Technical Viva

### Q1: Why did you separate Controllers, Services, and Repositories?
**Answer**: Separating these layers ensures high maintainability, testability, and clear separation of concerns:
- **Routes & Controllers** handle HTTP protocol specifics (headers, status codes, request parsing).
- **Services** contain core business domain logic independently of the HTTP layer.
- **Repositories** centralize database access so that database schema changes do not affect business logic or API handlers.

### Q2: How does authentication work across protected routes?
**Answer**: Authentication is stateless using JSON Web Tokens (JWT). When a user logs in, the backend signs a JWT containing the user's ID, role, and email using a secret key (`JWT_SECRET`). The client sends this token in the `Authorization` header (`Bearer <token>`). The `authenticateToken` middleware verifies the token signature on protected endpoints and attaches the user payload to `req.user`.

### Q3: How are post-event analytics calculated?
**Answer**: Post-event analytics are computed dynamically from real database records in `analyticsService.js`:
- **Attendance Rate**: `(Checked-In Attendees / Confirmed Registrations) * 100`
- **Engagement Score**: Average of Q&A participation, Poll participation, and Feedback submission rates.
- **Satisfaction Rate**: `(Average Rating / 5.0) * 100`
- **Overall Performance Score**: Weighted metric (`40% Attendance + 30% Engagement + 30% Satisfaction`, or normalized `55% Attendance + 45% Engagement` if feedback is not yet submitted).

### Q4: How is data consistency maintained during ticket purchase?
**Answer**: Data consistency is enforced using SQLite atomic database transactions (`db.transaction(...)`). When an attendee purchases tickets, the ticket insertion, payment creation, and event ticket capacity decrement occur atomically within a single database transaction. If any step fails, the entire transaction rolls back cleanly.
