import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { processSyncQueue } from '../services/sync.service';

export const pushSync = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'items must be an array' });
  }
  const result = await processSyncQueue(companyId, items);
  sendSuccess(res, result, `Sync complete: ${result.success} succeeded, ${result.failed} failed`);
});

export const getSyncStatus = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const pending = await (req.app.locals.db?.syncQueue?.count({
    where: { companyId, isSynced: false },
  }) ?? 0);
  sendSuccess(res, { pending }, 'Sync status');
});
