import pool from '../db/client.js';

interface Metric {
  serverId: string;
  cpu: number;
  memory: number;
  disk: number;
  timestamp: number;
}

// Buffer metrics and batch write every 5 seconds
// prevents hammering TimescaleDB with individual inserts
const buffer: Metric[] = [];
let flushTimer: NodeJS.Timeout | null = null;

async function flushBuffer() {
  if (buffer.length === 0) return;
  const toWrite = buffer.splice(0, buffer.length); // drain buffer

  const values: any[] = [];
  const placeholders = toWrite.map((m, i) => {
    const base = i * 5;
    values.push(
      new Date(m.timestamp),
      m.serverId,
      m.cpu,
      m.memory,
      m.disk
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  const query = `
    INSERT INTO metrics (time, server_id, cpu, memory, disk)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT DO NOTHING
  `;

  try {
    await pool.query(query, values);
    console.log(`Flushed ${toWrite.length} metrics to TimescaleDB`);
  } catch (err) {
    console.error('Flush failed:', err);
    // put them back if write failed
    buffer.unshift(...toWrite);
  }
}

// Start flush interval once
setInterval(flushBuffer, 5000);

export async function writeMetric(metric: Metric) {
  buffer.push(metric);
}