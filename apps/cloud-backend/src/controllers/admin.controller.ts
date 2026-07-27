import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { db } from '../config/database';
import bcrypt from 'bcryptjs';

export const getCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await db.company.findMany({
    select: {
      id: true, name: true, city: true, state: true,
      gstin: true, phone: true, email: true, address: true,
      subscriptionStatus: true, subscriptionExpiry: true,
      isActive: true, createdAt: true,
      _count: { select: { sales: true, purchases: true, syncQueue: true } },
      syncQueue: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, isSynced: true, syncError: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const companiesWithSyncStats = await Promise.all(companies.map(async (c) => {
    const unsyncedCount = await db.syncQueue.count({
      where: { companyId: c.id, isSynced: false }
    });
    const latestSync = c.syncQueue[0] || null;
    return {
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      gstin: c.gstin,
      phone: c.phone,
      email: c.email,
      address: c.address,
      subscriptionStatus: c.subscriptionStatus,
      subscriptionExpiry: c.subscriptionExpiry,
      isActive: c.isActive,
      createdAt: c.createdAt,
      salesCount: c._count.sales,
      purchasesCount: c._count.purchases,
      totalSyncCount: c._count.syncQueue,
      unsyncedCount,
      lastBackup: latestSync ? latestSync.createdAt : null,
      lastSyncSynced: latestSync ? latestSync.isSynced : null,
      lastSyncError: latestSync ? latestSync.syncError : null,
    };
  }));

  sendSuccess(res, companiesWithSyncStats, 'Companies fetched');
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

export const approveCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const company = await db.company.findUnique({ where: { id } });
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 14);

  const updatedCompany = await db.company.update({
    where: { id },
    data: {
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionExpiry: trialExpiry,
    },
  });

  // Activate all users under this company
  await db.user.updateMany({
    where: { companyId: id },
    data: { isActive: true },
  });

  sendSuccess(res, updatedCompany, 'Company and users approved and activated successfully');
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
      company: { select: { name: true } }
    },
  });
  sendSuccess(res, logs, 'Activity logs');
});
