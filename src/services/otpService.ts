import crypto from 'crypto';
import * as brevo from '@getbrevo/brevo';
import User, { IUser } from '../models/User';

class OTPService {
  private static apiInstance: any = null;

  private static initializeBrevo() {
    if (!this.apiInstance) {
      const apiInstance = new brevo.TransactionalEmailsApi();

      apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

      this.apiInstance = apiInstance;
    }
    return this.apiInstance;
  }

  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static getExpirationTime(minutes: number = 10): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static async sendOTPEmail(
    email: string,
    otp: string,
    type: 'verification' | 'reset' = 'verification'
  ): Promise<boolean> {
    try {
      const apiInstance = this.initializeBrevo();

      const subject =
        type === 'verification' ? 'Verify Your Email - TaskFlow' : 'Reset Your Password - TaskFlow';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
            .otp-code { 
              background: #ffffff; 
              border: 2px dashed #4f46e5; 
              padding: 25px; 
              text-align: center; 
              font-size: 36px; 
              font-weight: bold; 
              letter-spacing: 8px; 
              margin: 25px 0;
              border-radius: 8px;
              color: #1f2937;
            }
            .expiry { color: #6b7280; font-size: 14px; margin-top: 10px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TaskFlow</h1>
          </div>
          <div class="content">
            <h2>${type === 'verification' ? 'Verify Your Email' : 'Reset Your Password'}</h2>
            <p>Hello,</p>
            <p>Use the following OTP code to ${
              type === 'verification' ? 'verify your email address' : 'reset your password'
            }:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p class="expiry">This code will expire in 10 minutes.</p>
            
            <p>If you didn't request this, please ignore this email.</p>
            
            <div class="footer">
              <p>Best regards,<br>The TaskFlow Team</p>
              <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const sendSmtpEmail = new brevo.SendSmtpEmail();

      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME || 'TaskFlow',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@taskflow.com',
      };
      sendSmtpEmail.to = [{ email, name: email.split('@')[0] }];
      sendSmtpEmail.replyTo = {
        email: process.env.BREVO_REPLY_TO || 'support@taskflow.com',
        name: process.env.BREVO_REPLY_TO_NAME || 'TaskFlow Support',
      };

      if (process.env.BREVO_TEMPLATE_ID) {
        sendSmtpEmail.templateId = parseInt(process.env.BREVO_TEMPLATE_ID);
      }

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ OTP email sent to ${email} via Brevo`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email via Brevo:', error);

      console.log(`[DEV OTP] ${type.toUpperCase()} OTP for ${email}: ${otp}`);
      return false;
    }
  }

  static async sendVerificationOTP(user: IUser): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = this.getExpirationTime();

    user.otp = { code: otp, expiresAt };
    await user.save();

    await this.sendOTPEmail(user.email, otp, 'verification');
  }

  static async sendPasswordResetOTP(email: string): Promise<boolean> {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found for password reset: ${email}`);
      return false;
    }

    const otp = this.generateOTP();
    const expiresAt = this.getExpirationTime();

    user.resetPasswordOtp = { code: otp, expiresAt };
    await user.save();

    const sent = await this.sendOTPEmail(email, otp, 'reset');
    return sent;
  }

  static async verifyOTP(
    email: string,
    otp: string,
    type: 'verification' | 'reset' = 'verification'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const otpField = type === 'verification' ? user.otp : user.resetPasswordOtp;

      if (!otpField || !otpField.code) {
        return { success: false, message: 'No OTP found' };
      }

      if (otpField.expiresAt < new Date()) {
        return { success: false, message: 'OTP has expired' };
      }

      if (otpField.code !== otp) {
        return { success: false, message: 'Invalid OTP' };
      }

      if (type === 'verification') {
        user.otp = undefined;
        user.isVerified = true;
      } else {
        user.resetPasswordOtp = undefined;
      }

      await user.save();
      return { success: true };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Server error' };
    }
  }

  static async resendOTP(
    email: string,
    type: 'verification' | 'reset' = 'verification'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (type === 'verification') {
        if (user.isVerified) {
          return { success: false, message: 'Email is already verified' };
        }
        await this.sendVerificationOTP(user);
      } else {
        await this.sendPasswordResetOTP(email);
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error resending OTP:', error);
      return { success: false, message: 'Failed to resend OTP' };
    }
  }

  static async hasValidOTP(
    email: string,
    type: 'verification' | 'reset' = 'verification'
  ): Promise<boolean> {
    const user = await User.findOne({ email });
    if (!user) return false;

    const otpField = type === 'verification' ? user.otp : user.resetPasswordOtp;
    if (!otpField || !otpField.code) return false;

    return otpField.expiresAt > new Date();
  }

  static async clearOTP(
    email: string,
    type: 'verification' | 'reset' = 'verification'
  ): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) return;

    if (type === 'verification') {
      user.otp = undefined;
    } else {
      user.resetPasswordOtp = undefined;
    }

    await user.save();
  }
}

export default OTPService;
