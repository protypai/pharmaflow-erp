import { Router } from 'express';
import { getCompanies, toggleCompany, updateSubscription, resetUserPassword, getActivityLogs } from '../controllers/admin.controller';
import { protectAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.use(protectAdmin);
router.get('/companies', getCompanies);
router.patch('/companies/:id/toggle', toggleCompany);
router.patch('/companies/:id/subscription', updateSubscription);
router.post('/reset-password', resetUserPassword);
router.get('/activity-logs', getActivityLogs);

export default router;
