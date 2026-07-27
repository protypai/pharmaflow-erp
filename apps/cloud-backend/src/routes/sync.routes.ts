import { Router } from 'express';
import { pushSync, getSyncStatus, getInitialSyncData, saveSyncHealth } from '../controllers/sync.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.post('/push', pushSync);
router.get('/status', getSyncStatus);
router.get('/initial', getInitialSyncData);
router.post('/health', saveSyncHealth);

export default router;

