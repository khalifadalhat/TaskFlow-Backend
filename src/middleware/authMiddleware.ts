import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware to authenticate JWT token
export const authenticate = (req: Request & { user?: { id: string, role: string } }, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Authorization header
  
  if (!token) {
    res.status(401).json({ message: 'Authorization required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as { id: string, role: string }; // Attach user info (ID, role) to the request object
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};