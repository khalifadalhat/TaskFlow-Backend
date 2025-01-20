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

  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGQzMzE2MzVkYzkyNGFlZWEyYWE0ZSIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTczNzMwNjk0MiwiZXhwIjoxNzM3MzEwNTQyfQ.Ul4ex9NK6CI74iXI6551EgSudSUauxIViJM64YJkB1g

export default router;
