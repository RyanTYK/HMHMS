import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { AppDataSource } from '../utils/data-source';
import { User } from '../models/User';

// Define Microsoft profile interface
interface MicrosoftProfile {
  id: string;
  displayName?: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
  upn?: string;
  _json?: {
    email?: string;
    userPrincipalName?: string;
    mail?: string;
    [key: string]: any;
  };
}

// Microsoft OAuth Strategy Configuration
passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/auth/microsoft/callback',
      scope: ['user.read', 'openid', 'profile', 'email'],
      tenant: process.env.MICROSOFT_TENANT_ID || 'common', // 'common' allows any Microsoft account
    },
    async (accessToken: string, refreshToken: string, profile: MicrosoftProfile, done: any) => {
      try {
        console.log('📧 Microsoft Profile received:', JSON.stringify(profile, null, 2));
        
        const userRepo = AppDataSource.getRepository(User);
        
        // Extract user information from Microsoft profile
        // Try multiple ways to get email (different for personal vs org accounts)
        let email = profile.emails?.[0]?.value 
                 || profile.upn 
                 || profile._json?.email 
                 || profile._json?.userPrincipalName
                 || profile._json?.mail
                 || '';
        
        // Handle Azure AD external user format: username_domain.com#EXT#@tenant.onmicrosoft.com
        // Convert to real email: username@domain.com
        if (email.includes('#EXT#@') && email.includes('_')) {
          const externalPart = email.split('#EXT#')[0]; // Get "username_domain.com" part
          email = externalPart.replace(/_([^_]+)$/, '@$1'); // Replace last underscore with @
          console.log('🔄 Converted external user email format to:', email);
        }
        
        const name = profile.displayName || profile.name?.givenName || email.split('@')[0];
        const microsoftId = profile.id;
        const avatarUrl = profile.photos?.[0]?.value || null;

        console.log('📧 Extracted email:', email);
        console.log('👤 Extracted name:', name);

        if (!email) {
          console.error('❌ No email found in Microsoft profile');
          return done(new Error('Email not provided by Microsoft. Please ensure your Microsoft account has an email associated with it.'), null);
        }

        // Check if user already exists with this email
        let user = await userRepo.findOne({ where: { email } });

        if (user) {
          // User exists - link Microsoft account if not already linked
          if (!user.oauth_provider && !user.oauth_id) {
            // Auto-link: existing email/password account
            user.oauth_provider = 'microsoft';
            user.oauth_id = microsoftId;
            user.avatar_url = avatarUrl;
            user.email_verified = true; // Microsoft accounts are pre-verified
            await userRepo.save(user);
            console.log(`✅ Linked Microsoft account to existing user: ${email}`);
          } else if (user.oauth_provider === 'microsoft' && user.oauth_id === microsoftId) {
            // Already linked - just update avatar if changed
            if (avatarUrl && user.avatar_url !== avatarUrl) {
              user.avatar_url = avatarUrl;
              await userRepo.save(user);
            }
            console.log(`✅ Microsoft SSO login: ${email}`);
          } else if (user.oauth_provider !== 'microsoft') {
            // User exists with different OAuth provider
            return done(new Error(`This email is already registered with ${user.oauth_provider}`), null);
          }
        } else {
          // New user - create account with Microsoft credentials
          user = userRepo.create({
            email,
            name,
            oauth_provider: 'microsoft',
            oauth_id: microsoftId,
            avatar_url: avatarUrl,
            email_verified: true,
            password_hash: null, // OAuth users don't have passwords
            active: true,
            browser_notifications_enabled: true,
          });
          await userRepo.save(user);
          console.log(`✅ Created new user via Microsoft SSO: ${email}`);
        }

        return done(null, user);
      } catch (error: any) {
        console.error('❌ Microsoft OAuth error:', error.message);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
