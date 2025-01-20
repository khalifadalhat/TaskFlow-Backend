import{ Router, Request, Response, NextFunction  } from 'express';
import { loginUser, registerUser } from '../controllers/authController';

const router: Router = Router();

// POST /auth/register: Register a new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    await registerUser(req, res).catch(next);
  });
  
  // POST /auth/login: User login and return JWT token
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    await loginUser(req, res).catch(next);
  });

export default router;
