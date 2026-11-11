import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import noteRoutes from './note.routes.js';
import userRoutes from './user.routes.js';
import postRoutes from './post.routes.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Secure Note-Taking API is healthy and operational',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);
router.use('/admin/users', userRoutes);
router.use('/posts', postRoutes);

export default router;
