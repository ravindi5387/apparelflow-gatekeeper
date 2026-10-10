ApparelFlow Gatekeeper

Webtezza Software Engineering Practical Challenge — Production Batch Verification & Sewing Queue Gatekeeper

ApparelFlow Gatekeeper is a full-stack production control application designed to prevent unverified garment cutting batches from reaching the sewing floor.

The system provides authenticated role-based access, production batch creation, recipe/component verification, GREEN/YELLOW/RED quality gates, server-side approval hard stops, rejection handling, audit records, persistent PostgreSQL storage, and a VERIFIED-only sewing queue.

📌 Project Overview

The application implements a controlled workflow between the cutting and sewing stages of garment production.

Cutting Supervisor
│
▼
Create Production Batch
│
▼
PENDING_VERIFICATION
│
▼
Cutting Verifier
│
├───────────────┐
│ │
▼ ▼
RED GREEN / YELLOW
│ │
▼ ▼
REJECTED VERIFIED
│
▼
Sewing Queue
│
▼
SEWING_IN_PROGRESS

The main business control is the server-side verification gate.

A RED/shortage batch cannot be approved through the frontend or by directly calling the backend API.

🎯 Assessment Requirements Covered

Three user roles

JWT authentication

Password hashing with bcrypt

Server-side RBAC

Persistent PostgreSQL database

Prisma ORM

Production recipe management

Production batch creation

Dynamic component quantity calculation

GREEN / YELLOW / RED verification

Server-side RED hard stop

Mandatory rejection reason

Verification/audit records

Fabric roll tracking

Fabric usage/wastage calculation

VERIFIED-only sewing queue

Defensive numeric validation

Automated tests

Postman API/security testing

Responsive professional UI

AI optimization report

GitHub-ready project structure

Deployment-ready configuration

👥 User Roles

Role

Responsibilities

Cutting Supervisor

Creates production batches/cutting orders

Cutting Verifier

Counts components and approves/rejects batches

Sewing Supervisor

Views verified batches and manages sewing queue

Server-side role isolation

The backend is the final authority for permissions.

A user cannot gain verifier permissions by changing a frontend dropdown or modifying client-side state.

🧵 Production Recipes

The seeded application contains the assessment recipes:

Recipe

Code

Casual Blouse

REC-BL01

Crop Top

REC-CT02

Each recipe contains its required production components and component multipliers.

Expected quantities are calculated dynamically.

🚦 Verification Rules

For every component:

Expected Quantity =
Target Batch Quantity × Component Multiplier

Example:

Target quantity = 50

Component multiplier = 2

Expected quantity = 50 × 2
= 100

The verifier enters the physical actual quantity.

Result

Rule

Meaning

🟢 GREEN

actual === expected

Exact quantity

🟡 YELLOW

actual > expected

Overage

🔴 RED

actual < expected

Shortage

RED Hard Stop

If any component is RED or uncounted:

Frontend
↓
Approval disabled

Backend
↓
HTTP 422

Database
↓
Order cannot become VERIFIED

Sewing Queue
↓
Order is not released

This prevents a client-side bypass from releasing an unsafe production batch.

🏗️ System Architecture

┌───────────────────────────────┐
│ Next.js Frontend │
│ React + TypeScript │
└───────────────┬───────────────┘
│
│ REST / JSON
│ Bearer JWT
▼
┌───────────────────────────────┐
│ Express Backend │
│ Node + TypeScript │
├───────────────────────────────┤
│ Authentication │
│ Server-side RBAC │
│ Verification Rules │
│ Approval Hard Stop │
│ Rejection Validation │
└───────────────┬───────────────┘
│
▼
┌──────────────┐
│ Prisma │
└──────┬───────┘
│
▼
┌──────────────┐
│ PostgreSQL │
│ Neon │
└──────────────┘

🛠️ Technology Stack

Frontend

Next.js

React

TypeScript

CSS

Responsive UI

Backend

Node.js

Express.js

TypeScript

REST API

JWT

bcrypt

Database

PostgreSQL

Neon PostgreSQL

Prisma ORM

Development / Testing

Git

GitHub

Postman

Prisma Studio

Docker / Docker Compose

Automated tests

📁 Repository Structure

apparelflow-gatekeeper/
│
├── backend/
│ ├── prisma/
│ │ ├── schema.prisma
│ │ └── seed.ts
│ │
│ ├── src/
│ │ ├── auth.ts
│ │ ├── business.ts
│ │ ├── prisma.ts
│ │ ├── server.ts
│ │ └── types.ts
│ │
│ ├── tests/
│ ├── .env.example
│ └── package.json
│
├── frontend/
│ ├── app/
│ ├── components/
│ ├── lib/
│ └── package.json
│
├── screenshots/
│ ├── 01-login.png
│ ├── 02-supervisor-create-batch.png
│ ├── 03-pending-verification.png
│ ├── 04-green-approved.png
│ ├── 05-red-hard-stop.png
│ ├── 06-rejection.png
│ ├── 07-sewing-queue.png
│ ├── 08-postman-login-200.png
│ ├── 09-postman-403.png
│ └── 10-postman-422.png
│
├── AI_OPTIMIZATION_REPORT.md
├── docker-compose.yml
├── README.md
└── .gitignore

