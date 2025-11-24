# Forgot Password Functionality Setup

This document explains how to set up the forgot password functionality in your SND Rental Management application.

## Features Implemented

1. **Forgot Password Page** (`/forgot-password`)
   - User enters email address
   - System sends password reset email
   - Success confirmation shown

2. **Password Reset Page** (`/reset-password`)
   - User sets new password using reset token
   - Token validation and expiration handling
   - Secure password update

3. **Email System**
   - Password reset emails with secure links
   - Token expiration (1 hour)
   - Professional email templates

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# App URL
APP_URL="http://localhost:3000"

# Gmail Configuration (Recommended)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-char-app-password"
FROM_EMAIL="your-email@gmail.com"

# Alternative: Custom SMTP Configuration
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"

# Development: Ethereal Email (testing)
# ETHEREAL_USER="your-ethereal-email@ethereal.email"
# ETHEREAL_PASS="your-ethereal-password"
```

## Email Service Setup

### Gmail (Recommended)
1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "SND Rental App"
   - Copy the 16-character password
3. **Set Environment Variables**:
   ```bash
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

### Development (Testing)
1. Go to [Ethereal Email](https://ethereal.email/)
2. Create a test account
3. Use the provided credentials in your `.env.local`

### Alternative Production Options
1. **Custom SMTP**: Use your server details
2. **SendGrid**: Use API keys
3. **AWS SES**: Use AWS credentials

## Database Tables

The system uses the existing `password_reset_tokens` table:
- `email`: User's email address
- `token`: Hashed reset token
- `expiresAt`: Token expiration time
- `createdAt`: Token creation time

## Security Features

1. **Token Hashing**: Reset tokens are hashed before storage
2. **Expiration**: Tokens expire after 1 hour
3. **Single Use**: Tokens are deleted after use
4. **Email Privacy**: System doesn't reveal if email exists
5. **Secure Links**: Reset URLs include encrypted tokens

## API Endpoints

1. **POST** `/api/auth/forgot-password`
   - Accepts: `{ email }`
   - Sends reset email
   - Returns success message

2. **POST** `/api/auth/validate-reset-token`
   - Accepts: `{ token, email }`
   - Validates reset token
   - Returns token validity

3. **POST** `/api/auth/reset-password`
   - Accepts: `{ token, email, password }`
   - Updates user password
   - Deletes used token

## User Flow

1. User clicks "Forgot Password?" on login page
2. User enters email on forgot password page
3. System sends reset email with secure link
4. User clicks link in email
5. User sets new password on reset page
6. User can now login with new password

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/forgot-password`
3. Enter a valid email address
4. Check email for reset link
5. Click link and reset password
6. Verify login works with new password

## Troubleshooting

### Email Not Sending
- Check environment variables
- Verify email service credentials
- Check console for error messages

### Token Validation Fails
- Ensure token hasn't expired
- Check database connection
- Verify token format

### Password Reset Fails
- Check if user exists
- Verify token is still valid
- Check database permissions

## Customization

### Email Templates
Edit `src/lib/email.ts` to customize:
- Email subject lines
- HTML email content
- Text email content
- Branding and styling

### Token Expiration
Modify the expiration time in:
- `src/app/api/auth/forgot-password/route.ts` (line 58)
- Update the UI messages accordingly

### Password Requirements
Update validation in:
- `src/app/reset-password/page.tsx` (line 75)
- `src/app/signup/page.tsx` (line 60)
