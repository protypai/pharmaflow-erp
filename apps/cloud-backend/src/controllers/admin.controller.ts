import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { db } from '../config/database';
import bcrypt from 'bcryptjs';

export const getCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await db.company.findMany({
    select: {
      id: true, name: true, city: true, state: true,
      subscriptionStatus: true, subscriptionExpiry: true,
      isActive: true, createdAt: true,
      _count: { select: { sales: true, purchases: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, companies, 'Companies fetched');
});

export const toggleCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const company = await db.company.findUnique({ where: { id } });
  if (!company) return res.status(404).json({ success: false, message: 'Not found' });
  const updated = await db.company.update({
    where: { id },
    data: { isActive: !company.isActive },
  });
  sendSuccess(res, updated, `Company ${updated.isActive ? 'activated' : 'deactivated'}`);
});

export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { subscriptionStatus, expiryDays } = req.body;
  const company = await db.company.findUnique({ where: { id } });
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (expiryDays || 365));

  const updated = await db.company.update({
    where: { id },
    data: {
      subscriptionStatus: subscriptionStatus || 'active',
      subscriptionExpiry: expiry,
      isActive: subscriptionStatus !== 'inactive',
    },
  });

  sendSuccess(res, updated, 'Subscription updated successfully');
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, newPassword } = req.body;
  const hash = await bcrypt.hash(newPassword, 12);
  await db.user.updateMany({
    where: { companyId },
    data: { passwordHash: hash },
  });
  sendSuccess(res, null, 'Password reset for all users in company');
});

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, limit = '50' } = req.query;
  const logs = await db.syncQueue.findMany({
    where: companyId ? { companyId: companyId as string } : {},
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    select: {
      id: true, companyId: true, tableName: true,
      operation: true, deviceId: true, appVersion: true,
      isSynced: true, syncedAt: true, createdAt: true,
    },
  });
  sendSuccess(res, logs, 'Activity logs');
});
