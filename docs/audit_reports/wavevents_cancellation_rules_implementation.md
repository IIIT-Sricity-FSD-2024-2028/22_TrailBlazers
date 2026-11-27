# Wavevents Cancellation & Refund Business Rules Implementation Report

**Author:** Vipul Chetan  
**Platform:** Wavevents Event Management & Post-Event Analytics Platform  
**Architecture:** React 19 + Redux (Standard Thunks) + NestJS + JSON File-Backed Storage  
**Date:** November 13, 2026  
**Status:** **FULLY IMPLEMENTED, LIVE VERIFIED (18/18 TESTS PASSED), & PRODUCTION BUILDS CERTIFIED**

---

## 1. Executive Summary

This report documents the end-to-end design, implementation, and rigorous verification of **two mission-critical business rules** governing cancellations and refund claims within the Wavevents platform:

1. **Rule 1 (Attendee Tickets):** Attendees are strictly prohibited from cancelling tickets or claiming refunds after their ticket has been checked in, QR code validated, or utilized for event entry.
2. **Rule 2 (Client Events):** Commercial clients are strictly prohibited from cancelling events that have already started, are ongoing/live, or have concluded.

Both rules are enforced with **authoritative server-side validation** in the NestJS backend returning standardized **HTTP 409 Conflict** error responses with exact, informative error messages, accompanied by **intuitive, real-time frontend UI feedback** that proactively disables action controls and presents clear contextual status badges to users.

---

## 2. Business Rules Specification

### Rule 1: Attendees Cannot Cancel Tickets After Check-In

