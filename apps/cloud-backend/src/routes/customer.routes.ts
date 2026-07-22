import { Router } from 'express';
import { createCustomer, updateCustomer, listCustomers, getCustomerById } from '../controllers/customer.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/', createCustomer);
router.get('/', listCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

export default router;
