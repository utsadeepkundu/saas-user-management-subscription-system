import express from 'express';
import {
  getSubscription,
  upgradePlan,
  downgradePlan,
  cancelSubscription,
  getBillingHistory,
  getPlans,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.get('/plans', getPlans);

// Protected routes
router.use(authenticate);

router.get('/', getSubscription);
router.post('/upgrade', upgradePlan);
router.post('/downgrade', downgradePlan);
router.post('/cancel', cancelSubscription);
router.get('/billing', getBillingHistory);

export default router;
