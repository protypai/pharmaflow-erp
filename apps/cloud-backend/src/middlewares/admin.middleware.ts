import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      admin?: { adminId: string; role: string };
    }
  }
}

export const protectAdmin = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new AppError('No token', 401);
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    if (decoded.role !== 'superadmin') throw new AppError('Not authorized', 403);
    req.admin = decoded;
    next();
  } catch {
    next(new AppError('Invalid admin token', 401));
  }
};
