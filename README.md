# Wavevents — Event Management & Post-Event Analytics Platform

## 1. System Overview

**Wavevents** is a full-stack event management and post-event analytics platform designed to connect clients, the Revenue Team, Event Management, event staff, attendees, and administrators into a unified operational ecosystem. The platform coordinates the entire event lifecycle from initial client proposals, commercial quotation negotiation, and staff assignment to ticket sales, onsite attendee check-ins, and post-event analytics. It provides a shared source of truth across all roles with granular role-based access control and real-time operational tracking.

---

## 2. Technology Stack & Dependencies

### Frontend (`frontend`)

- **UI Library:** React `^19.0.0` and React DOM `^19.0.0`
- **Build Tool & Dev Server:** Vite `^6.1.0` with `@vitejs/plugin-react` `^4.3.4`
- **Routing:** State-Driven Active Tab Single Page Architecture (`App.jsx` synchronized with `roleRoutes.js` and animated `PageTransition`)
- **HTTP Client:** Native browser Fetch API communicating through Vite's local reverse proxy (`/api` routed to `http://127.0.0.1:5001`)
- **Styling:** Tailwind CSS `^3.4.17`, PostCSS `^8.5.1`, Autoprefixer `^10.4.20`, and Vanilla CSS design tokens (`src/index.css`)
- **Icons & Visual Assets:** Lucide React `^0.475.0`
- **Session State:** LocalStorage token persistence (`ffsd_token`) with active user profile rehydration (`/api/auth/me`)

The exact installed versions are defined in `frontend/package.json` and `package-lock.json`.

### Backend (`backend`)

- **Framework:** NestJS `^11.2.1` using the Express platform (`@nestjs/platform-express` `^11.2.1`)
- **Language & Runtime:** TypeScript `^5.9.3` executing on Node.js `^22.x` (compatible with Node `v18.0.0+`)
- **Configuration:** `@nestjs/config` `^4.0.4` with typed environment variables
- **Data Persistence:** In-Memory Relational Simulation Database (`InMemoryStore`) with automated atomic disk persistence (`backend/data/store-data.json` via temporary swap file) across 31 collections pre-seeded with 717 entities
- **Validation:** `class-validator` `^0.15.1` and `class-transformer` `^0.5.1` enforced globally via `ValidationPipe({ whitelist: true, transform: true })`
- **Authentication:** JWT Bearer strategy (`@nestjs/jwt` `^11.0.2`, `passport-jwt` `^4.0.1`, `passport` `^0.7.0`) and bcrypt password hashing (`bcryptjs` `^3.0.2`, 10 salt rounds)
- **Authorization & RBAC:** Multi-tier `RolesGuard` with `@Roles(...)` metadata reflection, supplemented by `HeaderRoleGuard` for evaluation-time `x-role` header testing
- **Rate Limiting:** `@nestjs/throttler` `^6.5.0` (100 requests per 60,000ms window, with `@SkipThrottle()` on `/api/health`)
- **Security & Headers:** Helmet `^8.3.0` HTTP security headers and CORS enabled for development origins
- **File Uploads:** Multer-based multipart handling (`@types/multer` `^2.2.0`) supporting JPEG, PNG, WebP, GIF, and PDF files up to 5MB, stored in `backend/uploads/` and served statically at `/uploads`
- **API Documentation:** OpenAPI / Swagger via `@nestjs/swagger` `^11.4.7` exposed at `/api/docs`
- **Logging & Auditing:** Custom `NestLoggerService`, `AccessLoggerService` (recording sign-ins, logouts, user creations), `ErrorLoggerService`, `LoggingInterceptor`, and `GlobalExceptionFilter`

The exact installed versions are defined in `backend/package.json` and `package-lock.json`.

---

## 3. Project Directory Structure

