import { Router } from 'express';
import { createSale, listSales, getSaleById } from '../controllers/sales.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { saleCreateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/', validate(saleCreateSchema), createSale);
router.get('/', listSales);
router.get('/:id', getSaleById);

export default router;
