import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get(
  '/interests',
  validateRequest({ query: paginationQuerySchema }),
  userController.getInterestsGroup
);

router.post(
  '/',
  validateRequest({ body: createUserSchema }),
  userController.createUser
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  userController.getUsers
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  userController.getUserById
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateUserSchema }),
  userController.updateUser
);

router.delete(
  '/:id',
  validateRequest({ params: idParamSchema }),
  userController.deleteUser
);

export default router;
