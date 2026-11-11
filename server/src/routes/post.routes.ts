import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createPostSchema } from '../validators/post.validator.js';
import { userIdParamSchema, paginationQuerySchema } from '../validators/common.validator.js';
import { ROLES } from '../constants/roles.js';

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
