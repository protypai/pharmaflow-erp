import { db } from '../config/database';
import { logger } from '../utils/logger';

export interface LogActivityData {
  companyId?: string | null;
  actorType: string; // 'superadmin' | 'user'
  actorId?: string | null;
  actorEmail?: string | null;
  action: string; // 'admin.login' | 'auth.login' | 'company.approve' | ...
  targetType?: string | null;
  targetId?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
}

/**
 * Best-effort audit write. NEVER throws into the request path — a failure to
 * record an audit event must not break the action that triggered it.
 */
export const logActivity = async (data: LogActivityData): Promise<void> => {
  try {
    await db.activityLog.create({
      data: {
        companyId: data.companyId ?? null,
        actorType: data.actorType,
        actorId: data.actorId ?? null,
        actorEmail: data.actorEmail ?? null,
        action: data.action,
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
        detail: data.detail ?? null,
        ipAddress: data.ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error(`Failed to write activity log (${data.action}): ${err}`);
  }
};

/**
 * True if an event with this action already exists for the company within the
 * last `withinMinutes`. Used to throttle repetitive failure logs (e.g. a client
 * that reports a sync failure every 5 minutes) so the audit trail isn't flooded.
 */
export const hasRecentActivity = async (
  companyId: string | null | undefined,
  action: string,
  withinMinutes: number,
): Promise<boolean> => {
  try {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    const found = await db.activityLog.findFirst({
      where: { action, companyId: companyId ?? null, createdAt: { gte: since } },
      select: { id: true },
    });
    return !!found;
  } catch {
    return false;
  }
};

export interface ListActivityLogsParams {
  action?: string | string[];
  companyId?: string;
  limit?: number;
}

/**
 * Return recent audit events, newest first. `action` may be a single action or a
 * list (matched with IN). Supports an optional company scope. Defaults to the 200
 * most recent events.
 */
export const listActivityLogs = async (params: ListActivityLogsParams = {}) => {
  const { action, companyId, limit = 200 } = params;
  const actionFilter = Array.isArray(action) ? { in: action } : action;
  return db.activityLog.findMany({
    where: {
      ...(action ? { action: actionFilter } : {}),
      ...(companyId ? { companyId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
