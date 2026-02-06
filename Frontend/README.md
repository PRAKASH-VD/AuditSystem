# Smart Reconciliation & Audit System - Frontend

React (Vite) client for upload, reconciliation, audit trail, and role management.

## Requirements
- Node.js 18+
- Backend API running on `VITE_API_BASE`

## Setup
1. Install dependencies:
   `npm install`
2. Configure env:
   `Frontend/.env`
3. Start dev server:
   `npm run dev`

## Environment
`Frontend/.env`

```
VITE_API_BASE=http://localhost:5000
```

## Features
- Upload preview + column mapping
- Job history with reuse badge
- Reconciliation list + detail view
- Audit timeline and filters
- Role requests + admin approval

## Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview build
- `npm run lint` - lint
