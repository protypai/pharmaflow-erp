import { Router } from 'express';
import { createSale, listSales, getSaleById } from '../controllers/sales.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/', createSale);
router.get('/', listSales);
router.get('/:id', getSaleById);

export default router;
