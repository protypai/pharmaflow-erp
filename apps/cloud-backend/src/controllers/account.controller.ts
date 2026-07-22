import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { accountService } from '../services/account.service';

export const createReceipt = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const receipt = await accountService.createReceipt(companyId, req.body);
  sendSuccess(res, receipt, 'Receipt created', 201);
});

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const payment = await accountService.createPayment(companyId, req.body);
  sendSuccess(res, payment, 'Payment created', 201);
});

export const createJournal = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const journal = await accountService.createJournal(companyId, req.body);
  sendSuccess(res, journal, 'Journal created', 201);
});

export const getCustomerLedger = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { customerId } = req.params;
  const { startDate, endDate } = req.query;
  const ledger = await accountService.getCustomerLedger(
    companyId,
    customerId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  sendSuccess(res, ledger, 'Customer ledger fetched');
});

export const getSupplierLedger = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { supplierId } = req.params;
  const { startDate, endDate } = req.query;
  const ledger = await accountService.getSupplierLedger(
    companyId,
    supplierId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  sendSuccess(res, ledger, 'Supplier ledger fetched');
});
