import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { salesService } from '../services/sales.service';

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const sale = await salesService.createSale(companyId, req.body);
  sendSuccess(res, sale, 'Sale invoice created', 201);
});

export const listSales = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { customerId, startDate, endDate } = req.query;
  const sales = await salesService.listSales(companyId, {
    customerId: customerId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  sendSuccess(res, sales, 'Sales fetched');
});

export const getSaleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sale = await salesService.getSaleById(id);
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
  sendSuccess(res, sale, 'Sale details');
});
