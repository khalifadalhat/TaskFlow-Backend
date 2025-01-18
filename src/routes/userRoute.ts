import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = Router();

// GET /user/profile: Get current user details (Protected route)
router.get('/profile', authenticate, getUserProfile);

// PUT /user/profile: Update user profile (Protected route)
router.put('/profile', authenticate, updateUserProfile);

export default router;
