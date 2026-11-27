# Wavevents — Event Execution & Post-Event Analytics Platform

**Team: 22_TrailBlazers**  
**Problem Statement:** Event Execution and Post-Event Analytics Platform

---

## Overview

In real-world event management, clients depend on event managers and on-site coordinators to execute events smoothly. However, visibility into attendee participation, session engagement, and operational issues is often fragmented or informal.

**Wavevents** is an enterprise-grade web platform designed to streamline the complete lifecycle of corporate and academic events — bridging the gap between planning, real-time ground execution, attendee interaction, and automated post-event analytical reporting.

---

## System Architecture

Wavevents follows a decoupled, modular architecture:

```
Wavevents/
├── frontend/               # React 18 + Vite + Redux Toolkit + Tailwind CSS
├── backend/                # NestJS + TypeScript RESTful API Service
├── docs/                   # System Requirements, ERD, Schema, and Audit Reports
├── legacy_frontend_archive/# Preserved legacy frontend components & history
└── package.json            # Monorepo runner scripts (concurrent execution)
```

- **Frontend:** Built with React 18, Vite 5, Tailwind CSS, and Redux Toolkit. Features role-based dashboards, modal-driven workflows, dynamic live updates, and strict separation between actor spaces.
- **Backend:** NestJS modular application with dependency injection, role-based authorization guards, JWT authentication, and structured error handling.
- **Data Persistence:** Authoritative JSON database stored at `backend/data/store-data.json`, housing structured collections across events, users, tickets, payments, feedback, issues, and audit records.

---

## Identified Actors & Key Capabilities

### 1. Client
- Submit and track custom event requests and quotations.
- Collaborate with assigned Event Managers on event specifications and milestones.
- View live event progress and access comprehensive post-event analytics reports.
- Review consolidated attendee feedback and financial summaries.

### 2. Admin
- Platform-wide governance and user management.
- Review incoming event requests and assign dedicated Event Managers.
- Manage IT support issues and system-wide configuration.

### 3. Event Manager
- End-to-end planning, resource allocation, and milestone tracking.
- Structure interactive attendee engagement (polls, Q&A sessions).
- Monitor real-time event execution, check-in counts, and RSVP vs. actual attendance.
- Review on-site operational issues escalated by coordinators.
- Generate and deliver post-event performance and analytics reports to clients.

### 4. On-site Event Coordinator
- Validate attendee tickets and perform QR/manual check-ins.
- Monitor room capacity, entrance/exit crowd flow, and session transitions.
- Log operational, technical, or venue issues in real time and escalate to Event Managers.

### 5. Attendee
- Browse published events and reserve tickets.
- Access digital tickets and check-in confirmation.
- Participate in live session polls and interactive Q&A.
- Submit structured feedback and ratings post-event.

### 6. Revenue Manager & Department Head
- Manage quotation approval pipelines and payment tracking.
- Enforce cancellation policies, capacity restrictions, and refund approval workflows.

---

## Project Documentation Index

All formal project specifications and academic evaluation documents are located under [`docs/`](file:///d:/Event%20Management%20Project/Wavevents/docs):

- **Requirements & Specifications:**
  - [SRS.pdf](file:///d:/Event%20Management%20Project/Wavevents/docs/requirements/SRS.pdf) — Software Requirements Specification
  - [Definitions.yml](file:///d:/Event%20Management%20Project/Wavevents/docs/requirements/Definitions.yml) — API and domain entity definitions
  - [DomainExpertInteraction.md](file:///d:/Event%20Management%20Project/Wavevents/docs/requirements/DomainExpertInteraction.md) — Domain expert interview notes
- **Database & Architecture:**
  - [ER_Diagram.png](file:///d:/Event%20Management%20Project/Wavevents/docs/database/ER_Diagram.png) — Entity-Relationship Diagram
  - [Dbschema.sql](file:///d:/Event%20Management%20Project/Wavevents/docs/database/Dbschema.sql) — Relational database schema
  - [Normalization.pdf](file:///d:/Event%20Management%20Project/Wavevents/docs/database/Normalization.pdf) — Database normalization report
  - [BACKEND_ARCHITECTURE.md](file:///d:/Event%20Management%20Project/Wavevents/docs/architecture/BACKEND_ARCHITECTURE.md) — NestJS service architecture
  - [MIDDLEWARE_AND_REQUEST_PROCESSING.md](file:///d:/Event%20Management%20Project/Wavevents/docs/architecture/MIDDLEWARE_AND_REQUEST_PROCESSING.md) — Request pipeline documentation
- **Design & Media:**
  - [Figma_prototype_pages.md](file:///d:/Event%20Management%20Project/Wavevents/docs/design/Figma_prototype_pages.md) — UI prototype design sheets
  - [Team_video.md](file:///d:/Event%20Management%20Project/Wavevents/docs/videos/Team_video.md) — Project demonstration video link
- **Audit & Migration Reports:**
  - [`docs/audit_reports/`](file:///d:/Event%20Management%20Project/Wavevents/docs/audit_reports) — Functional audit, cancellation rules verification, and Redux migration reports.
- **Evaluation Test Accounts:**
  - [TEST_ACCOUNTS.md](file:///d:/Event%20Management%20Project/Wavevents/docs/TEST_ACCOUNTS.md) — Role-based test account guidance for evaluators.

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Installation
From the root directory, install dependencies for all packages:
```bash
# Install root orchestration packages
npm install

# Install frontend dependencies
npm --prefix frontend install

# Install backend dependencies
npm --prefix backend install
```

### Running the Application

#### Option 1: Run Frontend & Backend Simultaneously (Root)
```bash
npm run dev
```
- Frontend client will be accessible at: `http://localhost:5173`
- Backend API server will be accessible at: `http://localhost:5001`

#### Option 2: Run Services Independently
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

### Production Build & Validation
```bash
# Build Frontend
npm run build:frontend

# Build Backend
npm --prefix backend run build
```
