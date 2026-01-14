import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import OTPService from '../services/otpService';

const JWT_SECRET: Secret = process.env.JWT_SECRET as Secret;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const jwtOptions: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'],
};

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: email, password, firstName, lastName',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        code: 'EMAIL_EXISTS',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      isVerified: false,
    });

    await newUser.save();

    await OTPService.sendVerificationOTP(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification OTP.',
      data: {
        userId: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        needsVerification: true,
        expiresIn: '10 minutes',
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required',
    });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be a 6-digit number',
    });
  }

  try {
    const result = await OTPService.verifyOTP(email.toLowerCase(), otp, 'verification');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Verification failed',
        code: 'INVALID_OTP',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      jwtOptions
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie('user_role', user.role, {
      httpOnly: false,
      secure: true,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    });
  }
};

export const resendVerificationOTP = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    const hasValidOTP = await OTPService.hasValidOTP(email, 'verification');
    if (hasValidOTP) {
      return res.status(429).json({
        success: false,
        message: 'A valid OTP already exists. Please wait before requesting a new one.',
        retryAfter: '10 minutes',
      });
    }

    const result = await OTPService.resendOTP(email.toLowerCase(), 'verification');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to resend OTP',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent successfully',
      data: {
        email: email.toLowerCase(),
        expiresIn: '10 minutes',
      },
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.',
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, password }: { email: string; password: string } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.isVerified) {
      const hasValidOTP = await OTPService.hasValidOTP(email, 'verification');

      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        data: {
          email: user.email,
          needsVerification: true,
          hasActiveOTP: hasValidOTP,
          resendAvailable: !hasValidOTP,
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      jwtOptions
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie('user_role', user.role, {
      httpOnly: false,
      secure: true,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          skills: user.skills,
          availability: user.availability,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  try {
    const hasValidOTP = await OTPService.hasValidOTP(email, 'reset');
    if (hasValidOTP) {
      return res.status(429).json({
        success: false,
        message: 'A password reset OTP already exists. Please wait before requesting a new one.',
        retryAfter: '10 minutes',
      });
    }

    const sent = await OTPService.sendPasswordResetOTP(email.toLowerCase());

    if (!sent) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email',
      data: {
        email: email.toLowerCase(),
        expiresIn: '10 minutes',
      },
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reset OTP. Please try again.',
    });
  }
};

export const verifyResetPasswordOTP = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required',
    });
  }

  try {
    const result = await OTPService.verifyOTP(email.toLowerCase(), otp, 'reset');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired OTP',
        code: 'INVALID_OTP',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: email.toLowerCase(),
        verified: true,
      },
    });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed. Please try again.',
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  try {
    const result = await OTPService.verifyOTP(email.toLowerCase(), otp, 'reset');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired OTP',
        code: 'INVALID_OTP',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as the old password',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
      data: {
        email: user.email,
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.',
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long',
    });
  }

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.',
    });
  }
};

export const getDevOTPs = async (req: Request, res: Response): Promise<Response> => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Dev OTP endpoint',
    note: 'In production, implement proper OTP tracking/logging',
  });
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id);
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

export const getUsersProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    profilePicture,
    skills,
    availability,
  }: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    skills?: string[];
    availability?: boolean;
  } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (profilePicture) user.profilePicture = profilePicture;
    if (skills) user.skills = skills;
    if (availability !== undefined) user.availability = availability;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};
