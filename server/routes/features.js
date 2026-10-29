import express from 'express';
import { authenticate, requireFeature } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Small demonstrator endpoints make server-side plan restrictions testable.
// Replace sample payloads with actual feature services as the SaaS product grows.
router.get('/analytics', requireFeature('analytics'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      feature: 'analytics',
      mode: 'demonstration',
      message: 'Analytics access is enabled for this subscription.',
      metrics: { activeProjects: 12, requestsThisMonth: 1840, teamMembers: 4 },
    },
  });
});

router.get('/api-access', requireFeature('apiAccess'), (req, res) => {
  res.status(200).json({
    success: true,
    data: { feature: 'apiAccess', mode: 'demonstration', message: 'API access is enabled for this subscription.' },
  });
});

router.get('/custom-domain', requireFeature('customDomain'), (req, res) => {
  res.status(200).json({
    success: true,
    data: { feature: 'customDomain', mode: 'demonstration', message: 'Custom-domain settings are available for this subscription.' },
  });
});

export default router;
