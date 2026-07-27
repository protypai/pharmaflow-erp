import { Router } from 'express';
import { createSupplier, updateSupplier, listSuppliers, getSupplierById } from '../controllers/supplier.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { supplierCreateSchema, supplierUpdateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/', validate(supplierCreateSchema), createSupplier);
router.get('/', listSuppliers);
router.get('/:id', getSupplierById);
router.put('/:id', validate(supplierUpdateSchema), updateSupplier);

export default router;
