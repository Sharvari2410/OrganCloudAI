# AI-Enhanced Smart Organ Donation & Transplant Management System

Production-style full-stack SaaS dashboard for organ donation and transplant operations.

## Stack

- Frontend: React + Tailwind CSS + Framer Motion + Recharts + Socket.IO Client
- Backend: Node.js + Express + Socket.IO
- Database: SQLite (embedded file)
- Auth: JWT + role-based access

## Core Features

- Responsive premium dashboard with glassmorphism and animation
- Modules: Dashboard, Donor, Recipient, Organ, Matching, Transport, Surgery, Approval Workflow
- Smart match score (blood group, organ type, age gap, urgency, hospital distance)
- Live organ journey tracking with timeline and status badges
- Emergency priority queue and predictive insight cards
- Real-time updates via Socket.IO

## Demo Login Accounts

- Admin: `admin@organ.ai` / `admin123`
- Doctor: `doctor@organ.ai` / `doctor123`
- Transport: `transport@organ.ai` / `transport123`

## Local Setup

1. Install dependencies:

- Root: `npm install`
- Backend: `npm install --prefix backend`
- Frontend: `npm install --prefix frontend`

2. Run locally:

- Backend: `npm start --prefix backend`
- Frontend: `npm run dev --prefix frontend`

3. Open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

## SQLite Data File

- Seed DB file: `backend/data/smartorgansystem.sqlite`
- Backend uses:
  - `SQLITE_PATH` (if set), else falls back to seed file above.
- On first start, if `SQLITE_PATH` file does not exist, backend auto-copies from seed DB.

## Deployment (Recommended)

### Backend on Render

- `render.yaml` already configured with:
  - build command
  - start command
  - persistent disk
  - `SQLITE_PATH=/var/data/smartorgansystem.sqlite`

Deploy flow:

1. Push repo to GitHub.
2. Create Render Web Service from repo.
3. Ensure persistent disk is attached (as in `render.yaml`).
4. Set/verify env vars:
   - `JWT_SECRET` (or use generated value)
   - `JWT_EXPIRES_IN=8h`
   - `SQLITE_PATH=/var/data/smartorgansystem.sqlite`
   - `NODE_ENV=production`

### Frontend on Netlify

- Build command: `npm run build --prefix frontend`
- Publish directory: `frontend/dist`
- Env var:
  - `VITE_API_URL=https://<your-render-backend-domain>/api`

## Render + Netlify Sync Notes

- Frontend always calls backend APIs via `VITE_API_URL`.
- Backend persists data in SQLite file on Render disk.
- This avoids external MySQL hosting while keeping data persistent across restarts.

## Real-Time Events

Server emits:

- `entity:changed`
- `status:update`
- `match:created`
- `transport:status`
- `transport:timeline`
- `approval:updated`

## Troubleshooting

- `EADDRINUSE:5000`: stop old backend process using that port.
- If backend boots but tables are missing, verify seeded DB exists at `backend/data/smartorgansystem.sqlite`.
- If Netlify UI loads but API fails, verify `VITE_API_URL` points to Render backend.
