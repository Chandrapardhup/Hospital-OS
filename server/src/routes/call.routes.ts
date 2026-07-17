import { Router } from 'express';
import { CallController } from '../controllers/call.controller';

const router = Router();
const callController = new CallController();

router.post('/start', callController.startCall);
router.post('/webhook', callController.handleWebhook);
router.post('/ivr', callController.handleIVR);
router.get('/history/:patientId', callController.getCallHistory);

export default router;
