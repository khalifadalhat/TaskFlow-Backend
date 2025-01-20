import { Router } from 'express';
import { getUsersProfile, getUserProfile, updateUserProfile, deleteUser } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = Router();

// GET /user/profile: Get all user details (Protected route)
router.get('/profile', authenticate, getUsersProfile);

// GET /user/profile: Get current user details (Protected route)
router.get('/profile', authenticate, getUserProfile);

// PUT /user/profile: Update user profile (Protected route)
router.put('/profile/:id', authenticate, updateUserProfile);

router.delete('/profile/:id', authenticate, deleteUser);

export default router;
