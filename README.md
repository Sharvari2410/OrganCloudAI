# AI-Enhanced Smart Organ Donation & Transplant Management System

Production-style full-stack SaaS dashboard for organ donation and transplant operations.

## Stack

- Frontend: React + Tailwind CSS + Framer Motion + Recharts + Socket.IO Client
- Backend: Node.js + Express + Socket.IO
- Database: MySQL
- Auth: JWT + role-based access

## Feature Coverage

- Premium responsive UI with glassmorphism cards, animated transitions, modern sidebar
- Modules: Dashboard, Donor, Recipient, Organ Management, Matching, Transport Tracking, Surgery, Approval Workflow
- Smart Match Score Engine (blood group, organ type, age gap, urgency, hospital distance)
- Live Organ Journey Tracker with real-time timeline updates
- Emergency Priority Queue (urgency + waiting days)
- Dynamic Approval Workflow Stepper (Doctor, Hospital, Legal)
- Admin dashboard KPIs, charts, activity feed, predictive insight cards
- Multi-hospital network transfer visualization
- Role-based routing and API authorization (Admin, Doctor, Transport)
- Real-time status badges via global status event stream

## Demo Login Accounts

- Admin: `admin@organ.ai` / `admin123`
- Doctor: `doctor@organ.ai` / `doctor123`
- Transport: `transport@organ.ai` / `transport123`

## API Modules

- `/api/auth`
- `/api/dashboard`
- `/api/donors`
- `/api/recipients`
- `/api/organs`
- `/api/matches`
- `/api/transport`
- `/api/surgery`
- `/api/approval`

Legacy generic CRUD remains at `/api/entities/:entity`.

## Real-Time Events (Socket.IO)

Server emits:
- `entity:changed`
- `status:update`
- `match:created`
- `transport:status`
- `transport:timeline`
- `approval:updated`

Client can subscribe to rooms:
- `subscribe:transport` with transportId
- `subscribe:approval`
- `subscribe:status`

## Setup

1. Import SQL dump into MySQL database:
   - `smartorgansystem`
   - `c:\Users\Tushar\Documents\dumps\Dump20260425 (1).sql`

2. Create env files:

- `backend/.env` (copy from `backend/.env.example`)
  - `PORT=5000`
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_USER=root`
  - `DB_PASSWORD=your_password`
  - `DB_NAME=smartorgansystem`
  - `JWT_SECRET=replace_with_secure_secret`
  - `JWT_EXPIRES_IN=8h`

- `frontend/.env` (copy from `frontend/.env.example`)
  - `VITE_API_URL=http://localhost:5000/api`

3. Install dependencies:

- Root: `npm install`
- Backend: `npm install --prefix backend`
- Frontend: `npm install --prefix frontend`

4. Run

- Backend: `npm start --prefix backend`
- Frontend: `npm run dev --prefix frontend`

Or from root:

- `npm run dev`

## Live Transport Update API (for transport team devices)

`PATCH /api/transport/:transportId/live-update`

Payload example:

```json
{
  "transport_status": "In Transit",
  "current_location": "Pune-Mumbai Expressway",
  "status": "Moving"
}
```

## Notes

- Frontend build is passing.
- Bundle-size warning is from charting + animation libraries and can be optimized later with route-level code splitting.
