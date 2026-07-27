import { Router } from 'express';
import { createReceipt, createPayment, createJournal, getCustomerLedger, getSupplierLedger } from '../controllers/account.controller';
import { protect, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { receiptCreateSchema, paymentCreateSchema, journalCreateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/receipts', validate(receiptCreateSchema), createReceipt);
router.post('/payments', validate(paymentCreateSchema), createPayment);
// Journal vouchers are manual accounting adjustments — restrict to admins.
router.post('/journals', requireRole('admin'), validate(journalCreateSchema), createJournal);
router.get('/customer-ledger/:customerId', getCustomerLedger);
router.get('/supplier-ledger/:supplierId', getSupplierLedger);

export default router;
