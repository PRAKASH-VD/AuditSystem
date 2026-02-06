# Smart Reconciliation & Audit System - Backend

Node/Express API for file upload, reconciliation, audit trail, and role-based access.

## Requirements
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (or Memurai on Windows)

## Setup
1. Install dependencies:
   `npm install`
2. Create `.env` (see Environment section).
3. Start API server:
   `npm run dev`
4. Start worker (separate terminal):
   `npm run worker`

## Seed Admin
Creates an initial admin user (uses `SEED_ADMIN_*` env values):
`npm run seed:admin`

## Environment
Create `Backend/.env` with values like:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/audit_system
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=1d
REDIS_URL=rediss://default:password@host:6379
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
UPLOAD_DIR=uploads
BATCH_SIZE=1000
MAX_ROWS=50000

SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=*****

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@example.com
```

## Notes
- Upload preview and processing support CSV/XLSX.
- Upload jobs are queued in Redis and processed by `npm run worker`.
- Reconciliation rules are stored in MongoDB (configurable).
- Postman collection: `Backend/postman_collection.json`.

## Scripts
- `npm run dev` - start API server
- `npm run worker` - start BullMQ worker
- `npm run seed:admin` - create admin user
