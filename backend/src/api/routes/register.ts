import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { activeSetupTokens } from './token.js';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { setupToken, hostname, ipAddress } = req.body;

  // 1. Check if token exists
  const expiresAt = activeSetupTokens.get(setupToken);

  if (!expiresAt) {
    console.warn(`[REGISTRATION BLOCKED] Invalid or already-used token attempted: ${setupToken}`);
    return res.status(401).json({ error: 'Access Denied: Invalid or expired setup token.' });
  }

  // 2. Check if token has expired
  if (Date.now() > expiresAt) {
    activeSetupTokens.delete(setupToken); // Clean up expired key
    console.warn(`[REGISTRATION BLOCKED] Expired setup token attempted: ${setupToken}`);
    return res.status(401).json({ error: 'Access Denied: Setup token has expired.' });
  }

  // 3. 🛡️ SINGLE-USE ENFORCEMENT: Instantly invalidate the token so it can never be used again
  activeSetupTokens.delete(setupToken);

  // 4. Generate permanent agent secret
  const agentId = `node-${hostname}-${crypto.randomBytes(3).toString('hex')}`;
  const permanentAgentToken = `vat_${crypto.randomBytes(24).toString('hex')}`;

  console.log(`[SUCCESS] Registered node ${agentId} using single-use token ${setupToken}`);

  return res.status(201).json({
    status: 'success',
    agentId,
    agentToken: permanentAgentToken
  });
});

export default router;