🔐 Demo Credentials

The seeded assessment/demo database uses:

Role

Email

Password

Cutting Supervisor

supervisor@apparelflow.com

Password123!

Cutting Verifier

verifier@apparelflow.com

Password123!

Sewing Supervisor

sewing@apparelflow.com

Password123!

These credentials are intended for the assessment/demo environment only. Production deployments should use controlled credentials and secrets.

The application login screen does not expose passwords in a visible credential panel.

🚀 Local Setup

Prerequisites

Install:

Node.js 20+

npm 10+

Git

PostgreSQL 15+ or Docker Desktop

1. Database

For local Docker PostgreSQL:

docker compose up -d db

Example local database URL:

postgresql://postgres:postgres@localhost:5432/apparelflow

The current development setup can also use Neon PostgreSQL.

2. Backend Setup

cd backend
npm install

Create .env.

Windows

copy .env.example .env

Linux/macOS

cp .env.example .env

Configure:

DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-strong-jwt-secret"
PORT=5000

Run Prisma migration:

npx prisma migrate dev

Seed the database:

npm run seed

Start the backend:

npm run dev

Backend:

http://localhost:5000

Health check:

http://localhost:5000/api/health

Expected:

{
"status": "ok",
"database": "connected"
}

3. Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:3000

If port 3000 is already in use, Next.js may use another available port.

🔄 End-to-End Business Workflow

Step 1 — Cutting Supervisor

Login as:

supervisor@apparelflow.com

Create a production batch with:

Recipe

Target quantity

Fabric roll ID

Actual fabric usage

The batch enters:

PENDING_VERIFICATION

Step 2 — Cutting Verifier

Login as:

verifier@apparelflow.com

Open the pending batch.

Enter actual component quantities.

The application calculates:

GREEN
YELLOW
RED

Step 3 — GREEN/YELLOW Approval

If all required components are counted and there are no shortages:

PENDING_VERIFICATION
↓
VERIFIED

Step 4 — RED Rejection / Hard Stop

If a shortage exists:

Expected = 100
Actual = 99
Result = RED

Approval must be blocked.

The backend returns:

422 Unprocessable Entity

Step 5 — Sewing Queue

Only:

VERIFIED

batches are available to the Sewing Supervisor.

VERIFIED
↓
Sewing Queue
↓
SEWING_IN_PROGRESS

🔒 Security Controls

JWT Authentication

Authentication is performed through:

POST /api/auth/login

The server returns a signed JWT.

Authenticated requests use:

Authorization: Bearer <token>

Password Security

Passwords are stored using bcrypt hashing.

Plain-text passwords are not stored in the database.

Server-Side RBAC

Role permissions are enforced by backend middleware.

Example:

CUTTING_SUPERVISOR
→ Create production orders

CUTTING_VERIFIER
→ Verify
→ Approve
→ Reject

SEWING_SUPERVISOR
→ Sewing queue
→ Start sewing

🌐 API Overview

Authentication

POST /api/auth/login
GET /api/auth/me

Recipes

GET /api/recipes

Orders

GET /api/orders
POST /api/orders
GET /api/orders/:id

Verification

GET /api/verifications/pending
GET /api/verifications/:orderId
POST /api/verifications/:orderId/approve
POST /api/verifications/:orderId/reject

Sewing

GET /api/sewing/queue
POST /api/sewing/:orderId/start

🧪 Postman Testing

Login — 200

Request:

POST http://localhost:5000/api/auth/login

Body:

{
"email": "verifier@apparelflow.com",
"password": "Password123!"
}

Expected:

200 OK

Evidence:

screenshots/08-postman-login-200.png

Role Isolation — 403

Use a Cutting Supervisor JWT against the verifier-only approval endpoint:

POST /api/verifications/:orderId/approve

Expected:

403 Forbidden

This proves server-side role isolation.

Evidence:

screenshots/09-postman-403.png

RED Hard Stop — 422

Use a Cutting Verifier JWT against a pending batch containing a RED shortage:

POST /api/verifications/:orderId/approve

Expected:

422 Unprocessable Entity

The response should explain that approval is blocked because the verification contains a shortage/invalid gate state.

Evidence:

screenshots/10-postman-422.png

🧪 Automated Tests

Run:

cd backend
npm test

Critical test coverage includes:

GREEN components can be approved.

RED shortages block approval.

Missing rejection reasons fail validation.

Non-verifier roles receive a forbidden result.

Sewing queue contains only VERIFIED orders.

🏗️ Production Build Validation

Backend

cd backend
npm run build

Frontend

cd frontend
npm run build

Both builds should complete successfully before deployment.

💾 Database Persistence

The application uses PostgreSQL through Prisma.

Persistent entities include:

Users

Roles

Recipes

Recipe components

Production orders

Verification results

Rejection information

