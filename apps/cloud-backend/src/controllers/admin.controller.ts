import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import { logActivity, listActivityLogs } from '../services/activityLog.service';

/**
 * Resolve the acting super admin (id + email) from the verified admin token.
 * Best-effort: never throws — used only to enrich audit-log entries.
 */
const resolveActor = async (req: Request): Promise<{ id?: string; email?: string }> => {
  const adminId = req.admin?.adminId;
  if (!adminId) return {};
  try {
    const admin = await db.superAdmin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true },
    });
    return { id: admin?.id ?? adminId, email: admin?.email };
  } catch {
    return { id: adminId };
  }
};

// Map the frontend Activity Logs filter values to concrete audit actions.
const ACTIVITY_FILTER_MAP: Record<string, string[]> = {
  login: ['admin.login', 'auth.login'],
  company: ['company.approve', 'company.toggle', 'company.subscription', 'company.resync_requested'],
  password: ['user.password_reset'],
  // Failures & errors — one place to review everything that went wrong.
  errors: ['admin.login_failed', 'auth.login_failed', 'sync.failed', 'sync.rejected', 'sync.partial', 'backup.failed'],
  // Backups — every cloud backup (success + failure) per store, with error detail.
  backups: ['backup.synced', 'backup.completed', 'backup.failed', 'sync.rejected', 'sync.failed', 'sync.partial'],
};

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
      },
      clientSyncHealth: {
        select: {
          id: true, deviceId: true, deviceName: true,
          appVersion: true, lastSyncTime: true, lastSuccessSync: true,
          status: true, errorMessage: true, pendingRecords: true,
          osPlatform: true, updatedAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const companiesWithSyncStats = await Promise.all(companies.map(async (c: any) => {
    const unsyncedCount = await db.syncQueue.count({
      where: { companyId: c.id, isSynced: false }
    });
    const latestSync = c.syncQueue[0] || null;
    // Most-recently-active device → its reported app version (to spot old builds).
    const latestDevice = (c.clientSyncHealth || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.lastSyncTime || 0).getTime() - new Date(a.lastSyncTime || 0).getTime())[0] || null;
    return {
      id: c.id,
      name: c.name,
      appVersion: latestDevice?.appVersion || null,
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
      devices: c.clientSyncHealth || [],
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
    data: {
      isActive: !company.isActive,
      subscriptionStatus: !company.isActive ? 'active' : 'inactive',
    },
  });

  const actor = await resolveActor(req);
  await logActivity({
    companyId: updated.id,
    actorType: 'superadmin',
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'company.toggle',
    targetType: 'company',
    targetId: updated.id,
    detail: `${updated.name} ${updated.isActive ? 'activated' : 'deactivated'}`,
    ipAddress: req.ip,
  });

  sendSuccess(res, updated, `Company ${updated.isActive ? 'activated' : 'deactivated'}`);
});

export const approveCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const company = await db.company.findUnique({ where: { id } });
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

  const updatedCompany = await db.company.update({
    where: { id },
    data: {
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionExpiry: null,
    },
  });

  // Activate all users under this company
  await db.user.updateMany({
    where: { companyId: id },
    data: { isActive: true },
  });

  const actor = await resolveActor(req);
  await logActivity({
    companyId: updatedCompany.id,
    actorType: 'superadmin',
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'company.approve',
    targetType: 'company',
    targetId: updatedCompany.id,
    detail: `${updatedCompany.name} approved & activated`,
    ipAddress: req.ip,
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

  const actor = await resolveActor(req);
  await logActivity({
    companyId: updated.id,
    actorType: 'superadmin',
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'company.subscription',
    targetType: 'company',
    targetId: updated.id,
    detail: `${updated.name} subscription set to '${updated.subscriptionStatus}' (expires ${expiry.toISOString().slice(0, 10)})`,
    ipAddress: req.ip,
  });

  sendSuccess(res, updated, 'Subscription updated successfully');
});

export const listCompanyUsers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const users = await db.user.findMany({
    where: { companyId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true },
  });
  sendSuccess(res, users, 'Company users');
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, newPassword, userId, email } = req.body as {
    companyId: string;
    newPassword: string;
    userId?: string;
    email?: string;
  };

  // Server-side guard (defence-in-depth; the route also runs the zod validator).
  if (!companyId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'companyId and a newPassword of at least 6 characters are required',
    });
  }

  // Resolve exactly ONE target user. Never touch other users in the company.
  let target;
  if (userId) {
    target = await db.user.findFirst({ where: { id: userId, companyId } });
  } else if (email) {
    target = await db.user.findFirst({ where: { email, companyId } });
  } else {
    // Default: the company's primary admin (earliest-created admin user).
    target = await db.user.findFirst({
      where: { companyId, role: 'admin' },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!target) {
    return res.status(404).json({
      success: false,
      message: 'No matching user found for this company',
    });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: target.id }, data: { passwordHash: hash } });

  const actor = await resolveActor(req);
  await logActivity({
    companyId,
    actorType: 'superadmin',
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: target.id,
    detail: `Password reset for ${target.email}`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { email: target.email }, `Password reset for ${target.email}`);
});

// Super Admin requests that a company's devices un-park (retry) their
// dead-lettered sync records — e.g. after a fix is deployed. Devices pick this up
// on their next sync-health ping and re-push the parked records.
export const requestResync = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const company = await db.company.update({
    where: { id },
    data: { resyncRequestedAt: new Date() },
  });
  const actor = await resolveActor(req);
  await logActivity({
    companyId: id, actorType: 'superadmin', actorId: actor.id, actorEmail: actor.email,
    action: 'company.resync_requested', targetType: 'company', targetId: id,
    detail: `Re-sync requested for ${company.name} — devices will retry parked records`,
    ipAddress: req.ip,
  });
  sendSuccess(res, { resyncRequestedAt: company.resyncRequestedAt }, 'Re-sync requested — devices will retry on next sync');
});

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, action, limit } = req.query as {
    companyId?: string;
    action?: string;
    limit?: string;
  };

  // The frontend sends category values (login/company/password) or an exact action.
  // Map categories to their concrete action list; pass an exact action through as-is.
  let actions: string[] | undefined;
  if (action && action !== 'all') {
    actions = ACTIVITY_FILTER_MAP[action] || [action];
  }

  const parsedLimit = limit ? parseInt(limit, 10) : 200;

  const logs = await listActivityLogs({
    companyId: companyId || undefined,
    action: actions,
    limit: Number.isFinite(parsedLimit) ? parsedLimit : 200,
  });

  sendSuccess(res, logs, 'Activity logs');
});
