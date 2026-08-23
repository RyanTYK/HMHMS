import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (email: string, token: string, name: string): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify Your Email - HMHMS',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; margin: 20px auto !important; }
              .content { padding: 30px 20px !important; }
              .header { padding: 30px 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%); min-height: 100vh;">
          
          <!-- Main Container -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 0;">
            <tr>
              <td align="center">
                
                <!-- Card Container -->
                <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05);">
                  
                  <!-- Header with Icon -->
                  <div class="header" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 50px 40px; text-align: center; position: relative;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"/>
                      </svg>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      Welcome to HMHMS!
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 12px 0 0 0; font-size: 16px; font-weight: 400;">
                      Host Machine Health Monitoring System
                    </p>
                  </div>
                  
                  <!-- Content -->
                  <div class="content" style="padding: 50px 40px;">
                    
                    <!-- Greeting -->
                    <div style="text-align: center; margin-bottom: 35px;">
                      <p style="color: #1f2937; font-size: 18px; line-height: 1.6; margin: 0;">
                        Hi <strong style="color: #8b5cf6; font-weight: 700;">${name}</strong>,
                      </p>
                    </div>
                    
                    <!-- Main Message -->
                    <div style="background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); padding: 30px; border-radius: 12px; border: 1px solid #e9d5ff; margin-bottom: 35px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
                        Thank you for registering with <strong>HMHMS</strong>! We're excited to have you on board.
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0; text-align: center;">
                        To complete your registration and start monitoring your services, please verify your email address:
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tr>
                          <td style="border-radius: 10px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);">
                            <a href="${verificationUrl}" 
                               target="_blank"
                               style="display: inline-block; 
                                      color: #ffffff; 
                                      padding: 18px 50px; 
                                      text-decoration: none; 
                                      border-radius: 10px; 
                                      font-weight: 700; 
                                      font-size: 17px;
                                      letter-spacing: 0.3px;
                                      transition: all 0.3s ease;">
                              ✓ Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Divider -->
                    <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e7eb 50%, transparent); margin: 40px 0;"></div>
                    
                    <!-- Alternative Link -->
                    <div style="background-color: #f9fafb; padding: 25px; border-radius: 10px; border: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 12px 0; text-align: center; font-weight: 600;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #8b5cf6; font-size: 12px; word-break: break-all; background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 0; border: 1px dashed #d8b4fe; font-family: 'Courier New', monospace; line-height: 1.6;">
                        ${verificationUrl}
                      </p>
                    </div>
                    
                    <!-- Warning Box -->
                    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; padding: 20px 24px; margin: 30px 0 0 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);">
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                        <strong style="font-size: 15px;">⚠️ Important Notice:</strong><br>
                        This verification link will expire in <strong>24 hours</strong>. If you didn't create an account with HMHMS, please ignore this email.
                      </p>
                    </div>
                    
                  </div>
                  
                  <!-- Footer -->
                  <div style="background: linear-gradient(to bottom, #f9fafb, #f3f4f6); padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <div style="margin-bottom: 15px;">
                      <span style="display: inline-block; width: 8px; height: 8px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50%; margin: 0 4px;"></span>
                      <span style="display: inline-block; width: 8px; height: 8px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50%; margin: 0 4px;"></span>
                      <span style="display: inline-block; width: 8px; height: 8px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50%; margin: 0 4px;"></span>
                    </div>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; line-height: 1.6; font-weight: 500;">
                      HMHMS Host Machine Health Monitoring System
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </div>
                  
                </div>
                
              </td>
            </tr>
          </table>
          
        </body>
      </html>
    `,
    text: `
Welcome to HMHMS, ${name}!

Thank you for registering. Please verify your email address by visiting the following link:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with HMHMS, please ignore this email.

---
This is an automated message from HMHMS Health Monitoring System.
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error: any) {
    console.error('❌ Failed to send verification email:', error.message);
    throw new Error('Failed to send verification email');
  }
};
