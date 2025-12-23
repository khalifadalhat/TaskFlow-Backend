import { Router, Request, Response, NextFunction } from 'express';
import {
  changePassword,
  forgotPassword,
  getDevOTPs,
  loginUser,
  registerUser,
  resendVerificationOTP,
  resetPassword,
  verifyEmail,
  verifyResetPasswordOTP,
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { otpRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [user, manager, admin]
 *                 default: user
 *                 example: user
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: 'Email already registered'
 *               error: 'Conflict'
 *               statusCode: 409
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  await registerUser(req, res).catch(next);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: 'Invalid email or password'
 *               error: 'Unauthorized'
 *               statusCode: 401
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  await loginUser(req, res).catch(next);
});

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  await verifyEmail(req, res).catch(next);
});

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Email already verified or active OTP exists
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post(
  '/resend-verification',
  otpRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    await resendVerificationOTP(req, res).catch(next);
  }
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: If account exists, OTP sent successfully
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    await forgotPassword(req, res).catch(next);
  }
);

/**
 * @swagger
 * /auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-reset-otp', async (req: Request, res: Response, next: NextFunction) => {
  await verifyResetPasswordOTP(req, res).catch(next);
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid request or OTP
 *       500:
 *         description: Server error
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  await resetPassword(req, res).catch(next);
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/change-password',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    await changePassword(req, res).catch(next);
  }
);

/**
 * @swagger
 * /auth/dev/otps:
 *   get:
 *     summary: Get development OTPs (Development only)
 *     tags: [Development]
 *     responses:
 *       200:
 *         description: List of OTPs sent in development
 *       403:
 *         description: Endpoint not available in production
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/dev/otps', async (req: Request, res: Response, next: NextFunction) => {
    await getDevOTPs(req, res).catch(next);
  });
}

export default router;
