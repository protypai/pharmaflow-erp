import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { returnService } from '../services/return.service';

export const createPurchaseReturn = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const result = await returnService.createPurchaseReturn(companyId, req.body);
  sendSuccess(res, result, 'Purchase return created', 201);
});

export const createSaleReturn = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const result = await returnService.createSaleReturn(companyId, req.body);
  sendSuccess(res, result, 'Sale return created', 201);
});

export const listPurchaseReturns = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const returns = await returnService.listPurchaseReturns(companyId);
  sendSuccess(res, returns, 'Purchase returns fetched');
});

export const listSaleReturns = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const returns = await returnService.listSaleReturns(companyId);
  sendSuccess(res, returns, 'Sale returns fetched');
});
