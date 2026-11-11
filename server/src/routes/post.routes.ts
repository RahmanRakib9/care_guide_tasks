import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createPostSchema } from '../validators/post.validator';
import { userIdParamSchema, paginationQuerySchema } from '../validators/common.validator';
import { ROLES } from '../constants/roles';

const router = Router();

router.get(
  '/users/:userId',
  validateRequest({ params: userIdParamSchema }),
  postController.getUserPosts
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  postController.getPosts
);

router.post(
  '/',
  authenticate,
  authorize(ROLES.USER),
  validateRequest({ body: createPostSchema }),
  postController.createPost
);

export default router;
