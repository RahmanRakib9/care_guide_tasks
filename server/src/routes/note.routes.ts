import { Router } from 'express';
import * as noteController from '../controllers/note.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.USER),
  validateRequest({ body: createNoteSchema }),
  noteController.createNote
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  noteController.getNotes
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  noteController.getNoteById
);

router.patch(
  '/:id',
  authorize(ROLES.USER),
  validateRequest({ params: idParamSchema, body: updateNoteSchema }),
  noteController.updateNote
);

router.delete(
  '/:id',
  authorize(ROLES.USER),
  validateRequest({ params: idParamSchema }),
  noteController.deleteNote
);

export default router;
