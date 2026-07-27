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
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  let payload: { userId: string };
  try {
    payload = verifyAccessToken(authHeader.split(' ')[1]);
  } catch {
    // Token missing/expired/invalid — client should try a refresh.
    return next(new AppError('Invalid or expired token', 401));
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { company: true },
  });
  if (!user) return next(new AppError('Invalid or expired token', 401));

  // Account disabled (user or their company deactivated by Super Admin).
  // Distinct 403 + code so the desktop can force a logout instead of retrying.
  if (!user.isActive || !user.company || !user.company.isActive) {
    return next(new AppError('Your account has been deactivated. Contact administrator.', 403, 'ACCOUNT_DISABLED'));
  }

  req.user = { id: user.id, companyId: user.companyId, role: user.role };
  next();
};

/**
 * Role-based access guard. Must run AFTER `protect` (which populates req.user).
 * Usage: router.post('/', protect, requireRole('admin'), handler)
 * Role values come from the Prisma UserRole enum (currently: 'admin' | 'staff').
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
