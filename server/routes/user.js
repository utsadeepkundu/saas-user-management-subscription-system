import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { updateProfileValidation, changePasswordValidation } from '../middleware/validate.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/change-password', changePasswordValidation, changePassword);
router.delete('/account', deleteAccount);

export default router;
