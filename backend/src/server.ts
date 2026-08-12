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
import generateToken from './api/routes/token.js';

const app = express();
const httpServer = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// routes
app.use('/api/auth', authRouter);
app.use('/api/metrics',  metricsRouter);//authMiddleware,
app.use('/api/alerts',  alertsRouter);//authMiddleware,
app.use('/api/servers', ServerRouter);
app.use('/api/generate-setup-token', generateToken);

// init socket
initSocket(httpServer);

// start consumer in background
consumeLoop().catch(console.error);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT,() => {
  console.log(`Backend running on port ${PORT}`);
});