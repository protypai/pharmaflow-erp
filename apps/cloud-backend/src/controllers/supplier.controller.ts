import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { supplierService } from '../services/supplier.service';

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const supplier = await supplierService.createSupplier(companyId, req.body);
  sendSuccess(res, supplier, 'Supplier created', 201);
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;
  const supplier = await supplierService.updateSupplier(companyId, id, req.body);
  sendSuccess(res, supplier, 'Supplier updated');
});

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { search } = req.query;
  const suppliers = await supplierService.listSuppliers(companyId, {
    search: search as string,
  });
  sendSuccess(res, suppliers, 'Suppliers fetched');
});

export const getSupplierById = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;
  const supplier = await supplierService.getSupplierById(companyId, id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  sendSuccess(res, supplier, 'Supplier details');
});
