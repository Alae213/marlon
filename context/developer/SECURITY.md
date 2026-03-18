# Security

> Claude reads this file before writing any code that touches auth, user data,
> payments, file uploads, external APIs, or environment variables.
> Security violations are always Must Fix — they block commits regardless of anything else.

---

## Secrets and Credentials

Never hardcode any secret, key, token, or password in source code — ever.
This includes placeholder values, test values, and "temporary" values.

- All secrets live in environment variables
- Environment variables are documented in `context/technical/ENVIRONMENT.md`
- `.env` files are always in `.gitignore` — verify this before every commit
- If a secret is accidentally committed, treat it as compromised immediately

Forbidden in code:
- API keys of any kind
- Database connection strings with credentials
- JWT secrets or signing keys
- OAuth client secrets
- Private keys or certificates
- Passwords, even hashed ones

---

## Authentication and Authorisation

Every route, endpoint, and action that requires a logged-in user must check
authentication before doing anything else. No exceptions.

Rules:
- Auth checks happen server-side — never trust the client to enforce access
- Verify the user owns the resource before returning or modifying it
  (a user requesting `/invoices/123` should only see it if invoice 123 belongs to them)
- Admin-only routes must verify the admin role explicitly, not just authentication
- Session tokens must expire — never create tokens with no expiry
- Logout must invalidate the session server-side, not just clear the cookie
- Failed auth attempts must not reveal whether the email exists

---

## User Input

Treat all user input as untrusted. Validate and sanitise everything before
using it in a query, rendering it to the page, or passing it to an external service.

Rules:
- Validate input type, length, and format on the server — client validation is UX only
- Never interpolate user input directly into database queries — always use parameterised queries
- Sanitise any user-generated content before rendering it as HTML
- Reject unexpected fields in form submissions — only accept what you expect
- File uploads: validate file type by content (not just extension), enforce size limits,
  never serve uploaded files from the same origin as the app

---

## Sensitive Data

Define what counts as sensitive for this project and handle it accordingly.

Sensitive data in most web apps includes:
- Passwords (must be hashed with bcrypt or argon2 — never md5 or sha1)
- Email addresses
- Payment information (never store raw card numbers — use Stripe or equivalent)
- Personal identification details
- Private messages or documents

Rules:
- Sensitive data is never logged — not in error logs, not in analytics
- Sensitive data is never included in URLs or query parameters
- Responses must not include sensitive fields the current user doesn't need
  (e.g. a user list endpoint should never return password hashes)
- Use HTTPS everywhere — never serve sensitive operations over HTTP

---

## Rate Limiting and Abuse Prevention

Protect endpoints that can be abused:
- Login and signup endpoints must be rate limited
- Password reset must be rate limited
- Any endpoint that sends emails or SMS must be rate limited
- Search endpoints that are computationally expensive should be rate limited

---

## Dependencies

- Never install a package without checking it is actively maintained
- Pin dependency versions in production — avoid `latest` or loose ranges
- Run `npm audit` after adding dependencies — flag high severity issues immediately

---

## What Claude Must Do

When writing code that touches any of the above areas, Claude must:

1. Read this file first
2. Check the feature spec for any stated security requirements
3. Implement the security measure — never defer it as "to do later"
4. Flag in the code review if any area was not addressed

Security is not a feature to add later. It is built in from the first line.

---

## Project-Specific Rules

<!-- Add any rules specific to this project here during setup or as they emerge.
     Examples:
     - All users must verify their email before accessing paid features
     - GDPR: users in the EU must be able to request deletion of their data
     - PCI: no payment data is stored — all card handling goes through Stripe
-->
