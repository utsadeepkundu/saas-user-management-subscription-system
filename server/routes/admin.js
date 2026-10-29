import express from 'express';
import {
  getAllUsers,
  getUserById,
  changeUserPlan,
  suspendUser,
  reactivateUser,
  deleteUser,
  getDashboardStats,
} from '../controllers/adminController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin privileges
router.use(authenticate, authorizeAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/plan', changeUserPlan);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/reactivate', reactivateUser);
router.delete('/users/:id', deleteUser);

export default router;
