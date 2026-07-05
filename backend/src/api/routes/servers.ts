// backend/src/api/routes/servers.ts
import { Router } from 'express';
import pool from '../../db/client.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, label as name FROM servers ORDER BY created_at ASC`
    );
    // attach latest metric + status to each server
    const servers = await Promise.all(result.rows.map(async (server) => {
      const latest = await pool.query(
        `SELECT cpu, memory, disk, time as timestamp FROM metrics
         WHERE server_id = $1 ORDER BY time DESC LIMIT 1`,
        [server.id]
      );
      const m = latest.rows[0] || { cpu: 0, memory: 0, disk: 0, timestamp: Date.now() };
      let status = 'healthy';
      if (m.cpu > 90 || m.memory > 90) status = 'critical';
      else if (m.cpu > 75 || m.memory > 75) status = 'warning';
      return { id: server.id, name: server.name, status, history: [m] };
    }));
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

export default router;