```text
React + Nestjs/
├── backend/                              # NestJS 11 TypeScript Backend Application
│   ├── data/
│   │   ├── store-data.json               # Authoritative runtime persistent JSON store 
│   ├── logs/                             # Application runtime access & error stream logs
│   ├── scripts/                          # Automated verification suites & maintenance scripts
│   │   ├── test-auth-suite.js            # Authentication security & password validation suite
│   │   ├── test-capacity-suite.js        # Event Manager 7-event hard cap & 15-workload rule tests
│   │   ├── test-client-stats.js          # Client event ticket and check-in stats tests
│   │   ├── test-completion-pdf-export.js # PDF report generation and download tests
│   │   ├── test-dynamic-stats-updates.js # Dynamic metric recalculation tests
│   │   ├── test-dynamic-user-management.js # IT Support user provisioning & scoping tests
│   │   ├── test-feedback-duplicate-prevention.js # Attendee duplicate feedback prevention tests
│   │   ├── test-it-support-assignment.js # Issue escalation & IT support assignment tests
│   │   └── verify-full-escalation-and-assignment.js # End-to-end commercial handoff tests
│   ├── src-nestjs/                       # Backend Source Code
│   │   ├── common/                       # Shared guards, decorators, filters, interceptors & loggers
│   │   │   ├── constants/                # Workload threshold (15) & capacity (7) constants
│   │   │   ├── decorators/               # @Roles() metadata decorator
│   │   │   ├── filters/                  # GlobalExceptionFilter with error audit stream
│   │   │   ├── guards/                   # JwtAuthGuard, RolesGuard, HeaderRoleGuard
│   │   │   ├── logging/                  # NestLoggerService, AccessLoggerService, LoggingInterceptor
│   │   │   └── middleware/               # RequestLogging, MaintenanceMode, RequestContext
│   │   ├── config/                       # Configuration loader (ports, secrets, thresholds)
│   │   ├── modules/                      # 18 NestJS Feature Modules (Controllers, Services, DTOs)
│   │   │   ├── analytics/                # Performance scoring, comparisons & PDF/CSV export
│   │   │   ├── auth/                     # JWT authentication, registration & access logs
│   │   │   ├── change-requests/          # Post-approval event modification workflows
│   │   │   ├── event-manager/            # Manager workspace, 6-item readiness & sessions
│   │   │   ├── event-requests/           # Client proposal submissions & client statistics
│   │   │   ├── events/                   # Public catalog browsing & event profiles
│   │   │   ├── feedback/                 # Attendee 1-5 ratings & custom survey polls
│   │   │   ├── health/                   # Liveness check endpoint (/api/health)
│   │   │   ├── hierarchy/                # Department Head staff assignment & issue triage
│   │   │   ├── invitations/              # Private VIP invitation token issuance & validation
│   │   │   ├── notifications/            # User inbox alerts, unread counts & modal popups
│   │   │   ├── onsite-coordinator/       # QR check-in processing & live issue logging
│   │   │   ├── polls/                    # Active session polls & attendee response submission
│   │   │   ├── qa/                       # Moderated audience Q&A & question upvoting
│   │   │   ├── revenue/                  # Quotation drafting, milestone payments & escalation
│   │   │   ├── tickets/                  # Ticket purchase, payment confirmation & passes
│   │   │   ├── uploads/                  # Multer file upload handler & metadata
│   │   │   └── users/                    # Dynamic user management & role-scoped provisioning
│   │   ├── repositories/                 # Data access layer & InMemoryStore engine
│   │   ├── seed/                         # Initial static dataset seeder (717 entities)
│   │   ├── app.module.ts                 # Root NestJS application module
│   │   └── main.ts                       # Application bootstrap (CORS, Helmet, Swagger, Pipes)
│   ├── uploads/                          # Static directory for uploaded images and PDFs
│   ├── nest-cli.json                     # Nest CLI configuration (sourceRoot: "src-nestjs")
│   ├── package.json                      # Backend dependencies & compilation scripts
│   └── tsconfig.json                     # TypeScript compiler options
│
├── frontend/                             # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── actors/                       # Role-specific workspaces and dashboards
│   │   │   ├── admin/                    # Super Admin console & IT Support space
│   │   │   ├── attendee/                 # Public event discovery, details & ticket passes
│   │   │   ├── client/                   # Proposal creation form & client dashboard
│   │   │   ├── event-management/         # Department Manager space (staff assignment & triage)
│   │   │   ├── event-manager/            # Event Manager workspace & readiness checklists
│   │   │   ├── onsite-coordinator/       # Onsite check-in console & attendee roster
│   │   │   └── revenue/                  # Commercial quotation builder & revenue dashboard
│   │   ├── auth/                         # Controlled sign-in, registration & email verify modal
│   │   ├── shared/                       # Cross-role components, pages & utilities
│   │   │   ├── components/               # Navbar, Footer, Modals, Badges & Toast notifications
│   │   │   ├── pages/                    # Public landing page & Post-Event Analytics space
│   │   │   └── utils/                    # Role routing resolver (`roleRoutes.js`) & asset helpers
│   │   ├── App.jsx                       # Master router, auth synchronization & page switcher
│   │   ├── index.css                     # Global styles, color tokens & Tailwind directives
│   │   └── main.jsx                      # React 19 DOM root mounting entrypoint
│   ├── package.json                      # Frontend dependencies & build scripts
│   └── vite.config.js                    # Vite dev server & backend proxy configuration
│
├── package.json                          # Root repository package manifest
└── README.md                             # Authoritative system documentation
```

