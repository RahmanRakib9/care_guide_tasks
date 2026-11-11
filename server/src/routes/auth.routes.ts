import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateRequest({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

router.get('/me', authenticate, authController.getMe);

export default router;
