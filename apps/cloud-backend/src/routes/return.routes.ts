import { Router } from 'express';
import { createPurchaseReturn, createSaleReturn, listPurchaseReturns, listSaleReturns } from '../controllers/return.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { purchaseReturnCreateSchema, saleReturnCreateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/purchase', validate(purchaseReturnCreateSchema), createPurchaseReturn);
router.post('/sale', validate(saleReturnCreateSchema), createSaleReturn);
router.get('/purchase', listPurchaseReturns);
router.get('/sale', listSaleReturns);

export default router;
