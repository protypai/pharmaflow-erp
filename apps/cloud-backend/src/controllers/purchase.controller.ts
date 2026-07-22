import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { purchaseService } from '../services/purchase.service';

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const purchase = await purchaseService.createPurchase(companyId, req.body);
  sendSuccess(res, purchase, 'Purchase created', 201);
});

export const listPurchases = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { supplierId, startDate, endDate } = req.query;
  const purchases = await purchaseService.listPurchases(companyId, {
    supplierId: supplierId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  sendSuccess(res, purchases, 'Purchases fetched');
});

export const getPurchaseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const purchase = await purchaseService.getPurchaseById(id);
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
  sendSuccess(res, purchase, 'Purchase details');
});
