# PulseOps — Real-Time Infrastructure Monitoring Platform

A self-hosted, production-grade infrastructure monitoring platform. Lightweight agents collect CPU, memory, and disk metrics from real servers, stream them through Redis to a central backend, detect anomalies using statistical z-score analysis, and display live charts on a React dashboard with Slack alerting.

Built as a lean, self-hosted monitoring live EC2 instances.

---

## Live Demo

- **Dashboard:** `http://<frontend-url>:5173`
- **Backend API:** `http://<backend-ec2-ip>:4000/api/health`
- **Agents running on:** 2 AWS EC2 instances (real isolated metrics)

---

## Architecture

```
[EC2: Agent api-server-01] ──┐
[EC2: Agent db-server-01]  ──┼── HMAC-signed JSON every 5s ──► Redis Streams (XADD MAXLEN 1000)
                              │                                          │
                              │                                   XREADGROUP loop
                              │                                          │
                              │                              ┌───────────┼───────────┐
                              │                              ▼           ▼           ▼
                              │                        TimescaleDB  Z-Score      Socket.io
                              │                        (batch write) Anomaly    WebSocket
                              │                              │       Detector        │
                              │                              │           │           │
                              │                              ▼           ▼           ▼
                              │                        Express REST  Slack      React Dashboard
                              │                           API        Webhook    (live charts)
                              └──────────────────────────────────────────────────────┘
                                                  historical queries via REST
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Agent | Node.js | Lightweight, runs on any Linux server |
| Metrics source | `/proc/stat`, `/proc/meminfo` | Raw kernel data, zero overhead |
| Message queue | Redis Streams | Decouples agents from DB, at-least-once delivery |
| Backend | Node.js + Express + TypeScript | Fast, typed, familiar ecosystem |
| Real-time | Socket.io (WebSockets) | Persistent connection, instant push |
| Time-series DB | PostgreSQL + TimescaleDB | Automatic time partitioning, standard SQL |
| Anomaly detection | Z-score (rolling 20-point window) | Simple, interpretable, no black-box ML |
| Alerting | Slack Webhook | Zero-dependency alert delivery |
| Frontend | React + Vite + TypeScript + TailwindCSS | SPA, no SSR needed, fast dev |
| Charts | Recharts | Composable, React-native chart library |
| Auth | JWT | Stateless, scales horizontally |
| Infrastructure | Docker, Docker Compose | Reproducible deployment |
| Deployment | AWS EC2 | Real isolated metrics per instance |

---

## Features

- Live CPU, memory, disk metrics updating every 5 seconds via WebSocket
- Historical charts with 1h / 6h / 24h time range selector
- Statistical anomaly detection — z-score on 20-point rolling window per metric per server
- Slack webhook alert when anomaly detected (warning: z > 2, critical: z > 3)
- HMAC-SHA256 signature verification on every agent payload — fake data dropped before DB
- Redis stream capped at 1000 entries — prevents memory exhaustion from rogue agents
- Batch writes to TimescaleDB every 5 seconds — prevents write bottleneck
- JWT-protected REST API and WebSocket connections
- Agents running on real separate EC2 instances — genuinely isolated metrics

---

## Project Structure

```
pulseops/
├── agent/
│   ├── collector.js       # reads /proc/stat, /proc/meminfo directly
│   ├── pusher.js          # HMAC signs payload, pushes to Redis Stream
│   ├── package.json
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── ingestion/
│   │   │   ├── consumer.ts    # XREADGROUP loop, HMAC verify, orchestrates pipeline
│   │   │   └── writer.ts      # in-memory buffer, batch writes to TimescaleDB
│   │   ├── anomaly/
│   │   │   └── zscore.ts      # rolling z-score detection, saves alert to DB
│   │   ├── alerts/
│   │   │   └── slackWebhook.ts
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── servers.ts  # LATERAL JOIN for efficient latest metric fetch
│   │   │   │   ├── metrics.ts  # historical range queries
│   │   │   │   ├── alerts.ts
│   │   │   │   └── auth.ts
│   │   │   └── middleware/
│   │   │       └── auth.ts
│   │   ├── sockets/
│   │   │   └── liveMetrics.ts  # Socket.io emit functions
│   │   ├── db/
│   │   │   ├── schema.sql      # TimescaleDB hypertable setup
│   │   │   └── client.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
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
git clone https://github.com/YiVibro/pulseops.git
cd pulseops
```

### 2. Start backend services

```bash
docker compose up --build
```

Starts: Redis, TimescaleDB, Express backend + consumer worker.

Wait for:
```
backend-1 | Backend running on port 4000
backend-1 | Consumer started, listening to stream...
```

### 3. Seed the database

```bash
docker exec -it <timescaledb-container> psql -U postgres -d devops_monitor
```

```sql
INSERT INTO servers (id, label, secret_hash) VALUES
('api-server-01', 'API Server', 'secret_api_server'),
('db-server-01', 'Database Server', 'secret_db_server')
ON CONFLICT DO NOTHING;
\q
```

### 4. Start agents

On each server you want to monitor:

```bash
export SERVER_ID=api-server-01
export SERVER_LABEL="API Server"
export REDIS_URL=redis://<backend-ip>:6379
export AGENT_SECRET=secret_api_server
nohup node pusher.js > agent.log 2>&1 &
```

### 5. Start frontend

```bash
cd frontend
# edit .env — set VITE_API_URL and VITE_WS_URL to your backend IP
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Login:**
| Field | Value |
|-------|-------|
| Email | `admin@monitor.com` |
| Password | `admin123` |

