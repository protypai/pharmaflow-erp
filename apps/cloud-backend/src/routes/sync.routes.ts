import { Router } from 'express';
import { pushSync, getSyncStatus, getSyncChanges, getInitialSyncData, saveSyncHealth } from '../controllers/sync.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { syncPushSchema } from '../validators/schemas';

const router = Router();

router.use(protect);
router.post('/push', validate(syncPushSchema), pushSync);
router.get('/changes', getSyncChanges);
router.get('/status', getSyncStatus);
router.get('/initial', getInitialSyncData);
router.post('/health', saveSyncHealth);

export default router;
