import { Router } from 'express';
import { createStockAdjustment, listStockAdjustments } from '../controllers/stockAdjustment.controller';
import { protect, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { stockAdjustmentCreateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
// Stock adjustments directly override inventory, so restrict creation to admins.
router.post('/', requireRole('admin'), validate(stockAdjustmentCreateSchema), createStockAdjustment);
router.get('/', listStockAdjustments);

export default router;
