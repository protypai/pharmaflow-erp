import { Router } from 'express';
import { createPurchase, listPurchases, getPurchaseById } from '../controllers/purchase.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { purchaseCreateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/', validate(purchaseCreateSchema), createPurchase);
router.get('/', listPurchases);
router.get('/:id', getPurchaseById);

export default router;
