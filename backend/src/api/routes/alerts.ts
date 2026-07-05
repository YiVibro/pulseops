import { Router, type Request,type Response } from 'express';
import pool from '../../db/client.js';

const router = Router();

// GET /api/alerts?serverId=server-01&limit=20
router.get('/', async (req: Request, res: Response) => {
  const { serverId, limit } = req.query;
  const limitNum = parseInt(limit as string) || 20;

  try {
    const result = await pool.query(
      `SELECT id, server_id, metric, value, severity, message, created_at
       FROM alerts
       ${serverId ? 'WHERE server_id = $1' : ''}
       ORDER BY created_at DESC
       LIMIT ${serverId ? '$2' : '$1'}`,
      serverId ? [serverId, limitNum] : [limitNum]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;