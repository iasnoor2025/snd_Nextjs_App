import nodemailer from 'nodemailer';

// Create a transporter for sending emails
// Configured to use Gmail SMTP by default
const createTransporter = () => {
  // Check if Gmail credentials are provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    // Use Gmail SMTP
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });
  }

  // Fallback to custom SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development/testing, use Ethereal Email if no other config
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'testpass',
      },
    });
  }

  throw new Error('No email configuration found. Please set GMAIL_USER and GMAIL_APP_PASSWORD or SMTP configuration.');
};

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@snd.com',
    to: email,
    subject: 'Password Reset Request - SND Rental Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">SND Rental Management</h1>
        </div>
        
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #333;">Hello ${name},</h2>
          
          <p>You recently requested to reset your password for your SND Rental Management account. Click the button below to reset it.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p><strong>This password reset link will expire in 1 hour.</strong></p>
          
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p>Thanks,<br>The SND Team</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
    text: `
      Hello ${name},
      
      You recently requested to reset your password for your SND Rental Management account. 
      Click the link below to reset it:
      
      ${resetUrl}
      
      This password reset link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      
      Thanks,
      The SND Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@snd.com',
    to: email,
    subject: 'Welcome to SND Rental Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">SND Rental Management</h1>
        </div>
        
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #333;">Welcome ${name}!</h2>
          
          <p>Thank you for creating your account with SND Rental Management. We're excited to have you on board!</p>
          
          <p>You can now:</p>
          <ul>
            <li>Access your dashboard</li>
            <li>Manage your profile</li>
            <li>Use all the features of our rental management system</li>
          </ul>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Welcome aboard!<br>The SND Team</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}
