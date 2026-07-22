import { Router } from 'express';
import { getSalesReport, getPurchaseReport, getStockReport, getGstReport } from '../controllers/report.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/stock', getStockReport);
router.get('/gst', getGstReport);

export default router;
