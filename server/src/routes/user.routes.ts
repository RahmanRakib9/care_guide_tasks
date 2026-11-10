import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator';
import { ROLES } from '../constants/roles';

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
