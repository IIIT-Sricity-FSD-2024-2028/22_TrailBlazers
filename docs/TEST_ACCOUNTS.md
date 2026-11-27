# Wavevents — Evaluation & Role-Based Testing Accounts

This document outlines the standard test personas pre-configured in the Wavevents platform database (`backend/data/store-data.json`) for academic evaluation and quality assurance testing.

---

## Pre-Configured Test Personas

| Role Name | Platform Responsibility | Primary Workspaces & Features | Standard Evaluation Identifier |
| :--- | :--- | :--- | :--- |
| **Client** | Event Requester & Sponsor | Custom event request, quotation review, milestone approval, live progress tracking, post-event analytics & feedback review. | `arjunkumar@gmail.com` |
| **Attendee** | Event Participant | Event discovery, registration, ticket reservation, QR check-in display, live session polls, post-event feedback submission. | `abhishek@gmail.com` |
| **Event Manager** | End-to-End Event Planner | Event creation, agenda & session configuration, engagement tools (polls/Q&A), coordinator oversight, analytics report generation. | `vikram@wavevents.com` |
| **On-Site Coordinator** | Ground Execution Lead | Entrance QR code scanner, manual attendee check-in, room capacity monitoring, operational incident logging & manager escalation. | `rohit@wavevents.com` |
| **Revenue Manager** | Financial & Quotation Controller | Quotation rate review, discount authorization, payment confirmation, refund validation. | `priya.nair@wavevents.com` |
| **Department Head** | Executive Governance Lead | High-level event oversight, cross-manager resource balancing, executive approval escalations. | `devika.sharma@wavevents.com` |

---

## Authentication Guidance for Evaluators

1. **Local Test Environment Passwords:**
   - In accordance with academic project security policies, individual plaintext passwords are not published in public documentation.
   - For evaluator access in local testing, pre-seeded accounts utilize the standard project evaluation password configured during database initialization. Refer to the internal test environment setup guide or use the self-registration flow on the landing page to create new evaluation accounts with arbitrary passwords.

2. **Quick Role Switching:**
   - When running the frontend in local development (`npm run dev`), the landing page navbar provides a login modal with role indicators to facilitate evaluation across multiple personas.

3. **Database Integrity:**
   - All user records are persistently mapped to their corresponding role permissions and UUIDs within `backend/data/store-data.json`.
