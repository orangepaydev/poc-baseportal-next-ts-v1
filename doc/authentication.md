# Authentication Flow

## Purpose

This document describes the current login and session model for the workspace.

## Login Requirements

- Login is tenant-aware.
- The form requires:
  - organisation
  - user
  - password
- The application authenticates against the live approved tables:
  - `organizations`
  - `users`

## Verification Rules

- Resolve the organization by `organization_code`.
- Resolve the user within that organization by `username`.
- Only `ACTIVE` organizations and `ACTIVE` users are eligible to log in.
- Passwords are verified against `users.password_sha256` using SHA-256.

## Session Cookie

- A successful login issues one signed HTTP-only cookie.
- The cookie contains a serialized session payload with:
  - `sessionId`
  - `organizationId`
  - `organizationCode`
  - `userId`
  - `username`
  - `displayName`
  - `passwordResetRequired`
  - `issuedAt`
- The session payload is signed with an HMAC so the app can reject tampered cookies.
- The cookie is intended to be the base for later authorization work.

## Forced Password Change

- Approved user-create and approved password-reset flows set `users.password_reset_required = 1`.
- A successful login still creates a session, but sessions with `passwordResetRequired = true` are redirected to `/change-password` instead of the workspace.
- Normal protected routes reject sessions with `passwordResetRequired = true` and send the user to the password-change screen.
- The password-change form updates `users.password_sha256`, clears `users.password_reset_required`, writes an audit event, clears the session cookie, and returns the user to `/login`.

## Authorization Helper

- `src/lib/auth/authorization.ts` loads the authenticated session together with the effective permission set for the current user.
- Effective permissions are resolved through:
  - `user_group_memberships`
  - `user_group_permissions`
  - `permissions`
- The helper also derives the menu items visible to the current user from the permission catalog.
- Sidebar and landing-page navigation are filtered from that same permission context.
- Route handlers for workspace menu pages enforce the same access rules so hidden links cannot still be opened directly.
- Any new protected page must perform its permission check before loading page data.
- Prefer `requireNavigationItemAccess()` for menu-driven pages so the menu permission and any required resource permissions are enforced before queries run.

## Login Audit Trail

- Every credential attempt writes an `audit_events` row.
- Successful attempts use `AUTH_LOGIN_SUCCEEDED`.
- Failed attempts use `AUTH_LOGIN_FAILED`.
- Audit payloads include:
  - organization code
  - username
  - login outcome
  - failure reason when available
  - session ID for successful logins
- Successful login also updates `users.last_login_at`.

## Routing Model

- `src/app/(auth)/login/page.tsx` renders the login screen outside the workspace shell.
- `src/app/(auth)/change-password/page.tsx` renders the forced password-change screen for flagged sessions.
- `src/app/(workspace)/layout.tsx` requires a valid session before rendering the shell.
- `src/app/(workspace)/page.tsx` is the protected landing page.
- `src/app/(workspace)/[group]/[item]/page.tsx` contains the protected menu placeholder pages.

## UI Notes

- The login page uses the same rounded-card, cyan-accent visual language as the default workspace landing page.
- The workspace shell receives the authenticated session so the header can show the active organization and user.
- The shell also exposes a sign-out action that clears the session cookie.
- Invalid login errors stay generic in the UI; detailed failure reasons are recorded only in the audit trail.
