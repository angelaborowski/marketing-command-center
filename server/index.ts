import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// LinkedIn OAuth config
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3001/api/linkedin/callback';
const FRONTEND_URL = 'http://localhost:5173';

// ============================================================================
// GET /api/linkedin/auth — Redirect to LinkedIn OAuth consent screen
// ============================================================================
app.get('/api/linkedin/auth', (_req, res) => {
  if (!LINKEDIN_CLIENT_ID) {
    res.status(500).json({ error: 'LINKEDIN_CLIENT_ID not configured' });
    return;
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile w_member_social w_organization_social',
    state: crypto.randomUUID(),
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// ============================================================================
// GET /api/linkedin/callback — Exchange auth code for access token
// ============================================================================
app.get('/api/linkedin/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    res.redirect(`${FRONTEND_URL}?linkedin_error=${error || 'no_code'}`);
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Token exchange failed:', err);
      res.redirect(`${FRONTEND_URL}?linkedin_error=token_exchange_failed`);
      return;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // seconds

    // Get the user's LinkedIn profile to get their sub (person URN)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let linkedinSub = '';
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      linkedinSub = profile.sub || '';
    }

    // Redirect back to frontend with token in URL hash (not query params for security)
    const params = new URLSearchParams({
      linkedin_token: accessToken,
      linkedin_expires: expiresIn.toString(),
      linkedin_sub: linkedinSub,
    });
    res.redirect(`${FRONTEND_URL}?${params}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${FRONTEND_URL}?linkedin_error=server_error`);
  }
});

// ============================================================================
// POST /api/linkedin/post — Post content to LinkedIn
// ============================================================================
app.post('/api/linkedin/post', async (req, res) => {
  const { accessToken, authorUrn, authorType, text } = req.body;

  if (!accessToken || !authorUrn || !text) {
    res.status(400).json({ error: 'Missing required fields: accessToken, authorUrn, text' });
    return;
  }

  // authorType: 'person' (personal profile) or 'organization' (company page)
  const urnType = authorType === 'organization' ? 'organization' : 'person';

  try {
    const postBody = {
      author: `urn:li:${urnType}:${authorUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LinkedIn post failed:', response.status, errorBody);
      res.status(response.status).json({
        error: 'Failed to post to LinkedIn',
        details: errorBody,
      });
      return;
    }

    const result = await response.json();
    res.json({ success: true, postId: result.id });
  } catch (err) {
    console.error('Post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Start server
// ============================================================================
app.listen(PORT, () => {
  console.log(`LinkedIn API server running on http://localhost:${PORT}`);
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    console.warn('⚠ LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set in .env');
  }
});
