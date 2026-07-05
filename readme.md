# PulseOps

A real-time infrastructure monitoring platform. Lightweight agents collect CPU, memory, and disk metrics from multiple servers, stream them through Redis to a central backend, and display live charts on a React dashboard — with statistical anomaly detection and Slack alerting.

Built as a self-hosted alternative to Datadog/Prometheus for teams running on a few EC2 instances.

---

## Architecture

```
[Agent: API Server] ──┐
[Agent: DB Server]  ──┼── HMAC-signed JSON ──► Redis Streams
[Agent: Worker Node]──┘                              │
                                                      ▼
                                           Consumer Worker (XREADGROUP)
                                          ┌───────────┼───────────┐
                                          ▼           ▼           ▼
                                    TimescaleDB  Anomaly      Socket.io
                                          │      Detector         │
                                          ▼           │           ▼
                                    Express API   Slack      React Dashboard
                                          └───────────────────────┘
                                               REST (historical)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent | Node.js, ioredis |
| Message queue | Redis Streams |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.io (WebSockets) |
| Time-series DB | PostgreSQL + TimescaleDB |
| Anomaly detection | Z-score (rolling 20-point window) |
| Alerting | Slack Webhook |
| Frontend | React, Vite, TypeScript, TailwindCSS, Recharts |
| Auth | JWT |
| Infrastructure | Docker, Docker Compose |

---

## Features

- Live CPU, memory, disk metrics updating every 5 seconds via WebSocket
- Historical charts with 1h / 6h / 24h time range selector
- Statistical anomaly detection — z-score on a 20-point rolling window per metric
- Slack webhook alert on anomaly detection
- HMAC-SHA256 signature verification on every agent payload
- Redis stream capped at 1000 entries (prevents memory bloat)
- Batch writes to TimescaleDB (prevents DB write bottleneck)
- JWT-protected dashboard and REST API
- Simulates multiple servers using Docker containers locally

---

## Project Structure

```
pulseops/
├── agent/
│   ├── collector.js       # reads /proc/stat, /proc/meminfo
│   ├── pusher.js          # signs payload, pushes to Redis Stream
│   ├── package.json
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── ingestion/
│   │   │   ├── consumer.ts    # XREADGROUP loop, HMAC verify
│   │   │   └── writer.ts      # buffered batch writes to TimescaleDB
│   │   ├── anomaly/
│   │   │   └── zscore.ts      # rolling z-score detection
│   │   ├── alerts/
│   │   │   └── slackWebhook.ts
│   │   ├── api/routes/
│   │   │   ├── metrics.ts
│   │   │   ├── alerts.ts
│   │   │   ├── servers.ts
│   │   │   └── auth.ts
│   │   ├── sockets/
│   │   │   └── liveMetrics.ts
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── client.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── ServerCard.tsx
│   │   │   ├── MetricChart.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ServerDetail.tsx
│   │   ├── hooks/
│   │   │   └── useSocket.ts
│   │   └── types.ts
│   ├── .env
│   └── package.json
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)

### 1. Clone the repo

```bash
git clone https://github.com/YiVibro/PulseOps.git
cd pulseops
```

### 2. Start backend + agents with Docker

```bash
docker-compose up --build
```

This starts:
- Redis (message broker)
- TimescaleDB (time-series storage)
- Express backend + consumer worker
- 3 simulated agent containers (API Server, DB Server, Worker Node)

Wait for:
```
backend-1 | Backend running on port 4000
```

### 3. Seed the database (first time only)

```bash
docker exec -it pulseops-timescaledb-1 psql -U postgres -d devops_monitor
```

```sql
INSERT INTO servers (id, label, secret_hash) VALUES
('api-server-01', 'API Server', 'secret_api_server'),
('db-server-01', 'Database Server', 'secret_db_server'),
('worker-01', 'Worker Node', 'secret_worker')
ON CONFLICT DO NOTHING;
\q
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Login

| Field | Value |
|-------|-------|
| Email | `admin@monitor.com` |
| Password | `admin123` |

---

## Demo — Trigger a CPU Spike

```bash
docker exec -it pulseops-agent-api-server-1 sh
apk add stress
stress --cpu 4 --timeout 30
```

Watch the API Server card turn critical on the dashboard and a Slack alert fire within two polling cycles.

---

## Environment Variables

### Backend (`docker-compose.yml`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `ADMIN_EMAIL` | Dashboard login email |
| `ADMIN_PASSWORD` | Dashboard login password |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL for alerts |
| `FRONTEND_URL` | Frontend origin for CORS |

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend REST API URL |
| `VITE_WS_URL` | Backend WebSocket URL |

---

## Security

- **HMAC-SHA256** signature on every agent payload — unauthenticated data is dropped before touching the database
- **Redis MAXLEN 1000** — prevents memory exhaustion from a misbehaving agent
- **JWT authentication** on all API endpoints and WebSocket connections
- **Non-root agent** — agent process only reads from `/proc`, no system write access
- **TLS-ready** — configure Nginx reverse proxy with Let's Encrypt for production

---

## Scaling

| Concern | Solution |
|---------|----------|
| More agents | Just run more agent containers — Redis handles concurrent XADD |
| More consumers | Run multiple consumer instances — Redis consumer groups load-balance |
| DB growth | TimescaleDB automatic time-based partitioning + compression |
| Multi-server WebSocket | Add Redis pub/sub adapter to Socket.io |

---

## Interview Talking Points

- Why Redis Streams over direct DB writes? — Decouples agents from DB, handles backpressure, guarantees at-least-once delivery via consumer groups
- Why TimescaleDB? — Automatic time partitioning makes range queries fast at scale without changing SQL syntax
- Why z-score for anomaly detection? — Simple, interpretable, no black-box ML, works on rolling baseline so it adapts to each server's normal behaviour
- Why React + Vite over Next.js? — Internal dashboard with no SEO requirements; persistent WebSocket connections don't work well with Next.js serverless model

---

## License

MIT