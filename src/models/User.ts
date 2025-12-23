import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  role: 'admin' | 'manager' | 'user';
  skills: string[];
  availability: boolean;
  isVerified: boolean;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  resetPasswordOtp?: {
    code: string;
    expiresAt: Date;
  };
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePicture: { type: String, default: '' },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'manager', 'user'],
      default: 'user',
    },
    skills: [{ type: String }],
    availability: { type: Boolean, default: true },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    resetPasswordOtp: {
      code: String,
      expiresAt: Date,
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);

export default User;
