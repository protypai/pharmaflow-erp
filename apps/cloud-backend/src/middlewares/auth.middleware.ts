import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { db } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; companyId: string; role: string };
    }
  }
}

export const protect = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);
    req.user = { id: user.id, companyId: user.companyId, role: user.role };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};
