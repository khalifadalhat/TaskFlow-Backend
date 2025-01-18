import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User Registration (POST /register)
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  const { username, password, role }: { username: string, password: string, role: string } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role
    });

    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

// User Login (POST /login)
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const { username, password }: { username: string, password: string } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    
    return res.status(200).json({ token });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

// Get User Profile (GET /profile)
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById((req as any).user.id); // From the authenticate middleware
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      res.status(200).json(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ message: 'Server error', error: errorMessage });
    }
  };
  
  // Update User Profile (PUT /profile)
  export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    const { skills, availability }: { skills?: string, availability?: string } = req.body;
  
    try {
      const user = await User.findById((req as any).user.id); // From the authenticate middleware
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      if (skills) user.skills = skills;
      if (availability) user.availability = availability;
  
      await user.save();
      res.status(200).json(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ message: 'Server error', error: errorMessage });
    }
  };