import { Router } from 'express';
import { createPurchase, listPurchases, getPurchaseById } from '../controllers/purchase.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/', createPurchase);
router.get('/', listPurchases);
router.get('/:id', getPurchaseById);

export default router;
