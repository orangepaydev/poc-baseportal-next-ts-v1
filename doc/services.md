# Services

## Purpose

This document is the implementation reference for shared external or infrastructure-facing services used by the application.

Use it to document:

- what the service does
- where its code lives
- which environment variables configure it
- how application code should call it
- local-development expectations
- constraints and extension points for future services

Future service integrations such as LDAP, PKI, crypto, message queues, or third-party APIs should add a new section to this file.

## Service Documentation Template

When adding a new service, document these items:

### Summary

- service purpose
- whether it is server-only, client-safe, or mixed
- expected callers

### Source Locations

- main implementation file
- related helpers or adapters
- any route handlers, actions, or UI entry points that depend on it

### Configuration

- required environment variables
- optional environment variables
- secure defaults and local-development defaults

### Usage Pattern

- the main exported functions or classes
- typical invocation flow
- error handling expectations
- whether the service should be wrapped by another domain-specific module

### Local Development

- Docker or local dependencies
- service host and port expectations
- how to validate that the service is working

### Future Extension Notes

- likely next features
- compatibility expectations
- any architecture rules future agents should preserve

## Email Service

### Summary

- The email service is a server-only SMTP helper.
- The implementation lives in `src/lib/email.ts`.
- It is intended to be called from server actions, route handlers, server components, or other server-only modules.
- It should not be imported into client components.

### Current Responsibilities

- load SMTP settings from environment variables
- support open SMTP servers with no username or password
- optionally support authenticated SMTP
- optionally support TLS certificate validation control
- send plain text email, HTML email, or both
- provide a default `from` identity from environment configuration

### Source Location

- `src/lib/email.ts`
- `src/lib/organization-admin-account-email.ts`

### Configuration

Environment variables used by the email service:

- `EMAIL_FROM_ADDRESS`
  - Default sender address.
  - Optional.
  - Falls back to `no-reply@localhost` if omitted.

- `EMAIL_FROM_NAME`
  - Default sender display name.
  - Optional.

- `EMAIL_SMTP_HOST`
  - SMTP server hostname.
  - Required to enable the service.

- `EMAIL_SMTP_PORT`
  - SMTP server port.
  - Optional.
  - Defaults to `25`.

- `EMAIL_SMTP_SECURE`
  - Whether the SMTP connection uses SSL/TLS from connect time.
  - Optional.
  - Valid values: `true`, `false`.
  - Defaults to `false`.

- `EMAIL_SMTP_USER`
  - SMTP username.
  - Optional.

- `EMAIL_SMTP_PASSWORD`
  - SMTP password.
  - Optional.
  - If set, `EMAIL_SMTP_USER` must also be set.

- `EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED`
  - Controls TLS certificate validation behavior.
  - Optional.
  - Valid values: `true`, `false`.
  - Leave empty for the normal runtime default.

### Local Development

The local Docker Compose stack includes `smtpdev` for capturing outbound mail.

Host-based local app execution should use:

```dotenv
EMAIL_FROM_ADDRESS=no-reply@portal.local
EMAIL_FROM_NAME=Portal Local
EMAIL_SMTP_HOST=127.0.0.1
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=
EMAIL_SMTP_PASSWORD=
EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED=
```

If the app later runs inside the same Compose network as the SMTP container, use:

```dotenv
EMAIL_SMTP_HOST=smtpdev
EMAIL_SMTP_PORT=25
EMAIL_SMTP_SECURE=false
```

Open `http://localhost:3001` to inspect captured messages in the smtp4dev UI.

### Usage Pattern

Import the service from `@/lib/email` in server-side code.

Available exports:

- `sendEmail(input)`
- `isEmailConfigured(env?)`

`sendEmail` requires:

- `to`
- `subject`
- at least one of `text` or `html`

Optional message fields:

- `from`
- `replyTo`
- `cc`
- `bcc`

### Example: Send A Plain Text Email

```ts
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Approval request submitted',
  text: 'Your approval request has been submitted and is awaiting review.',
});
```

### Example: Send HTML And Plain Text Together

```ts
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: ['approver1@example.com', 'approver2@example.com'],
  subject: 'Pending approval requires attention',
  text: 'A pending approval requires your review in the portal.',
  html: `
    <p>A pending approval requires your review in the portal.</p>
    <p><a href="http://localhost:3000/admin/approval-request">Open approval requests</a></p>
  `,
  replyTo: 'support@example.com',
});
```

### Example: Guard Optional Email Delivery

Use `isEmailConfigured()` when email sending should be optional for the workflow.

```ts
import { isEmailConfigured, sendEmail } from '@/lib/email';

if (isEmailConfigured()) {
  await sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to the portal',
    text: 'Your account is ready.',
  });
}
```

### Integration Guidance

- Keep email delivery behind domain-specific functions when the message has business meaning.
- Prefer wrappers such as `sendApprovalRequestSubmittedEmail()` or `sendUserWelcomeEmail()` instead of scattering raw email construction across routes.
- Keep transport configuration inside `src/lib/email.ts` so callers only supply message content.
- If delivery becomes more complex later, preserve the current `sendEmail()` helper as the lowest-level SMTP boundary unless there is a strong reason to replace it.
- Organization approval onboarding email now uses the wrapper in `src/lib/organization-admin-account-email.ts` so the template can be updated without changing approval workflow code.

### Error Handling Guidance

- `sendEmail()` throws when SMTP is not configured.
- `sendEmail()` throws when both `text` and `html` are missing.
- SMTP connection or delivery failures should usually be caught by the calling workflow when email is non-critical.
- For critical flows, record failures through the audit trail or a future notification log before surfacing an error to the user.

### Future Extension Notes

- Add templating only if multiple workflows start sharing structured email layouts.
- If queue-based delivery is introduced later, keep the public service contract simple and move asynchronous dispatch behind the service boundary.
- If provider-specific APIs are added later, document whether SMTP remains the default fallback.
- If attachments, inline images, or localization are added, document the payload conventions here before broad adoption.