---

## Demo — Trigger a CPU Spike

SSH into a monitored server and run:

```bash
sudo apt-get install -y stress

# CPU spike for 60 seconds
stress --cpu 2 --timeout 60

# Memory spike
stress --vm 1 --vm-bytes 500M --timeout 60
```

Watch the server card turn critical on the dashboard and a Slack alert fire within 2 polling cycles (~10 seconds).

---

## Environment Variables

### Backend (docker-compose.yml)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL/TimescaleDB connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_EMAIL` | Dashboard login email |
| `ADMIN_PASSWORD` | Dashboard login password |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |
| `FRONTEND_URL` | Frontend origin for CORS |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend REST API base URL |
| `VITE_WS_URL` | Backend WebSocket URL |

### Agent (environment variables)

| Variable | Description |
|----------|-------------|
| `SERVER_ID` | Unique server identifier (must match servers table) |
| `SERVER_LABEL` | Display name on dashboard |
| `REDIS_URL` | Central Redis URL |
| `AGENT_SECRET` | HMAC secret (must match secret_hash in servers table) |
| `INTERVAL_MS` | Metrics push interval in ms (default: 5000) |

---

## Security

| Measure | Implementation |
|---------|---------------|
| HMAC-SHA256 payload signing | Every agent payload signed — unsigned data dropped before DB |
| Timing-safe HMAC comparison | `crypto.timingSafeEqual` prevents timing attacks |
| Redis MAXLEN cap | Stream capped at 1000 entries — prevents memory exhaustion |
| JWT authentication | All API endpoints and WebSocket connections protected |
| Non-root agent process | Agent reads `/proc` only — no system write access |
| TLS-ready | Configure Nginx + Let's Encrypt for production |

---

## Key Design Decisions

**Why Redis Streams over direct DB writes?**
Agents push to Redis (microsecond, in-memory) instead of directly to TimescaleDB. This decouples collection from storage — DB slowness never blocks agents, crashed consumers resume from where they left off via consumer groups, and multiple consumers can scale horizontally with Redis load-balancing.

**Why TimescaleDB over plain Postgres or InfluxDB?**
TimescaleDB adds automatic time-based partitioning on top of standard Postgres — range queries like "last 6 hours" only scan relevant partitions. Keeps SQL semantics and the Postgres ecosystem without InfluxDB's proprietary query language.

**Why z-score anomaly detection over ML?**
Simple, interpretable, no black-box. A rolling 20-point window adapts to each server's baseline automatically — a server that normally runs at 80% CPU won't false-alert, but one that normally runs at 5% will alert immediately on a spike to 40%.

**Why React + Vite over Next.js?**
Internal authenticated dashboard with no SEO requirements. Persistent WebSocket connections work cleanly with a standard SPA — Next.js serverless model adds unnecessary complexity for this use case.

---

## Scaling

| Concern | Solution |
|---------|----------|
| More agents | Redis handles concurrent XADD — just run more agents |
| More consumers | Redis consumer groups load-balance across instances |
| DB growth | TimescaleDB automatic compression + retention policies |
| Multi-server WebSocket | Add Redis pub/sub adapter to Socket.io |
| 1000+ servers | Shard TimescaleDB by server_id, run consumer cluster |

---

## License

MIT
