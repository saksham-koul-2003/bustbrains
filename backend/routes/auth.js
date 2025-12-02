import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';
import { getAirtableClient } from '../utils/airtableClient.js';

const router = express.Router();

// Helper function to generate PKCE code verifier and challenge
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

// Initiate OAuth flow
router.get('/airtable', (req, res) => {
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
  const scope = process.env.AIRTABLE_SCOPE || 'data.records:read data.records:write schema.bases:read';

  // Validate required environment variables
  if (!clientId || !redirectUri) {
    console.error('Missing OAuth configuration:', { clientId: !!clientId, redirectUri: !!redirectUri });
    return res.status(500).json({ error: 'OAuth configuration missing' });
  }

  // Generate PKCE code verifier and challenge
  const { codeVerifier, codeChallenge } = generatePKCE();
  
  // Store code verifier in session for later use
  req.session.codeVerifier = codeVerifier;
  req.session.oauthState = req.sessionID;

  // Build OAuth URL with PKCE
  const authUrl = `https://airtable.com/oauth2/v1/authorize?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${encodeURIComponent(req.sessionID)}&` +
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=S256`;

  console.log('OAuth redirect URL (with PKCE):', authUrl.replace(/client_secret=[^&]*/, 'client_secret=***'));
  res.redirect(authUrl);
});

// OAuth callback
router.get('/airtable/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    console.log('OAuth callback received:', { 
      hasCode: !!code, 
      hasError: !!error, 
      error, 
      error_description,
      query: req.query 
    });

    if (error) {
      console.error('OAuth error from Airtable:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || '')}`);
    }

    if (!code) {
      console.error('No authorization code received');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Validate environment variables
    if (!process.env.AIRTABLE_CLIENT_ID || !process.env.AIRTABLE_CLIENT_SECRET || !process.env.AIRTABLE_REDIRECT_URI) {
      console.error('Missing OAuth configuration in callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=config_missing`);
    }

    // Get code verifier from session (required for PKCE)
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      console.error('No code verifier in session');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=session_expired`);
    }

    // Exchange code for access token
    // Airtable requires form-urlencoded format with PKCE
    const params = new URLSearchParams();
    params.append('client_id', process.env.AIRTABLE_CLIENT_ID);
    params.append('client_secret', process.env.AIRTABLE_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', process.env.AIRTABLE_REDIRECT_URI);
    params.append('code_verifier', codeVerifier);
    
    // Clear code verifier from session after use
    delete req.session.codeVerifier;

    console.log('Exchanging code for token...');
    console.log('Client ID:', process.env.AIRTABLE_CLIENT_ID);
    console.log('Client Secret length:', process.env.AIRTABLE_CLIENT_SECRET?.length);
    console.log('Redirect URI:', process.env.AIRTABLE_REDIRECT_URI);
    console.log('Code verifier present:', !!codeVerifier);
    
    let tokenResponse;
    try {
      tokenResponse = await axios.post('https://airtable.com/oauth2/v1/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log('Token exchange successful');
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError.response?.data || tokenError.message);
      console.error('Full error:', JSON.stringify(tokenError.response?.data, null, 2));
      const errorMsg = tokenError.response?.data?.error_description || tokenError.response?.data?.error || tokenError.message;
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_exchange_failed&message=${encodeURIComponent(errorMsg)}`);
    }

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      console.error('No access token in response:', tokenResponse.data);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_access_token`);
    }

    // Get user info from Airtable
    console.log('Fetching user info from Airtable...');
    let userResponse;
    try {
      userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
    } catch (userError) {
      console.error('Error fetching user info:', userError.response?.data || userError.message);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_fetch_failed`);
    }

    const airtableUser = userResponse.data;
    console.log('Airtable user:', { id: airtableUser.id, email: airtableUser.email });

    // Save or update user in database
    let user = await User.findOne({ airtableUserId: airtableUser.id });
    
    if (user) {
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      user.loginTimestamp = new Date();
      await user.save();
    } else {
      user = await User.create({
        airtableUserId: airtableUser.id,
        email: airtableUser.email || '',
        name: airtableUser.name || '',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        loginTimestamp: new Date()
      });
    }

    // Set session
    req.session.userId = user._id.toString();
    console.log('Session created for user:', user._id.toString());

    console.log('OAuth flow completed successfully, redirecting to dashboard');
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    console.error('Error stack:', error.stack);
    const errorMessage = error.response?.data?.error_description || error.message || 'oauth_failed';
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-accessToken -refreshToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;

