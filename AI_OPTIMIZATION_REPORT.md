# AI Optimization Report

> This report should be updated by the candidate with the exact prompts, tools and observations used during development. Do not claim an AI-generated defect unless you actually reviewed and observed it.

## 1. Tools & Prompting

AI assistance used during development:

- ChatGPT: architecture brainstorming, schema review, API design, test planning and documentation.
- Optional coding assistant: record the actual tool used if applicable.

AI was used as an engineering assistant rather than as an authority. Generated code was reviewed against the assessment's security and business rules.

## 2. Flawed / Broken AI Code

### Finding A — Client-only authorization

A common AI-generated approach is to hide buttons based on the current role and assume that this protects the endpoint.

**Problem:** A user can bypass the UI and call the API directly.

**Review decision:** Role enforcement must happen in backend middleware using the authenticated JWT context.

**Final approach:** `requireRole(...)` is applied to protected API routes and the backend returns `403 Forbidden` for unauthorized roles.

### Finding B — Client-only shortage validation

A common AI-generated implementation calculates RED status in the browser and trusts the submitted status.

**Problem:** A malicious client could send an approval request with a fabricated status.

**Review decision:** The backend must load the persisted verification items and independently calculate whether any component is missing, RED, or uncounted.

**Final approach:** The approval service recomputes the gatekeeper decision on the server and returns `422 Unprocessable Entity` when the hard-stop rule is violated.

## 3. Human Refactoring

Engineering decisions applied after AI-assisted drafting:

- Moved RBAC checks into backend middleware.
- Derived verifier identity from the JWT instead of request-body fields.
- Recomputed verification status on the server.
- Added strict integer validation for quantities.
- Added mandatory rejection-note validation.
- Restricted Sewing Queue queries to `VERIFIED` records.
- Used database transactions for state transition + audit persistence.
- Added explicit state-transition guards.
- Added high-contrast input styles and visible validation errors.
- Kept secrets in environment variables.

## 4. Defensive Architecture

```text
JWT
 |
 v
Authentication middleware
 |
 v
Role middleware
 |
 v
Controller
 |
 v
Business-rule validation
 |
 +--> RED / missing / uncounted => 422
 |
 v
Database transaction
 |
 +--> VERIFIED state
 +--> immutable verification log
 |
 v
Sewing Queue
```

The frontend improves usability but is never treated as a security boundary.
