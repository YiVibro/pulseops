import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocket } from './sockets/liveMetrics.js';
import { consumeLoop } from './ingestion/consumer.js';
import metricsRouter from './api/routes/metrics.js';
import alertsRouter from './api/routes/alerts.js';
import authRouter from './api/routes/auth.js';
import { authMiddleware } from './api/middleware/auth.js';
import ServerRouter from './api/routes/servers.js';

const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// routes
app.use('/api/auth', authRouter);
app.use('/api/metrics', authMiddleware, metricsRouter);
app.use('/api/alerts', authMiddleware, alertsRouter);
app.use('/api/servers', ServerRouter);

// init socket
initSocket(httpServer);

// start consumer in background
consumeLoop().catch(console.error);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});