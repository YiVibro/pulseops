import { type Request,type Response,type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type token=string;

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token:string | undefined = header?.split(' ')[1];
  
  if(!token){
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}