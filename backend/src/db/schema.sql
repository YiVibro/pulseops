CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS servers (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  secret_hash VARCHAR(255) NOT NULL, -- store HMAC secret hashed, not plaintext
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  time TIMESTAMPTZ NOT NULL,
  server_id VARCHAR(50) NOT NULL REFERENCES servers(id),
  cpu DOUBLE PRECISION,
  memory DOUBLE PRECISION,
  disk DOUBLE PRECISION
);

-- Convert metrics to hypertable (TimescaleDB magic)
SELECT create_hypertable('metrics', 'time', if_not_exists => TRUE);

-- Index for fast per-server queries
CREATE INDEX IF NOT EXISTS idx_metrics_server_time ON metrics (server_id, time DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  server_id VARCHAR(50) NOT NULL REFERENCES servers(id),
  metric VARCHAR(20) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  severity VARCHAR(10) NOT NULL, -- 'warning' | 'critical'
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);