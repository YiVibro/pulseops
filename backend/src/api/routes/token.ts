import { Router} from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// In-Memory store for active setup tokens with expiration timestamps
// (In production, replace this map with Redis: `await redis.set(token, 'active', 'EX', 900)`)
export const activeSetupTokens = new Map<string, number>();

router.post('/generate-setup-token', (req: Request, res: Response) => {
  // 1. Generate a cryptographically secure 16-character hex token
  const setupToken = `vtx_${crypto.randomBytes(8).toString('hex')}`;
  
  // 2. Set Expiration: 15 minutes from now
  const ttlMs = 15 * 60 * 1000;
  const expiresAt = Date.now() + ttlMs;

  activeSetupTokens.set(setupToken, expiresAt);

  console.log(`[SECURITY] Issued single-use token: ${setupToken} (Expires in 15 mins)`);

  // 3. Return the token and pre-formatted one-liner command to the React frontend
  res.status(201).json({
    setupToken,
    expiresAt,
    command: `curl -sSL http://localhost:5000/install.sh | bash -s -- "${setupToken}"`
  });
});

export default router;