---

## 4. Prerequisites

Before installing and running Wavevents, ensure the following tools are installed on your environment:

- **Node.js:** Node.js `v18.0.0` or higher (tested and verified on Node `v22.16.0`).
- **npm:** npm `v9.0.0` or higher (tested and verified on npm `v10.9.2`).
- **Git:** Git `v2.x` or higher (tested and verified on Git `v2.49.0`).
- **Browser:** A modern web browser (Google Chrome, Mozilla Firefox, or Microsoft Edge) with LocalStorage enabled.
- **Port Availability:** TCP port `5001` (NestJS backend) and TCP port `5173` (Vite frontend dev server) must be free.

Check your installed versions:

```bash
node --version
npm --version
git --version
```

---

## 5. Installation & Setup

Clone the repository and install dependencies for both the frontend and backend applications:

```bash
# 1. Clone the repository
git clone https://github.com/IIIT-Sricity-FSD-2024-2028/22_TrailBlazers.git
cd "React + Nestjs"

# 2. Install Backend Dependencies
cd backend
npm install

# 3. Install Frontend Dependencies
cd ../frontend
npm install

# 4. Return to repository root
cd ..
```

> **Note on Lockfiles:** For a clean and reproducible install, prefer `npm ci` inside each respective directory when lockfiles are committed.

### Environment Configuration

The backend reads configuration settings from `backend/.env` with safe fallbacks defined in `backend/src-nestjs/config/configuration.ts`. 

Configure your local environment at `backend/.env`:

```env
# Backend server port (Default: 5001)
NEST_PORT=5001

# Legacy Express compatibility port (Default: 5000)
PORT=5000

# JSON Web Token signing secret key (Use a secure private secret in production)
JWT_SECRET=your_jwt_signing_secret_here

# Event Manager dual-constraint workload & capacity rules
EVENT_MANAGER_MAX_ASSIGNED_EVENTS=7
EVENT_MANAGER_MAX_CAPACITY=7
EVENT_MANAGER_WORKLOAD_THRESHOLD=15
```

#### Environment Variable Definitions

| Variable | Description | Required | Default Value |
|:---|:---|:---:|:---|
| `NEST_PORT` | HTTP port on which the NestJS backend listens | Optional | `5001` |
| `PORT` | Fallback HTTP port configuration | Optional | `5000` |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens | Required in Prod | Configured secret |
| `EVENT_MANAGER_MAX_ASSIGNED_EVENTS` | Hard ceiling of active assigned events per Event Manager | Optional | `7` |
| `EVENT_MANAGER_WORKLOAD_THRESHOLD` | Workload point ceiling before manager is marked overloaded | Optional | `15` |

The backend automatically initializes its seed dataset on first launch if `backend/data/store-data.json` is missing or empty. When an existing persistent file is present, the server loads it directly to preserve runtime changes.

