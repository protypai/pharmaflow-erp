import { Router } from 'express';
import { getCompanies, toggleCompany, approveCompany, updateSubscription, resetUserPassword, getActivityLogs, listCompanyUsers } from '../controllers/admin.controller';
import { protectAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate';
import { resetPasswordSchema } from '../validators/schemas';

const router = Router();

router.use(protectAdmin);
router.get('/companies', getCompanies);
router.get('/companies/:id/users', listCompanyUsers);
router.post('/companies/:id/approve', approveCompany);
router.patch('/companies/:id/toggle', toggleCompany);
router.patch('/companies/:id/subscription', updateSubscription);
router.post('/reset-password', validate(resetPasswordSchema), resetUserPassword);
router.get('/activity-logs', getActivityLogs);

export default router;
