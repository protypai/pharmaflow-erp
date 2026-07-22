import { Router } from 'express';
import { createReceipt, createPayment, createJournal, getCustomerLedger, getSupplierLedger } from '../controllers/account.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/receipts', createReceipt);
router.post('/payments', createPayment);
router.post('/journals', createJournal);
router.get('/customer-ledger/:customerId', getCustomerLedger);
router.get('/supplier-ledger/:supplierId', getSupplierLedger);

export default router;