---

## 6. Run Wavevents Locally

Run the backend and frontend in **two separate terminal windows**.

### Terminal 1 — Backend (NestJS)

```bash
cd backend
npm run dev
```

Expected local endpoints:
- **Backend API:** `http://localhost:5001/api`
- **Interactive Swagger UI:** `http://localhost:5001/api/docs`
- **Health Check:** `http://localhost:5001/api/health`

### Terminal 2 — Frontend (React 19 + Vite)

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite in your browser:
- **Frontend Web App:** `http://localhost:5173`

### Communication & Reverse Proxy

The frontend dev server uses Vite's reverse proxy (defined in `frontend/vite.config.js`) to route all requests starting with `/api` directly to `http://127.0.0.1:5001`. This eliminates browser Cross-Origin Resource Sharing (CORS) friction and ensures consistent header forwarding.

### Quick Startup Troubleshooting

- **Port Conflict on 5001:** If port 5001 is occupied, inspect the active process using `netstat -ano | findstr :5001` and stop the conflicting Node instance before restarting.
- **Backend Proxy Failures (`ECONNREFUSED`):** If the browser reports connection errors for `/api` requests, verify that Terminal 1 is running and that `http://localhost:5001/api/health` responds with `status: "ok"`.

---

## 7. Demo Accounts

The database includes verified development demonstration accounts for every supported role. Each account is pre-configured with the standard development password:

> **Development Password:** `Password123!`

| Role | Demo Email | Password | Main Responsibilities |
|:---|:---|:---|:---|
| **SUPER_ADMIN** | `super.admin@wavevents.com` | `Password123!` | Multi-event oversight, user directory access, platform-wide audit logs, and attendee roster inspection. |
| **DEPARTMENT_MANAGER** *(Event Management)* | `devika.sharma@wavevents.com` | `Password123!` | Operational event triage, staff availability checks, Event Manager & Coordinator allocation, and issue triage. |
| **DEPARTMENT_MANAGER** *(Revenue)* | `siddharth.goel@wavevents.com` | `Password123!` | Commercial pipeline oversight, quotation reviews, contract approvals, and financial metrics. |
| **DEPARTMENT_MANAGER** *(IT Support)* | `it.manager@wavevents.com` | `Password123!` | IT department management, privileged user provisioning (all operational roles + IT Support), and technical escalations. |
| **REVENUE** | `priya.nair@wavevents.com` | `Password123!` | Reviewing event requests, drafting itemized commercial quotations, dispatching contracts, and escalating accepted events. |
| **EVENT_MANAGER** | `rahul.verma@wavevents.com` | `Password123!` | 6-item readiness checklist, registration configuration, assigning coordinators, creating sessions, and publishing survey polls. |
| **ONSITE_COORDINATOR** | `karan.malhotra@wavevents.com` | `Password123!` | Real-time attendee QR/ticket check-ins, attendee roster search, live issue reporting, and operational status updates. |
| **IT_SUPPORT** | `it.support@wavevents.com` | `Password123!` | Resolving technical tickets, user directory search, and provisioning operational user accounts. |
| **CLIENT** | `siddu@gmail.com` | `Password123!` | Submitting event proposals, reviewing quotations, milestone payments, requesting changes, tracking ticket stats & reports. |
| **ATTENDEE** | `suhaas@gmail.com` | `Password123!` | Public event discovery, purchasing tickets, QR pass generation, live session Q&A upvoting, polls, and 1-5 star feedback. |
| **SPEAKER** | *(Provisioned via IT)* | — | Defined in authorization rules (`VALID_ROLES`); accounts can be dynamically created via IT Support or Admin. |

> **Security Note:** These credentials are for **local development and evaluation only**. Never reuse them in a deployed production environment.

---

## 8. Key Demonstration Workflows

Wavevents coordinates the academic and commercial event lifecycle through four primary demonstration workflows.

---

### Workflow 1: Client Event Request and Quotation