| Dimension | Specification |
| :--- | :--- |
| **Business Constraint** | Once an attendee ticket has been scanned by an onsite coordinator, marked as checked in, entered into the venue, or has entry audit logs, ticket cancellation and refund processing are permanently blocked. |
| **Backend Authority** | `POST /api/refunds/request` (with `ticketId`). Checks: `ticket.checkedIn === 1`, `ticket.checkedIn === true`, `ticket.checkedInAt`, `ticket.entryStatus IN ['FULLY_CHECKED_IN', 'PARTIALLY_CHECKED_IN', 'ENTERED']`, any `ticket_members` with `firstEnteredAt` or `entryStatus !== 'NOT_ENTERED'`, or `ticket_entry_logs` with `action === 'ENTRY'`. |
| **HTTP Status Code** | **`409 Conflict`** |
| **Exact Error Message** | `"This ticket cannot be cancelled because it has already been used for event entry."` |
| **Already Cancelled Check** | Rejection with **`409 Conflict`**: `"This ticket has already been cancelled."` |
| **Frontend UI Enforcement** | In [MyTickets.jsx](file:///d:/Event%20Management%20Project/Wavevents/frontend/src/actors/attendee/pages/MyTickets.jsx) and [TicketModal.jsx](file:///d:/Event%20Management%20Project/Wavevents/frontend/src/actors/attendee/components/TicketModal.jsx), the "Cancel Ticket" button is hidden/disabled for checked-in passes and replaced with the badge: **`Checked In – Cancellation Unavailable`**. |

### Rule 2: Clients Cannot Cancel Ongoing or Completed Events

| Dimension | Specification |
| :--- | :--- |
| **Business Constraint** | A client may cancel an eligible upcoming event prior to its scheduled start time according to the contractual refund tier policy. Once the event start time has passed, or the event is in an `ONGOING`, `LIVE`, `IN_PROGRESS`, or `COMPLETED` state, cancellation is permanently blocked. |
| **Backend Authority** | Centralized in `POST /api/refunds/cancel-event/:eventId`, `POST /api/refunds/request` (with `eventId`/`quotationId`), and `GET /api/refunds/cancellation-preview/:eventId`. Checks: operational status, event status, and start date/time range. |
| **HTTP Status Code** | **`409 Conflict`** |
| **Exact Error Message** | `"This event cannot be cancelled because it has already started or has been completed."` |
| **Authorization Check** | Rejection of non-owner clients with **`403 Forbidden`**: `"You do not have permission to initiate cancellation for this event."` |
| **Already Cancelled Check** | Rejection with **`409 Conflict`**: `"This event has already been cancelled."` |
| **Frontend UI Enforcement** | In [Dashboard.jsx](file:///d:/Event%20Management%20Project/Wavevents/frontend/src/actors/client/pages/Dashboard.jsx) and [CancelEventModal.jsx](file:///d:/Event%20Management%20Project/Wavevents/frontend/src/actors/event-manager/components/CancelEventModal.jsx), the "Cancel Event" button is replaced with status indicator **`Ongoing – Cancellation Unavailable`** or **`Completed – Cancellation Unavailable`**. The modal preview displays a prominent alert and permanently disables form submission. |

---

## 3. Modified Files & Source Code References

### 3.1 Backend Files

#### 1. `backend/src-nestjs/modules/refunds/refunds.service.ts`
- **Imports:** Added `ConflictException` from `@nestjs/common`.
- **`requestRefund` (Attendee Ticket Verification):**
  - Added duplicate cancellation check throwing `ConflictException('This ticket has already been cancelled.')`.
  - Added comprehensive check-in validation inspecting `ticket.checkedIn`, `ticket.checkedInAt`, `ticket.entryStatus`, `ticket_members.firstEnteredAt`, `ticket_members.entryStatus`, and `ticket_entry_logs` with `action === 'ENTRY'`. Throws `ConflictException('This ticket cannot be cancelled because it has already been used for event entry.')`.
- **`requestRefund` (Client Quotation/Event Verification):**
  - Added event status check inspecting if `status` or `operationalStatus` is `CANCELLED`. Throws `ConflictException('This event has already been cancelled.')`.
  - Added lifecycle and time checks inspecting if event is `COMPLETED`, `ONGOING`, `IN_PROGRESS`, `LIVE`, or if `eventDateTime.getTime() <= Date.now()`. Throws `ConflictException('This event cannot be cancelled because it has already started or has been completed.')`.
- **`getCancellationPreview` (Client Event Cancellation Preview):**
  - Added early checks for cancelled, ongoing, or completed events. Sets `isPermitted: false` and `restrictionReason: 'This event cannot be cancelled because it has already started or has been completed.'`.
- **`cancelEvent` (Client Event Cancellation Endpoint):**
  - Verified role authorization: non-owners throw `ForbiddenException('You do not have permission to initiate cancellation for this event.')` (`403 Forbidden`).
  - Added check if event is already cancelled, throwing `ConflictException('This event has already been cancelled.')` (`409 Conflict`).
  - For clients (`user.role === 'CLIENT' || isOwnerClient`), checked if event is `COMPLETED`, `ONGOING`, `IN_PROGRESS`, `LIVE`, or `eventDateTime <= Date.now()`, throwing `ConflictException('This event cannot be cancelled because it has already started or has been completed.')` (`409 Conflict`).

#### 2. `backend/src-nestjs/utils/date-time.util.ts`
- **`computeClientCancellationTier`:**
  - Standardized the past/started restriction reason string to:  
    `"This event cannot be cancelled because it has already started or has been completed."`

---

### 3.2 Frontend Files

#### 1. `frontend/src/actors/attendee/pages/MyTickets.jsx`
- Added `isTicketCheckedIn(tkt)` helper to verify `checkedIn === 1`, `checkedIn === true`, `checkedInAt`, or `entryStatus IN ['FULLY_CHECKED_IN', 'PARTIALLY_CHECKED_IN', 'ENTERED']`.
- Updated action ribbon: for checked-in upcoming tickets, replaced "Cancel Ticket" button with:
  ```jsx
  <span
    className="py-2 px-2.5 rounded-xl bg-amber-50 text-amber-800 font-extrabold text-[11px] border border-amber-300 flex items-center gap-1 shadow-2xs"
    title="This ticket has already been used for event entry and cannot be cancelled."
  >
    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    <span>Checked In – Cancellation Unavailable</span>
  </span>
  ```
- Guarded modal opener: `onCancelTicket` is disabled if `isTicketCheckedIn(selectedTicket)`.

#### 2. `frontend/src/actors/attendee/components/TicketModal.jsx`
- Added check-in detection logic `isCheckedIn`.
- In modal action footer: if `isCheckedIn` is true, displays `Checked In – Cancellation Unavailable` status badge and prevents cancellation modal invocation.

#### 3. `frontend/src/actors/client/pages/Dashboard.jsx`
- Added `isEventStartedOrCompleted(evt)` helper checking event status, operational status (`COMPLETED`, `ONGOING`, `IN_PROGRESS`, `LIVE`), and parsing event start date and time against system time.
- In Commercial Proposals & Quotations table: for events that are ongoing or completed, replaces "Cancel Event" button with:
  ```jsx
  <span
    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 font-extrabold text-xs shadow-2xs flex items-center gap-1.5"
    title="This event cannot be cancelled because it has already started or has been completed."
  >
    <Clock className="w-3.5 h-3.5 text-slate-400" />
    <span>{req.operationalStatus === 'COMPLETED' || req.status === 'COMPLETED' ? 'Completed – Cancellation Unavailable' : 'Ongoing – Cancellation Unavailable'}</span>
  </span>
  ```

#### 4. `frontend/src/actors/event-manager/components/CancelEventModal.jsx`
- Synchronized default restriction warning banner to: `"This event cannot be cancelled because it has already started or has been completed."`
- Disables input textarea and submit button when `isNotPermitted` is true.
- Catches server `409 Conflict` errors and displays exact backend message in error alert.

---

## 4. Live Verification & Edge Case Test Results

An automated end-to-end integration test suite was executed against the active NestJS backend (`http://localhost:5001/api`). All **18 edge cases** passed with 100% success.

### Test Execution Summary

```
================================================================
   WAVEVENTS CANCELLATION BUSINESS RULES LIVE VERIFICATION
================================================================

TOTAL TESTS: 18 | PASSED: 18 | FAILED: 0
```

### Detailed Test Matrix

| Test ID | Category | Scenario Description | HTTP Method & Endpoint | Payload / Parameters | Expected Status | Actual Status | Server Response / Message | Result |
| :---: | :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **A1** | Attendee | Eligible upcoming ticket (not checked in) | `POST /api/refunds/request` | `{ ticketId: "test_tkt_eligible" }` | `201` | `201` | `Refund request registered successfully.` | **PASS** |
| **A2** | Attendee | Ticket marked checked-in (`checkedIn: 1`) | `POST /api/refunds/request` | `{ ticketId: "test_tkt_checkedin" }` | `409` | `409` | `"This ticket cannot be cancelled because it has already been used for event entry."` | **PASS** |
| **A3** | Attendee | Ticket QR scanned (`entryStatus: FULLY_CHECKED_IN`) | `POST /api/refunds/request` | `{ ticketId: "test_tkt_qr_scanned" }` | `409` | `409` | `"This ticket cannot be cancelled because it has already been used for event entry."` | **PASS** |
| **A4** | Attendee | Ticket with entered member in `ticket_members` | `POST /api/refunds/request` | `{ ticketId: "test_tkt_member_entered" }` | `409` | `409` | `"This ticket cannot be cancelled because it has already been used for event entry."` | **PASS** |
| **A5** | Attendee | Ticket with entry log in `ticket_entry_logs` | `POST /api/refunds/request` | `{ ticketId: "test_tkt_entry_logged" }` | `409` | `409` | `"This ticket cannot be cancelled because it has already been used for event entry."` | **PASS** |
| **A6** | Attendee | Already cancelled ticket | `POST /api/refunds/request` | `{ ticketId: "test_tkt_already_cancelled" }` | `409` | `409` | `"This ticket has already been cancelled."` | **PASS** |
| **A7** | Attendee | Direct API call on checked-in ticket (bypass UI) | `POST /api/refunds/request` | `{ ticketId: "test_tkt_checkedin" }` | `409` | `409` | `"This ticket cannot be cancelled because it has already been used for event entry."` | **PASS** |
| **A8** | Attendee | Non-existent ticket ID | `POST /api/refunds/request` | `{ ticketId: "tkt_non_existent_9999" }` | `404` | `404` | `"Ticket not found."` | **PASS** |
| **A9** | Attendee | Attempt to cancel another attendee's ticket | `POST /api/refunds/request` | `{ ticketId: "test_tkt_checkedin" }` (by other user) | `403` | `403` | `"You can only request refunds for your own tickets."` | **PASS** |
| **C1** | Client | Eligible upcoming event cancellation by owner | `POST /api/refunds/cancel-event/:id` | `{ cancellationReason: "..." }` | `200` | `200` | `Event '...' successfully cancelled.` | **PASS** |
| **C2** | Client | Client cancellation on ongoing/live event | `POST /api/refunds/cancel-event/:id` | `{ cancellationReason: "..." }` | `409` | `409` | `"This event cannot be cancelled because it has already started or has been completed."` | **PASS** |
| **C3** | Client | Client cancellation on completed event | `POST /api/refunds/cancel-event/:id` | `{ cancellationReason: "..." }` | `409` | `409` | `"This event cannot be cancelled because it has already started or has been completed."` | **PASS** |
| **C4** | Client | Event start time has passed (past date/time) | `POST /api/refunds/cancel-event/:id` | `{ cancellationReason: "..." }` | `409` | `409` | `"This event cannot be cancelled because it has already started or has been completed."` | **PASS** |
| **C5** | Client | Cancellation preview on ongoing/completed event | `GET /api/refunds/cancellation-preview/:id` | `N/A` | `200` | `200` | `isPermitted: false`, `"This event cannot be cancelled because it has already started or has been completed."` | **PASS** |
| **C6** | Client | Non-owner client attempts cancellation | `POST /api/refunds/cancel-event/:id` | `{ cancellationReason: "..." }` (by non-owner) | `403` | `403` | `"You do not have permission to initiate cancellation for this event."` | **PASS** |
| **C7** | Client | Attempt to cancel already cancelled event | `POST /api/refunds/cancel-event/:id` | `{ cancellationReason: "..." }` | `409` | `409` | `"This event has already been cancelled."` | **PASS** |
| **C8** | Client | Non-existent event ID | `POST /api/refunds/cancel-event/:id` | `eventId: "evt_non_existent_9999"` | `404` | `404` | `"Event 'evt_non_existent_9999' not found."` | **PASS** |
| **C9** | Client | Direct client refund request on ongoing event | `POST /api/refunds/request` | `{ eventId: "test_evt_client_ongoing" }` | `409` | `409` | `"This event cannot be cancelled because it has already started or has been completed."` | **PASS** |

---

## 5. Architectural Compliance & React Hook Audit

A strict static AST audit across the entire codebase confirmed absolute adherence to project development constraints:

1. **Permitted React Hooks:** Only `useState`, `useEffect`, and `useContext` are used in UI components.
2. **Permitted Redux Hooks:** Only `useSelector` and `useDispatch` are used for Redux state interactions.
3. **Forbidden React Hooks:** Exactly **ZERO (0)** occurrences of:
   - `useMemo` (0)
   - `useCallback` (0)
   - `useRef` (0)
   - `useReducer` (0)
   - `useLayoutEffect` (0)
   - `useUI` or custom hook wrappers (0)
4. **Redux Architecture:** Exactly **ZERO (0)** occurrences of `createAsyncThunk`. All asynchronous operations utilize standard Redux Thunk action creators.
5. **Storage Architecture:** Preserved file-backed JSON store (`backend/data/store-data.json`). No external databases, ORMs, or Docker dependencies introduced.

---

## 6. Build Verification

Both frontend and backend applications were compiled and validated in production mode:

### Backend Build (NestJS)
```bash
> wavevents-backend@1.0.0 build
> nest build && node -e "require('fs').writeFileSync('dist-nestjs/package.json', JSON.stringify({type: 'commonjs'}))"
Exit code: 0 (Success)
```

### Frontend Build (Vite + React)
```bash
> wavevents-frontend@1.0.0 build
> vite build
✓ 1676 modules transformed.
dist/index.html                     1.22 kB │ gzip:   0.66 kB
dist/assets/index-CTETG6E9.css    123.87 kB │ gzip:  17.62 kB
dist/assets/index-C_A9BvYL.js   1,058.66 kB │ gzip: 231.71 kB
✓ built in 7.57s
Exit code: 0 (Success)
```

---

## 7. Conclusion

Both business rules are fully implemented and verified:
- **Attendee tickets** can no longer be cancelled once checked in, entered, or scanned (HTTP 409 Conflict with exact error message).
- **Client events** can no longer be cancelled once started, ongoing, or completed (HTTP 409 Conflict with exact error message).
- **Data integrity** is preserved in `store-data.json`.
- **UI feedback** is intuitive, responsive, and adheres strictly to all hook constraints.
