ApparelFlow Gatekeeper

Webtezza Software Engineering Practical Challenge — Production Batch Verification & Sewing Queue Gatekeeper

ApparelFlow Gatekeeper is a full-stack application that controls garment production batches from cutting verification to sewing. It prevents unverified or shortage batches from being released to the sewing floor.

✨ Key Features

JWT authentication and bcrypt password hashing

Server-side Role-Based Access Control (RBAC)

Cutting Supervisor, Cutting Verifier and Sewing Supervisor roles

Production batch and recipe management

Dynamic component quantity calculation

GREEN / YELLOW / RED verification

Server-side RED approval hard stop (HTTP 422)

Mandatory rejection reason

Persistent verification/audit records

Fabric roll and usage/wastage tracking

VERIFIED-only sewing queue

PostgreSQL + Prisma persistence

Automated tests and Postman API/security testing

Responsive professional UI

🏗️ Architecture

Next.js + React + TypeScript
            │
        REST API + JWT
            ▼
Node.js + Express + TypeScript
            │
       Auth + RBAC
            │
       Business Rules
            │
          Prisma
            │
            ▼
     PostgreSQL / Neon

     
<img width="1774" height="887" alt="image" src="https://github.com/user-attachments/assets/2ac749bd-4f45-4cca-9769-058d89d9162f" />


Verification Rules

Status

Condition

🟢 GREEN

Actual = Expected

🟡 YELLOW

Actual > Expected

🔴 RED

Actual < Expected

RED batches cannot be approved. The frontend blocks approval and the backend enforces the rule with HTTP 422 Unprocessable Entity.

👥 Roles

Role

Responsibility

Cutting Supervisor

Create production batches

Cutting Verifier

Verify, approve or reject batches

Sewing Supervisor

Manage VERIFIED sewing queue

🛠️ Technology Stack

Frontend: Next.js, React, TypeScript, CSS
Backend: Node.js, Express.js, TypeScript, JWT, bcrypt
Database: PostgreSQL, Neon, Prisma
Tools: Git, GitHub, Postman, Docker, Prisma Studio

🚀 Local Setup

Backend

cd backend
npm install

Create .env from .env.example and configure:

DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secure-jwt-secret"
PORT=5000

Then:

npx prisma migrate dev
npm run seed
npm run dev

Backend:

http://localhost:5000

Health check:

http://localhost:5000/api/health

Frontend

cd frontend
npm install
npm run dev

Frontend:

http://localhost:3000

🔐 Demo Accounts

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

Demo credentials are for assessment/testing only.

🧪 Testing

Run backend tests:

cd backend
npm test

Build backend:

npm run build

Build frontend:

cd ../frontend
npm run build

API Security Evidence

403 Forbidden — unauthorized role attempting verifier-only approval

422 Unprocessable Entity — RED/shortage batch approval blocked by backend

# 📸 Screenshots

## 1. Login

<img width="1917" height="910" alt="01-Login" src="https://github.com/user-attachments/assets/e1d545a6-b490-4172-885e-b2d1f5061553" />


---

## 2. Supervisor - Create Production Batch

<img width="1907" height="962" alt="02-supervisor-dashboard" src="https://github.com/user-attachments/assets/75307784-1977-4991-a9d4-64210a3bb119" />

---

## 3. Pending Verification

<img width="1912" height="751" alt="04-pending-verification" src="https://github.com/user-attachments/assets/df5ffa00-cf52-479a-88b3-d076e9ffd4ce" />


---

## 4. GREEN Approval

<img width="1910" height="292" alt="05-green-approved" src="https://github.com/user-attachments/assets/283497b3-2b6c-49e4-93b3-762667bed28f" />

---

## 5. RED Hard Stop

<img width="1886" height="950" alt="06-red-hard-stop" src="https://github.com/user-attachments/assets/5e9b32b2-7a2f-4fb3-9d11-3078214c086f" />


---

## 6. Rejection

<img width="1917" height="612" alt="07-rejection" src="https://github.com/user-attachments/assets/dbb852f5-b223-4a46-be17-f36151b15ac6" />


---

## 7. Sewing Queue

<img width="1917" height="956" alt="08-sewing-queue" src="https://github.com/user-attachments/assets/c52483f5-405b-4c30-902a-5a12abda7d53" />


---

## 8. Postman Login - 200

<img width="1917" height="1017" alt="Postman Login - 200" src="https://github.com/user-attachments/assets/65f73b1a-5ebc-44d4-90ca-b5085984a56b" />


---

## 9. Postman RBAC - 403

<img width="1917" height="977" alt="09-postman-403" src="https://github.com/user-attachments/assets/02b9a65e-43ab-4c9d-a682-4c4ed099bac9" />


---

## 10. Postman RED Hard Stop - 422

<img width="1917" height="992" alt="10-postman-422" src="https://github.com/user-attachments/assets/45517f25-4d05-4aae-ab0b-ea75b3f73ab8" />


🤖 AI-Assisted Development

AI_OPTIMIZATION_REPORT.md documents the use of AI assistance for development, debugging, testing and optimization, together with human validation.

🌐 Deployment

Recommended:

Frontend  → Vercel
Backend   → Railway / Render
Database  → Neon PostgreSQL

Live Frontend: Add deployed URL
Live Backend: Add deployed API URL

🔒 Security

Secrets are stored in environment variables.

.env files are excluded from Git.

Passwords are bcrypt-hashed.

JWT authentication protects API access.

Role permissions are enforced server-side.

RED approval cannot be bypassed through the frontend.

📄 Project Documentation

README.md — Project overview, setup and assessment evidence

AI_OPTIMIZATION_REPORT.md — AI-assisted development and optimization report
