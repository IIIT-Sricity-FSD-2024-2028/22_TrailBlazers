# Wavevents — Five-Member Direct-Main-Branch Git Workflow Guide

> **Important**: This workflow enforces genuine, sequential collaboration on the single `main` branch. Every team member works on their own machine, configures their own Git identity, authenticates with their own GitHub account, and pushes directly to `origin/main` in order.

---

## 1. Team Roster & Module Ownership Matrix

| Member | GitHub Username | Git Email | Core Architecture Ownership | Application Feature Ownership |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1** | `Sujith2026` | `rudrau2026@gmail.com` | **Logging & Log Management**<br>• RequestLoggingMiddleware<br>• LoggingInterceptor<br>• LoggerService<br>• AccessLoggerService<br>• ErrorLoggerService<br>• LogRotationService<br>• LoggingModule | **Analytics & Reporting**<br>• Analytics Service & Controller<br>• Post-Event Analytics Engine<br>• Analytics Frontend Dashboard & Reports |
| **Member 2** | `vikasr1503` | `codebreaker285@gmail.com` | **Middleware**<br>• MaintenanceModeMiddleware<br>• RequestContextMiddleware | **Event Management**<br>• Event Creation & Editing<br>• Event Requests & Exploration<br>• Event Details & Sessions |
| **Member 3** | `sidduvanam07` | `sidduvanam07@gmail.com` | **API Version & Security**<br>• ApiVersionMiddleware<br>• Helmet Security Headers<br>• CORS Configuration<br>• ThrottlerGuard & ThrottlerModule | **Finance & Revenue**<br>• Revenue Engine<br>• Quotations System<br>• Payment & Billing Functionality |
| **Member 4** | `vipulchetan25` | `vipulchetan.m24@iiits.in` | **Authentication & RBAC**<br>• JwtAuthGuard<br>• JwtStrategy<br>• RolesGuard<br>• HeaderRoleGuard<br>• @Roles() Decorator | **User & Role Management**<br>• Authentication (Login/Register/Verify)<br>• Users & Profiles<br>• Event Manager Workspace<br>• Frontend Role-Based Routing |
| **Member 5** | `nandan075` | `sainandanreddy551@gmail.com` | **Error Handling & Uploads**<br>• GlobalExceptionFilter<br>• FileInterceptor<br>• UploadsController & UploadsService<br>• ValidationPipe | **Operations & Engagement**<br>• Tickets & Check-In<br>• Onsite Coordinator Portal<br>• Live Polls & Q&A<br>• Post-Event Feedback<br>• Notifications System |

---

## 2. Core Git Architecture & Principles

```
  Member 1 (Sujith2026)      ───> feat(logging): ... / feat(analytics): ...  ───> [main]
                                                                                     │
  Member 2 (vikasr1503)      ───> feat(middleware): ... / feat(events): ...  ───> [main]
                                                                                     │
  Member 3 (sidduvanam07)    ───> feat(security): ... / feat(revenue): ...   ───> [main]
                                                                                     │
  Member 4 (vipulchetan25)   ───> feat(auth): ... / feat(users): ...         ───> [main]
                                                                                     │
  Member 5 (nandan075)       ───> feat(upload): ... / feat(tickets): ...     ───> [main]
```

1. **Single Branch (`main`)**: All work is committed and pushed directly to `main`. No long-lived feature branches.
2. **Strict Sequential Execution**: `Member 1` ➔ `Member 2` ➔ `Member 3` ➔ `Member 4` ➔ `Member 5`.
3. **No Overwrites / No Force Pushing**: Never use `git push --force` or `git reset`.
4. **Independent Machines & Accounts**: Each member executes on their own workstation with their own GitHub credentials.

---

## 3. Step-by-Step Member Execution Protocols

### Member 1: Logging & Analytics
1. **Configure Identity**:
   ```bash
   git config user.name "Sujith2026"
   git config user.email "rudrau2026@gmail.com"
   ```
2. **Ensure Clean Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
3. **Implement Assigned Features**:
   - Logging components (`RequestLoggingMiddleware`, `LoggingInterceptor`, `LoggerService`, `AccessLoggerService`, `ErrorLoggerService`, `LogRotationService`).
   - Analytics components (`AnalyticsService`, `AnalyticsController`, frontend Analytics space).
4. **Verify & Commit**:
   ```bash
   git status
   git diff
   npm run build  # Backend & Frontend verification
   git add <relevant-files>
   git commit -m "feat(logging): implement structured logging and log rotation"
   git commit -m "feat(analytics): enhance post-event analytics calculations and dashboard"
   ```
5. **Push to Main**:
   ```bash
   git pull --rebase origin main
   git push origin main
   ```
6. **Notify Team**: Notify Member 2 to begin.

---

### Member 2: Middleware & Events
1. **Wait for Member 1 to finish and push.**
2. **Configure Identity**:
   ```bash
   git config user.name "vikasr1503"
   git config user.email "codebreaker285@gmail.com"
   ```
3. **Sync Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
4. **Implement Assigned Features**:
   - Middleware (`MaintenanceModeMiddleware`, `RequestContextMiddleware`).
   - Event features (Creation, Exploration, Details, Requests).
