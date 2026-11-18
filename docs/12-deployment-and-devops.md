# 🚀 Deployment, Environment & CI/CD Blueprint (`docs/12-deployment-and-devops.md`)

> **Purpose**: Defines production environment requirements, Zero-Docker cloud deployment, CI/CD automation (`.github/workflows/ci.yml`), and optional VPS containerization.

---

## 1. Production Environment Variables

### Backend (`backend/.env`)
| Variable | Required in Prod | Description |
|---|---|---|
| `NODE_ENV` | Yes (`production`) | Enables production security checks and disables error stack traces. |
| `PORT` | Optional (`5000`) | HTTP port bound by the Express server. |
| `DATABASE_URL` | Yes | MongoDB Atlas (`mongodb+srv://...`) or PostgreSQL connection URI. |
| `JWT_SECRET` | **Mandatory (≥32 chars)** | Server refuses to boot in `NODE_ENV=production` if missing or shorter than 32 characters. |
| `CORS_ORIGIN` | Yes | Comma-separated list of allowed frontend origins (e.g., `https://app.clientdomain.com`). |

### Frontend (`frontend/.env.local`)
| Variable | Required in Prod | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Public URL of the deployed backend API (e.g., `https://api.clientdomain.com`). |

---

## 2. Recommended Cloud Deployment (Zero-Docker Default)

1. **Frontend (Vercel / Netlify)**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Environment Variable: `NEXT_PUBLIC_API_URL`
2. **Backend (Railway / Render / DigitalOcean App Platform)**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Health Check Path: `/api/health`
3. **Database (MongoDB Atlas / Neon / Supabase)**:
   - Provide connection string via `DATABASE_URL` and whitelist backend egress IP.

---

## 3. Continuous Integration (`.github/workflows/ci.yml`)

Every push and pull request automatically executes:
1. Dependency installation across root, `backend/`, and `frontend/`.
2. Backend TypeScript build (`npm run build --prefix backend`), ESLint (`npm run lint --prefix backend`), and API smoke tests (`npm test --prefix backend`).
3. Frontend Next.js production build (`npm run build --prefix frontend`) and lint check (`npm run lint --prefix frontend`).
4. Contract and project structure validation (`scripts/validate-contracts.sh` & `scripts/validate-project.sh`).
