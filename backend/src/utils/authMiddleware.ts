import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './data-source';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const payload: any = jwt.verify(token, JWT_SECRET);
    // Ensure the user still exists and is active
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: payload.id, active: true } });
    if (!user) return res.status(401).json({ error: 'User not found or inactive' });
    (req as any).user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
