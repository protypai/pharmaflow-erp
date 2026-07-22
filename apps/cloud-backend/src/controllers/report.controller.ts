import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { reportService } from '../services/report.service';

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate } = req.query;
  const report = await reportService.getSalesReport(
    companyId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  sendSuccess(res, report, 'Sales report generated');
});

export const getPurchaseReport = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate } = req.query;
  const report = await reportService.getPurchaseReport(
    companyId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  sendSuccess(res, report, 'Purchase report generated');
});

export const getStockReport = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const report = await reportService.getStockReport(companyId);
  sendSuccess(res, report, 'Stock report generated');
});

export const getGstReport = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate } = req.query;
  const report = await reportService.getGstReport(
    companyId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  sendSuccess(res, report, 'GST report generated');
});
