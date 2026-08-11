# Alvine IT Solution

Company website and admin panel built with React, Vite, Express, and MongoDB.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Framer Motion + Lenis
- **Backend:** Express.js + Mongoose + MongoDB Atlas
- **Infra:** Docker Compose + Nginx reverse proxy + blue-green deploy

## Local Development

```bash
# Install dependencies
bun install
cd server && bun install && cd ..

# Create .env (see .env.example)
cp .env.example .env

# Start frontend dev server
bun run dev          # → http://localhost:5173

# Start backend (separate terminal)
cd server && bun run dev   # → http://localhost:4005
```

The Vite dev server proxies `/api` to `http://localhost:4005` automatically.

## Project Structure

```
src/
  components/        # Reusable UI (Navbar, AdminLayout, etc.)
  pages/             # Route pages (Home, InvoiceGenerator, Admin*)
  i18n/locales/      # en.json, id.json, zh.json
  lib/api.ts         # Frontend API client
server/
  models/            # Mongoose schemas (Invoice, Customer, Timeline, User, Contact)
  routes/            # Express route handlers
  index.ts           # Server entry point
nginx/
  proxy.conf         # Reverse proxy (routes /api to server, / to frontend)
  app.conf           # SPA fallback for frontend containers
```

## Deploy with Docker Compose

### Prerequisites

- Docker with Compose V2
- `.env` file with `MONGODB_URI` (see `.env.example`)

### First-Time Setup

```bash
chmod +x deploy.sh
./deploy.sh --setup
```

This builds all images, starts services, and waits for health checks.
Nginx is available at **http://localhost:3025**.

### Deploy Updates

```bash
./deploy.sh
```

Performs a blue-green deployment:
1. Pulls latest code from `main`
2. Rebuilds the API server
3. Builds the inactive frontend slot (blue ↔ green)
4. Waits for health checks
5. Switches Nginx traffic to the new slot
6. Stops the old slot

### All Commands

| Command | Description |
|---|---|
| `./deploy.sh` | Blue-green deploy (default) |
| `./deploy.sh --setup` | First-time setup — build all + start |
| `./deploy.sh --server` | Rebuild and restart API server only |
| `./deploy.sh --full` | Full teardown + `--no-cache` rebuild |
| `./deploy.sh --status` | Show service status and live slot |
| `./deploy.sh --logs` | Tail all service logs |
| `./deploy.sh --down` | Stop all services |
| `./deploy.sh --rollback` | Switch traffic back to previous slot |

### Architecture

```
                   ┌─────────────────────────┐
                   │    Nginx (:3025)         │
                   │    /api  → server:4005   │
                   │    /*    → app-blue:80   │
                   └────┬────────────┬────────┘
                        │            │
              ┌─────────▼──┐   ┌────▼─────────┐
              │  API Server │   │  App (blue/  │
              │  :4005      │   │  green :80)  │
              │  Express +  │   │  Nginx SPA   │
              │  Mongoose   │   │  + static    │
              └──────┬──────┘   └──────────────┘
                     │
              ┌──────▼──────┐
              │  MongoDB    │
              │  Atlas      │
              └─────────────┘
```

### Services

| Service | Port | Description |
|---|---|---|
| `nginx` | 3025 | Reverse proxy, unified entry point |
| `server` | 4005 | Express API (invoices, customers, timeline, auth, contacts) |
| `app-blue` | internal | Frontend build (blue slot) |
| `app-green` | internal | Frontend build (green slot) |

All services have health checks. Nginx waits for healthy backends before starting.

## Admin Panel

- `/admin/login` — Authenticate
- `/admin/dashboard` — Overview
- `/admin/customers` — CRUD customers + timeline calendar
- `/admin/invoices` — CRUD invoices
- `/admin/contacts` — Contact submissions

## Invoice Generator

- `/generate/invoice` — Create new invoice (live preview + print/PDF)
- `/generate/invoice?edit=<id>` — Edit existing invoice
