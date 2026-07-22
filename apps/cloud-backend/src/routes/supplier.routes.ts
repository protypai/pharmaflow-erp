import { Router } from 'express';
import { createSupplier, updateSupplier, listSuppliers, getSupplierById } from '../controllers/supplier.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/', createSupplier);
router.get('/', listSuppliers);
router.get('/:id', getSupplierById);
router.put('/:id', updateSupplier);

export default router;