5. **Verify & Commit**:
   ```bash
   git status
   git diff
   npm run build
   git add <relevant-files>
   git commit -m "feat(middleware): add request context and maintenance mode middleware"
   git commit -m "feat(events): refine event exploration and request management"
   ```
6. **Push to Main**:
   ```bash
   git pull --rebase origin main
   git push origin main
   ```
7. **Notify Team**: Notify Member 3 to begin.

---

### Member 3: Security & Revenue
1. **Wait for Member 2 to finish and push.**
2. **Configure Identity**:
   ```bash
   git config user.name "sidduvanam07"
   git config user.email "sidduvanam07@gmail.com"
   ```
3. **Sync Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
4. **Implement Assigned Features**:
   - Security (`ApiVersionMiddleware`, Helmet, CORS, ThrottlerGuard, Rate Limiting).
   - Revenue & Payment features (Revenue tracking, Quotation generation, Payment flows).
5. **Verify & Commit**:
   ```bash
   git status
   git diff
   npm run build
   git add <relevant-files>
   git commit -m "feat(security): configure helmet, cors, api versioning, and rate limiting"
   git commit -m "feat(revenue): implement quotations and revenue calculation workflows"
   ```
6. **Push to Main**:
   ```bash
   git pull --rebase origin main
   git push origin main
   ```
7. **Notify Team**: Notify Member 4 to begin.

---

### Member 4: Authentication & RBAC
1. **Wait for Member 3 to finish and push.**
2. **Configure Identity**:
   ```bash
   git config user.name "vipulchetan25"
   git config user.email "vipulchetan.m24@iiits.in"
   ```
3. **Sync Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
4. **Implement Assigned Features**:
   - Auth & RBAC (`JwtAuthGuard`, `JwtStrategy`, `RolesGuard`, `HeaderRoleGuard`, `@Roles()` decorator).
   - User workspace (Registration, Login, Verification, Event Manager workspace, Role-based client routes).
5. **Verify & Commit**:
   ```bash
   git status
   git diff
   npm run build
   git add <relevant-files>
   git commit -m "feat(auth): implement JWT strategy and RBAC guards"
   git commit -m "feat(users): add role-based navigation and event manager dashboard"
   ```
6. **Push to Main**:
   ```bash
   git pull --rebase origin main
   git push origin main
   ```
7. **Notify Team**: Notify Member 5 to begin.

---

### Member 5: Error Handling & File Uploads / Operations
1. **Wait for Member 4 to finish and push.**
2. **Configure Identity**:
   ```bash
   git config user.name "nandan075"
   git config user.email "sainandanreddy551@gmail.com"
   ```
3. **Sync Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
4. **Implement Assigned Features**:
   - Error handling & Uploads (`GlobalExceptionFilter`, `FileInterceptor`, `UploadsController`, `UploadsService`, `ValidationPipe`).
   - Engagement & Operations (Tickets, Onsite Coordinator space, Polls, Q&A, Feedback, Notifications).
5. **Verify & Commit**:
   ```bash
   git status
   git diff
   npm run build
   git add <relevant-files>
   git commit -m "feat(upload): configure multipart file upload and global exception filter"
   git commit -m "feat(operations): implement onsite coordinator portal, polls, and feedback"
   ```
6. **Push to Main**:
   ```bash
   git pull --rebase origin main
   git push origin main
   ```

---

## 4. Conflict Prevention & Shared Files Protocol

The following shared files must be modified with extreme care:
- `backend/src-nestjs/main.ts`
- `backend/src-nestjs/app.module.ts`
- `package.json` / `backend/package.json` / `frontend/package.json`
- `frontend/src/App.jsx`
- Frontend routing configurations

### Golden Rules for Shared Files:
1. Always `git pull origin main` before touching any shared file.
2. Only make pinpoint additions for your module (e.g. register your own guard/middleware/module in `app.module.ts`).
3. Never delete, reorder, or replace imports/declarations created by preceding members.
4. If a conflict occurs during rebase:
   ```bash
   git status
   # Inspect conflicted files and retain BOTH your changes and previous members' changes
   git add <resolved-file>
   git rebase --continue
   ```

---

## 5. Pre-Push & Safety Checklist

- [ ] `.env` files are NOT staged (`git status` does not show `.env`).
- [ ] `node_modules` or build artifacts (`dist`, `dist-nestjs`) are NOT staged.
- [ ] Log files (`*.log`) and temporary uploads are ignored.
- [ ] Backend builds cleanly (`cd backend && npm run build`).
- [ ] Frontend builds cleanly (`cd frontend && npm run build`).
- [ ] `git pull --rebase origin main` returns "Current branch main is up to date".

---

## 6. Final Team Verification Commands

Run these commands on the final repository:

```bash
# 1. Check all commits across all contributors
git log --format="%h | %an <%ae> | %s"

# 2. Verify only 5 distinct authors exist
git log --format="%an <%ae>" | sort -u

# 3. Check for accidental secret or node_modules tracking
git ls-files | findstr ".env"
git ls-files | findstr "node_modules"

# 4. Verify clean working directory
git status
```