**Primary Actors:** Client Organizer (`siddu@gmail.com`), Revenue Specialist (`priya.nair@wavevents.com`)  
**Key Routes / Views:** `my-space` (`create-event`), `revenue-space` (`event-requests`)

#### Objective
Enable a client to submit a structured event proposal and allow the Revenue Team to review requirements, calculate itemized pricing, and issue a formal commercial quotation.

#### Step-by-Step Flow
1. **Client Submits Proposal:** The client signs in, navigates to **Create Event**, and completes the form with event title, category, attendee capacity, dates, venue preferences, and estimated budget (`POST /api/event-requests`).
2. **Backend Persists Request:** The proposal is validated using `CreateEventRequestDto`, initialized with status `PENDING_REVIEW`, and saved to `InMemoryStore`.
3. **Revenue Specialist Reviews Proposal:** The Revenue Specialist opens **Revenue Space** (`GET /api/revenue/event-requests`), selects the proposal, and reviews the requirements (`GET /api/revenue/event-requests/:id`).
4. **Drafting Itemized Quotation:** The Revenue Specialist creates a quotation (`POST /api/revenue/quotations`) with itemized line items (e.g., A/V Equipment, Catering, Venue Rental), tax calculations, and payment milestone terms (e.g., 50% Advance, 50% Final).
5. **Dispatching Quotation:** The Revenue Specialist finalizes and dispatches the quotation (`POST /api/revenue/quotations/:id/send`). The quotation status transitions to `SENT`, and a notification is sent to the client.
6. **Client Decision:** The client views the quotation modal on their dashboard (`GET /api/client/quotations/request/:eventRequestId`) and can:
   - **Accept** the quotation (`POST /api/client/quotations/:id/accept`), transitioning the event request to `COMMERCIAL_APPROVED`.
   - **Request Changes** (`POST /api/client/quotations/:id/request-changes`), sending feedback back to the Revenue Team.
   - **Reject** the quotation (`POST /api/client/quotations/:id/reject`), closing the commercial proposal.

**Expected Outcome:** The event proposal is commercially finalized and approved for operational execution.

---

### Workflow 2: Payment, Event Handoff, and Staff Assignment

**Primary Actors:** Client Organizer (`siddu@gmail.com`), Revenue Specialist (`priya.nair@wavevents.com`), Event Department Head (`devika.sharma@wavevents.com`)  
**Key Routes / Views:** `my-space` (`dashboard`), `revenue-space`, `department-manager-space`

#### Objective
Process milestone payments for an accepted quotation, formally escalate the event from the Revenue Team to Event Management, and assign eligible staff while enforcing workload and capacity constraints.

#### Step-by-Step Flow
1. **Client Submits Milestone Payment:** Following quotation acceptance, the client pays the required deposit (`POST /api/client/quotations/:id/pay`). The backend records the payment in `payments` and updates the quotation's balance. Acceptance and payment are distinct steps: accepting a quotation does not automatically mark it as paid.
2. **Revenue Escalates Event:** The Revenue Specialist marks the event for handoff (`POST /api/revenue/event-requests/:id/escalate`). The backend logs a handoff audit entry and alerts the Event Management Department Head.
3. **Department Head Reviews Queue:** Devika Sharma opens **Department Manager Space** and inspects events awaiting staff assignment (`GET /api/hierarchy/events/awaiting-assignment`).
4. **Assigning Event Manager & Coordinator:** The Department Head selects an eligible Event Manager (e.g., Rahul Verma) and Onsite Coordinator (e.g., Karan Malhotra) and submits the assignment (`POST /api/hierarchy/events/:id/assign`).
5. **Operational Event Generation:** The backend sets the event request to `ASSIGNED`, creates the operational `events` entity with initial capacity, links both staff IDs, and dispatches assignment notifications.

**Expected Outcome:** The event is officially handed off from commercial review and staffed within validated workload limits.

---

### Workflow 3: Event Preparation, Ticketing, and Attendance

**Primary Actors:** Event Manager (`rahul.verma@wavevents.com`), Attendee (`suhaas@gmail.com`), Onsite Coordinator (`karan.malhotra@wavevents.com`)  
**Key Routes / Views:** `event-manager-space`, `explore`, `my-tickets`, `onsite-coordinator-space`

