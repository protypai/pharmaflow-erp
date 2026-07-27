import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { stockAdjustmentService } from '../services/stockAdjustment.service';

export const createStockAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const adjustment = await stockAdjustmentService.createStockAdjustment(companyId, req.body);
  sendSuccess(res, adjustment, 'Stock adjustment created', 201);
});

export const listStockAdjustments = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const adjustments = await stockAdjustmentService.listStockAdjustments(companyId);
  sendSuccess(res, adjustments, 'Stock adjustments fetched');
});
