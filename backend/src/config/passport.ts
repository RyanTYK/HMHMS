import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { AppDataSource } from '../utils/data-source';
import { User } from '../models/User';
import { debugLog } from '../utils/debugLog';

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
// Optional feature: only register the strategy when credentials are actually
// configured. passport-oauth2 throws synchronously (crashing the process) if
// constructed with an empty clientID, and MICROSOFT_CLIENT_ID/SECRET are
// blank by default in .env.example.
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/auth/microsoft/callback',
      scope: ['user.read', 'openid', 'profile', 'email'],
      tenant: process.env.MICROSOFT_TENANT_ID || 'common', // 'common' allows any Microsoft account
    },
    async (accessToken: string, refreshToken: string, profile: MicrosoftProfile, done: any) => {
      try {
        debugLog('Microsoft Profile received:', JSON.stringify(profile, null, 2));

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
          debugLog('Converted external user email format to:', email);
        }

        const name = profile.displayName || profile.name?.givenName || email.split('@')[0];
        const microsoftId = profile.id;
        const avatarUrl = profile.photos?.[0]?.value || null;

        debugLog('Extracted email:', email);
        debugLog('Extracted name:', name);

        if (!email) {
          console.error('No email found in Microsoft profile');
          return done(new Error('Email not provided by Microsoft. Please ensure your Microsoft account has an email associated with it.'), null);
        }

        let user = await userRepo.findOne({ where: { email } });

        if (user) {
          if (!user.oauth_provider && !user.oauth_id) {
            // Only auto-link into an already-verified local account: the
            // existing owner has proven mailbox ownership through our own
            // verification flow. An unverified stub account could belong to
            // anyone who merely typed this email into the register form -
            // silently handing it (and whatever it already contains) to
            // whoever next signs in with Microsoft using that email would be
            // an account-takeover path, so require it be verified first.
            if (!user.email_verified) {
              return done(new Error('An unverified account with this email already exists. Please verify it via the link we emailed you before using Microsoft sign-in.'), null);
            }
            user.oauth_provider = 'microsoft';
            user.oauth_id = microsoftId;
            user.avatar_url = avatarUrl;
            await userRepo.save(user);
            debugLog(`Linked Microsoft account to existing user: ${email}`);
          } else if (user.oauth_provider === 'microsoft' && user.oauth_id === microsoftId) {
            if (avatarUrl && user.avatar_url !== avatarUrl) {
              user.avatar_url = avatarUrl;
              await userRepo.save(user);
            }
            debugLog(`Microsoft SSO login: ${email}`);
          } else if (user.oauth_provider !== 'microsoft') {
            return done(new Error(`This email is already registered with ${user.oauth_provider}`), null);
          }
        } else {
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
          debugLog(`Created new user via Microsoft SSO: ${email}`);
        }

        return done(null, user);
      } catch (error: any) {
        console.error('Microsoft OAuth error:', error.message);
        return done(error, null);
      }
    }
    )
  );
} else {
  console.warn('[passport] MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET not set - Microsoft SSO is disabled.');
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

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
