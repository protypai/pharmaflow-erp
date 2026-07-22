import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { customerService } from '../services/customer.service';

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const customer = await customerService.createCustomer(companyId, req.body);
  sendSuccess(res, customer, 'Customer created', 201);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await customerService.updateCustomer(id, req.body);
  sendSuccess(res, customer, 'Customer updated');
});

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { search, type } = req.query;
  const customers = await customerService.listCustomers(companyId, {
    search: search as string,
    type: type as string,
  });
  sendSuccess(res, customers, 'Customers fetched');
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await customerService.getCustomerById(id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  sendSuccess(res, customer, 'Customer details');
});