#### Objective
Enable the Event Manager to complete logistical preparation, allow attendees to purchase tickets and generate QR passes, and enable the Onsite Coordinator to verify attendees at the venue.

#### Step-by-Step Flow
1. **Manager Prepares Workspace:** Rahul Verma opens **Event Manager Space** (`GET /api/event-manager/events/:id`), configures registration deadlines and ticket limits (`PUT /api/event-manager/events/:id/configuration`), and adds agenda sessions (`POST /api/event-manager/events/:id/sessions`).
2. **Readiness Checklist Verification:** The manager verifies the 6-item operational readiness checklist (`GET /api/event-manager/events/:id/readiness`). Once readiness reaches 100%, the manager marks the event ready (`POST /api/event-manager/events/:id/ready`), transitioning status to `READY`.
3. **Attendee Discovers Event:** The attendee browses public events on **Explore Events** (`GET /api/events`), filtering by keyword, category, or price. For closed/private events, the attendee validates a private invitation token (`POST /api/invitations/validate`).
4. **Ticket Purchase & Atomic Decrement:** The attendee selects ticket quantity and registers (`POST /api/tickets/register`). The backend atomically:
   - Verifies the attendee's email is verified.
   - Validates that `availableTickets >= requestedQuantity` (preventing overselling).
   - Decrements `events.availableTickets` by the purchased quantity.
   - Generates a unique ticket record (`EVT-2026-XXXXXX`) and payment receipt (`TXN-2026-XXXXXXXX`).
5. **Digital QR Pass Issuance:** The attendee views their confirmed ticket and SVG QR entry pass in **My Tickets** (`GET /api/tickets/my`).
6. **Onsite Check-In Processing:** At the venue, the Onsite Coordinator opens check-in (`POST /api/onsite-coordinator/events/:id/status` with `CHECK_IN_OPEN`) and scans the attendee's ticket (`POST /api/onsite-coordinator/events/:id/check-in`).
7. **Duplicate Check-In Trapping:** If the ticket was already checked in, the backend rejects the attempt with `400 Bad Request` ("Attendee ALREADY checked in"). If valid, the ticket updates to `CHECKED_IN`, the timestamp is recorded, and the live attendance counter increments.

**Expected Outcome:** The event is executed with atomic ticket capacity management and zero duplicate check-in entries.

---

### Workflow 4: Event Completion, Feedback, and Analytics

**Primary Actors:** Onsite Coordinator (`karan.malhotra@wavevents.com`), Attendee (`suhaas@gmail.com`), Event Manager (`rahul.verma@wavevents.com`), Client (`siddu@gmail.com`)  
**Key Routes / Views:** `onsite-coordinator-space`, `event-details` (`feedback`), `analytics-space`, `my-space` (`dashboard`)

#### Objective
Transition the event to completed status, collect attendee ratings and survey responses, dynamically compute post-event performance scores, and export the official analytics report.

#### Step-by-Step Flow
1. **Closing Event Operations:** Following event execution, the Onsite Coordinator transitions the event status to `COMPLETED` (`POST /api/onsite-coordinator/events/:id/status`).
2. **Attendee Submits Feedback:** Checked-in attendees navigate to the event details page and submit a 1-5 star rating and comments (`POST /api/events/:id/feedback`).
3. **Duplicate Feedback Prevention:** The backend checks for an existing record matching `(eventId, userId)`. If found, it returns `409 Conflict` ("You have already submitted feedback for this event"). Valid submissions are saved.
4. **Dynamic Analytics Calculation:** The Analytics Engine computes real-time performance metrics (`GET /api/analytics/events/:id`):
   - **Attendance Rate:** `(Checked-In Attendees / Confirmed Registrations) * 100`
   - **Engagement Score:** Average of Q&A question participation, poll responses, and feedback submission rate.
   - **Satisfaction Rate:** `(Average Rating / 5.0) * 100`
   - **Overall Performance Score:** Weighted metric (`40% Attendance + 30% Engagement + 30% Satisfaction`).
