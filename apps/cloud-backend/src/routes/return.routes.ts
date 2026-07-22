import { Router } from 'express';
import { createPurchaseReturn, createSaleReturn, listPurchaseReturns, listSaleReturns } from '../controllers/return.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/purchase', createPurchaseReturn);
router.post('/sale', createSaleReturn);
router.get('/purchase', listPurchaseReturns);
router.get('/sale', listSaleReturns);

export default router;
