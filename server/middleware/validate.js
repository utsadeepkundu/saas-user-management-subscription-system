import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  return next();
};

const strongPassword = (fieldName = 'Password') => body('password')
  .notEmpty().withMessage(`${fieldName} is required`)
  .isLength({ min: 8, max: 128 }).withMessage(`${fieldName} must be between 8 and 128 characters`)
  .matches(/[a-z]/).withMessage(`${fieldName} must contain a lowercase letter`)
  .matches(/[A-Z]/).withMessage(`${fieldName} must contain an uppercase letter`)
  .matches(/\d/).withMessage(`${fieldName} must contain a number`);

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  strongPassword('Password'),
  handleValidationErrors,
];

export const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password must be at most 128 characters'),
  handleValidationErrors,
];

export const forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  handleValidationErrors,
];

export const resetPasswordValidation = [strongPassword('New password'), handleValidationErrors];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required')
    .isLength({ max: 128 }).withMessage('Current password must be at most 128 characters'),
  body('newPassword').notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters')
    .matches(/[a-z]/).withMessage('New password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter')
    .matches(/\d/).withMessage('New password must contain a number'),
  handleValidationErrors,
];

export const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().trim().isEmail()
    .withMessage('Please provide a valid email address').normalizeEmail(),
  body('avatar').optional().isString().isLength({ max: 2048 })
    .withMessage('Avatar URL must be a string of at most 2048 characters'),
  handleValidationErrors,
];
