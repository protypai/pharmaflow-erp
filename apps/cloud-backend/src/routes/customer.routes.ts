import { Router } from 'express';
import { createCustomer, updateCustomer, listCustomers, getCustomerById } from '../controllers/customer.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { customerCreateSchema, customerUpdateSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/', validate(customerCreateSchema), createCustomer);
router.get('/', listCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', validate(customerUpdateSchema), updateCustomer);

export default router;
