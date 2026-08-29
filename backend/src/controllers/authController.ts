import { Request, Response } from 'express';
import { AppDataSource } from '../utils/data-source';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateVerificationToken, sendVerificationEmail } from '../services/emailService';
import passport from '../config/passport';
import { getJwtSecret } from '../utils/jwtSecret';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ email });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  
  // Check if user is OAuth-only (no password)
  if (user.oauth_provider && !user.password_hash) {
    return res.status(400).json({ 
      error: `This account uses ${user.oauth_provider} sign-in. Please use the "Sign in with Microsoft" button.` 
    });
  }
  
  // Check if email is verified
  if (!user.email_verified) {
    return res.status(403).json({ 
      error: 'Please verify your email before logging in. Check your inbox for the verification link.' 
    });
  }
  
  if (!user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), { expiresIn: '1d' });
  res.json({ token });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const repo = AppDataSource.getRepository(User);
    const exists = await repo.findOneBy({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = generateVerificationToken();
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const user = repo.create({ 
      email, 
      password_hash, 
      name,
      email_verified: false,
      verification_token,
      verification_token_expires
    });
    await repo.save(user);
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verification_token, name);
    } catch (emailError: any) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can request resend
    }
    
    res.status(201).json({ 
      message: 'Registration successful! Please check your email to verify your account.',
      email: user.email 
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Registration failed' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userPayload: any = (req as any).user;
    if (!userPayload?.id) return res.status(401).json({ error: 'Unauthorized' });
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userPayload.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      browser_notifications_enabled: user.browser_notifications_enabled ?? true
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch user' });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userPayload: any = (req as any).user;
    if (!userPayload?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    const { browser_notifications_enabled } = req.body;
    if (typeof browser_notifications_enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid browser_notifications_enabled value' });
    }
    
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userPayload.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.browser_notifications_enabled = browser_notifications_enabled;
    await repo.save(user);
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      browser_notifications_enabled: user.browser_notifications_enabled
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to update settings' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userPayload: any = (req as any).user;
    if (!userPayload?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (name.length > 128) {
      return res.status(400).json({ error: 'Name must be 128 characters or less' });
    }
    
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userPayload.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.name = name.trim();
    await repo.save(user);
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      browser_notifications_enabled: user.browser_notifications_enabled
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to update profile' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ 
      where: { verification_token: token }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    // Check if token has expired
    if (user.verification_token_expires && user.verification_token_expires < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired. Please register again.' });
    }
    
    // Mark email as verified
    user.email_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    await repo.save(user);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully! You can now log in.' 
    });
  } catch (e: any) {
    console.error('Email verification error:', e);
    res.status(500).json({ error: e?.message || 'Verification failed' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists and is unverified, a verification email has been sent.' 
      });
    }
    
    // If already verified, no need to resend
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }
    
    // Generate new verification token
    const verification_token = generateVerificationToken();
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.verification_token = verification_token;
    user.verification_token_expires = verification_token_expires;
    await repo.save(user);
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verification_token, user.name);
    } catch (emailError: any) {
      console.error('Failed to resend verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
    
    res.json({ 
      success: true, 
      message: 'Verification email has been sent. Please check your inbox.' 
    });
  } catch (e: any) {
    console.error('Resend verification email error:', e);
    res.status(500).json({ error: e?.message || 'Failed to resend verification email' });
  }
};

// Microsoft OAuth Controllers
export const microsoftAuth = passport.authenticate('microsoft', {
  session: false,
});

export const microsoftCallback = [
  passport.authenticate('microsoft', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=authentication_failed`);
      }

      // Generate JWT token for the user
      const token = jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), { expiresIn: '1d' });
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/microsoft/callback?token=${token}`);
    } catch (error: any) {
      console.error('Microsoft callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=callback_failed`);
    }
  }
];