5. **Generating Official Report:** The Event Manager or Administrator generates and publishes the official analytics report (`POST /api/analytics/events/:id/generate-report`).
6. **Client Access & PDF Export:** The client views real-time ticket sales and check-in counts (`GET /api/event-requests/:id/stats`), checks report availability (`GET /api/event-requests/:id/report-status`), and downloads the official PDF report (`GET /api/event-requests/:id/export-analytics`).

**Expected Outcome:** Complete post-event performance data is synthesized, audited, and made available to client and administrative stakeholders.

---

## 9. Verification & Automated Testing Commands

Use the following commands to verify the application build and run the automated backend test suites.

### 1. Build Verification

Run build commands from their respective application directories to verify TypeScript compilation and asset bundling:

#### Backend Production Build

```bash
cd backend
npm run build
```

*Executes `nest build` using `tsc`. Verifies TypeScript strict typing, module wiring, and controller decorators, outputting the compiled bundle to `dist-nestjs/`.*

#### Frontend Production Build

```bash
cd frontend
npm run build
```

*Executes `vite build`. Transforms React 19 JSX modules, validates Tailwind CSS directives, and bundles client assets into `dist/`.*

---

### 2. Standalone Verification Test Suites

The `backend/scripts/` directory contains automated verification test suites that validate end-to-end business rules against a running backend server.

**Prerequisite:** The backend server must be running on `http://localhost:5001`:

```bash
# In Terminal 1: Start backend server
cd backend
npm run dev
```

In a second terminal, execute the desired test suite using Node.js:

#### Authentication Security Suite

```bash
cd backend
node scripts/test-auth-suite.js
```

*Verifies valid user login (200), incorrect password rejection (401), unknown email rejection (401), empty password rejection (400), and staff account authentication.*

#### Event Manager Capacity & Workload Rules

```bash
cd backend
node scripts/test-capacity-suite.js
```

*Validates that an Event Manager cannot be assigned more than 7 active events (Rule B) and cannot exceed the 15-point operational workload threshold (Rule A).*

#### Client Event Statistics & Tracking

```bash
cd backend
node scripts/test-client-stats.js
```

*Verifies ticket sales totals, live attendee check-in counts, and client ownership authorization on `/api/event-requests/:id/stats`.*

#### PDF Analytics Report Export

```bash
cd backend
node scripts/test-completion-pdf-export.js
```

*Verifies event completion status checks and binary PDF analytics report generation and download.*

#### Attendee Duplicate Feedback Prevention

```bash
cd backend
node scripts/test-feedback-duplicate-prevention.js
```

*Verifies that an attendee can submit feedback once and that duplicate submissions are rejected with HTTP 409 Conflict.*

#### Dynamic User Management & Role Scoping

```bash
cd backend
node scripts/test-dynamic-user-management.js
```

*Verifies that IT Support Specialists can provision operational accounts but are blocked from creating Super Admins or Department Managers.*

#### Issue Escalation & IT Support Assignment

```bash
cd backend
node scripts/test-it-support-assignment.js
```

*Verifies operational issue creation, department manager triage, assignment to IT Support staff, and multi-tier escalation.*

#### Commercial Escalation & Staff Handoff

```bash
cd backend
node scripts/verify-full-escalation-and-assignment.js
```

*Verifies the complete flow from quotation acceptance to revenue escalation, Department Head queue appearance, and staff assignment.*

---

### Safe Development State Recovery

If local development data becomes inconsistent and you wish to return the store to its pristine seed state:

> **Important:** Removing `store-data.json` deletes any newly registered users, created events, or submitted tickets since the last seed. Use this only when a clean demonstration environment is required.

```powershell
# Windows PowerShell
Remove-Item "backend/data/store-data.json" -ErrorAction SilentlyContinue
Remove-Item "backend/data/store-data.json.tmp" -ErrorAction SilentlyContinue
cd backend
npm run dev
```

The backend will automatically re-seed 717 entities across all 31 collections on startup.
