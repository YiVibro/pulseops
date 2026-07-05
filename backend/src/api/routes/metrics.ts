import { Router } from 'express';
import type {Request, Response} from 'express';
import pool from '../../db/client.js';

const router = Router();

// GET /api/metrics/:serverId?range=1h
// router.get('/:serverId', async (req: Request, res: Response) => {
//   const { serverId } = req.params;
//   const range = (req.query.range as string) || '1h';

//   const intervalMap: Record<string, string> = {
//     '1h': '1 hour',
//     '6h': '6 hours',
//     '24h': '24 hours',
//   };

//   const interval = intervalMap[range] || '1 hour';

//   try {
//     const result = await pool.query(
//       `SELECT time, cpu, memory, disk
//        FROM metrics
//        WHERE server_id = $1
//          AND time >= NOW() - INTERVAL '${interval}'
//        ORDER BY time ASC`,
//       [serverId]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch metrics' });
//   }
// });
router.get('/:serverId', async (req, res) => {
  const { serverId } = req.params;
  const range = (req.query.range as string) || '1h';
  const intervalMap: Record<string, string> = { '1h': '1 hour', '6h': '6 hours', '24h': '24 hours' };
  const interval = intervalMap[range] || '1 hour';

  try {
    const [metricsRes, serverRes] = await Promise.all([
      pool.query(
        `SELECT EXTRACT(EPOCH FROM time)*1000 as timestamp, cpu, memory, disk
         FROM metrics WHERE server_id = $1 AND time >= NOW() - INTERVAL '${interval}'
         ORDER BY time ASC`,
        [serverId]
      ),
      pool.query(`SELECT label as name FROM servers WHERE id = $1`, [serverId])
    ]);
    res.json({
      metrics: metricsRes.rows,
      name: serverRes.rows[0]?.name || serverId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});


// GET /api/metrics/:serverId/latest
router.get('/:serverId/latest', async (req: Request, res: Response) => {
  const { serverId } = req.params;
  try {
    const result = await pool.query(
      `SELECT time, cpu, memory, disk
       FROM metrics
       WHERE server_id = $1
       ORDER BY time DESC
       LIMIT 1`,
      [serverId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch latest metric' });
  }
});

export default router;