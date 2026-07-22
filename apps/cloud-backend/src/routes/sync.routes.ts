import { Router } from 'express';
import { pushSync, getSyncStatus } from '../controllers/sync.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/push', pushSync);
router.get('/status', getSyncStatus);

export default router;