Audit/verification records

Sewing state

Refreshing the browser does not remove production data.

🧵 Fabric Usage / Wastage

Production batches capture:

Fabric roll ID

Actual fabric used in yards

The application calculates fabric usage/wastage according to the implemented business rules.

Numeric inputs are validated to prevent invalid production values.

📝 Audit Trail

Verification activity is persisted for traceability.

Audit/verification information can be used to identify:

Production order

Verification activity

Authenticated user

Verification result

Approval/rejection activity

Rejection reason

Production state changes

🖼️ Screenshots / Assessment Evidence

All assessment screenshots should be stored in:

screenshots/

01 — Login

Professional login screen with role-based access selection.

02 — Supervisor Creates Production Batch

Shows the Cutting Supervisor creating a production batch with recipe, quantity, fabric roll ID, and fabric usage.

03 — Pending Verification

Shows a newly created batch waiting for the Cutting Verifier.

04 — GREEN Approval

Shows successful component verification and approval of a valid batch.

05 — RED Hard Stop

Shows a component shortage and the blocked approval state.

06 — Rejection

Shows rejection handling with a mandatory rejection reason.

07 — Sewing Queue

Shows the Sewing Supervisor queue containing only server-verified batches.

08 — Postman Login 200

Shows successful authentication through the API.

Expected status:

200 OK

09 — Postman RBAC 403

Shows a user with an insufficient role attempting a verifier-only action.

Expected:

403 Forbidden

This is evidence of server-side RBAC.

10 — Postman RED Hard Stop 422

Shows a verifier attempting to approve a RED/shortage batch.

Expected:

422 Unprocessable Entity

This is evidence of the server-side approval hard stop.

🔧 Environment Variables

Backend .env

DATABASE_URL=
JWT_SECRET=
PORT=5000
CORS_ORIGIN=

Frontend environment

NEXT_PUBLIC_API_URL=

Never commit real secrets.

The following files/folders should remain ignored:

.env
.env.local
node_modules/
.next/
dist/
coverage/

☁️ Deployment

Recommended architecture:

                  GitHub
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
       Vercel              Railway / Render
      Frontend                 Backend
                                  │
                                  ▼
                            Neon PostgreSQL

Production Database Migration

Use:

npx prisma migrate deploy

Seed the database only when intentionally initializing the assessment/demo environment:

npm run seed

Production start:

npm start

🤖 AI Optimization Report

The project includes:

AI_OPTIMIZATION_REPORT.md

The report documents AI-assisted development and should cover:

Development tasks supported by AI

Prompting approach

Debugging assistance

Testing assistance

Security considerations

Human review

Validation of generated suggestions

Limitations and risks

AI assistance does not replace developer testing or validation.

📋 Final Submission Checklist

Public GitHub repository

Live frontend URL

Live backend API

Persistent PostgreSQL database

README.md

AI_OPTIMIZATION_REPORT.md

Three roles implemented

JWT authentication works

Password hashing works

Server-side RBAC works

Production batch creation works

Dynamic component calculation works

GREEN verification works

YELLOW verification works

RED verification works

RED approval is blocked

Backend returns HTTP 422 for RED approval

Rejection requires a reason

Verification/audit records persist

Fabric usage/wastage works

Sewing queue contains VERIFIED batches only

Sewing workflow works

401 authentication test completed

403 RBAC test completed

422 RED hard-stop test completed

npm test passes

Backend build passes

Frontend build passes

Data persists after refresh

No secrets committed

Screenshots included

Live deployment tested

🔄 Final End-to-End Test

Perform one complete test before submission:

Login
│
▼
Cutting Supervisor
│
▼
Create Production Batch
│
▼
PENDING_VERIFICATION
│
▼
Cutting Verifier
│
├─────────────────────┐
│ │
▼ ▼
GREEN / YELLOW RED
│ │
▼ ▼
APPROVE BLOCK
│ HTTP 422
▼ │
VERIFIED REJECT
│ + Reason
▼
Sewing Supervisor
│
▼
VERIFIED-ONLY
SEWING QUEUE

🌍 Submission Details

Project

ApparelFlow Gatekeeper

GitHub Repository

https://github.com/ravindi5387/apparelflow-gatekeeper

Live Frontend

ADD YOUR DEPLOYED FRONTEND URL HERE

Live Backend

ADD YOUR DEPLOYED BACKEND URL HERE

Database

PostgreSQL / Neon

📩 Submission Message

Dear Sir/Madam,

Please find my completed ApparelFlow Gatekeeper Software Engineering Practical Challenge below.

GitHub Repository:
[GitHub URL]

Live Demo:
[Live Frontend URL]

Backend API:
[Backend URL]

The application implements role-based authentication and authorization, production batch management, dynamic component verification, GREEN/YELLOW/RED validation, server-side RED hard-stop approval control, rejection handling, persistent verification/audit records, and a VERIFIED-only sewing queue.

The repository also includes automated tests, Postman security testing evidence, screenshots, deployment configuration, and the AI optimization report.

Thank you.
