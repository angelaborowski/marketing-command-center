import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { runContentPipeline } from './runPipeline.server';
import {
  listBatches,
  loadBatch,
  updateBatchItemStatus,
  approveAllItems,
  getApprovedItems,
  loadServerSettings,
  saveServerSettings,
  appendCronLog,
  getCronLog,
} from './store';

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
// Cron Scheduling
// ============================================================================

let cronJob: cron.ScheduledTask | null = null;
let pipelineRunning = false;

function setupCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }

  const settings = loadServerSettings();
  const schedule = settings.cronSchedule || '0 9 * * 5';

  if (!cron.validate(schedule)) {
    console.error(`[CRON] Invalid schedule expression: "${schedule}". Using default.`);
    return;
  }

  cronJob = cron.schedule(schedule, async () => {
    if (pipelineRunning) {
      console.log('[CRON] Pipeline already running, skipping.');
      return;
    }

    console.log('[CRON] Starting scheduled content generation...');
    pipelineRunning = true;

    try {
      const batch = await runContentPipeline('cron');
      console.log(`[CRON] Generated batch ${batch.id} with ${batch.items.length} items`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[CRON] Pipeline failed:', msg);
    } finally {
      pipelineRunning = false;
    }
  });

  console.log(`[CRON] Content generation scheduled: "${schedule}"`);
}

setupCron();

// ============================================================================
// Content Batch Endpoints
// ============================================================================

// List all batches (metadata only)
app.get('/api/content/batches', (_req, res) => {
  try {
    const batches = listBatches();
    res.json({ batches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Get a single batch with all items
app.get('/api/content/batches/:batchId', (req, res) => {
  try {
    const batch = loadBatch(req.params.batchId);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    res.json({ batch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Manually trigger content generation
app.post('/api/content/batches/generate', async (_req, res) => {
  if (pipelineRunning) {
    res.status(409).json({ error: 'Pipeline is already running. Please wait.' });
    return;
  }

  pipelineRunning = true;
  try {
    const batch = await runContentPipeline('manual');
    res.json({ batch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  } finally {
    pipelineRunning = false;
  }
});

// Approve or reject a single item
app.patch('/api/content/batches/:batchId/items/:tempId', (req, res) => {
  const { status } = req.body;
  if (status !== 'approved' && status !== 'rejected') {
    res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    return;
  }

  try {
    const batch = updateBatchItemStatus(req.params.batchId, req.params.tempId, status);
    if (!batch) {
      res.status(404).json({ error: 'Batch or item not found' });
      return;
    }
    res.json({ batch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Approve all pending items in a batch
app.patch('/api/content/batches/:batchId/approve-all', (req, res) => {
  try {
    const batch = approveAllItems(req.params.batchId);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    res.json({ batch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Get approved items as ContentItem[] (ready to merge into frontend)
app.get('/api/content/batches/:batchId/approved', (req, res) => {
  try {
    const items = getApprovedItems(req.params.batchId);
    res.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ============================================================================
// Server Settings Endpoints
// ============================================================================

app.get('/api/settings/server', (_req, res) => {
  try {
    const settings = loadServerSettings();
    res.json({ settings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

app.put('/api/settings/server', (req, res) => {
  try {
    const current = loadServerSettings();
    const updated = { ...current, ...req.body };
    saveServerSettings(updated);

    // Restart cron if schedule changed
    if (req.body.cronSchedule) {
      setupCron();
    }

    res.json({ settings: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ============================================================================
// Cron Log Endpoint
// ============================================================================

app.get('/api/cron/log', (_req, res) => {
  try {
    const log = getCronLog();
    res.json({ log });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ============================================================================
// LinkedIn OAuth (existing)
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
    scope: 'openid profile w_member_social',
    state: crypto.randomUUID(),
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

app.get('/api/linkedin/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    res.redirect(`${FRONTEND_URL}?linkedin_error=${error || 'no_code'}`);
    return;
  }

  try {
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
    const expiresIn = tokenData.expires_in;

    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let linkedinSub = '';
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      linkedinSub = profile.sub || '';
    }

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

app.post('/api/linkedin/post', async (req, res) => {
  const { accessToken, authorUrn, authorType, text } = req.body;

  if (!accessToken || !authorUrn || !text) {
    res.status(400).json({ error: 'Missing required fields: accessToken, authorUrn, text' });
    return;
  }

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
  console.log(`\n🚀 Marketing Command Center API running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET    /api/content/batches              — List all batches`);
  console.log(`  GET    /api/content/batches/:id          — Get batch details`);
  console.log(`  POST   /api/content/batches/generate     — Trigger content generation`);
  console.log(`  PATCH  /api/content/batches/:id/items/:t — Approve/reject item`);
  console.log(`  PATCH  /api/content/batches/:id/approve-all — Approve all items`);
  console.log(`  GET    /api/content/batches/:id/approved — Get approved items`);
  console.log(`  GET    /api/settings/server              — Get server settings`);
  console.log(`  PUT    /api/settings/server              — Update server settings`);
  console.log(`  GET    /api/cron/log                     — View cron execution log`);
  console.log(`  GET    /api/linkedin/auth                — LinkedIn OAuth`);
  console.log(``);

  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    console.warn('⚠ LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set in .env');
  }
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('⚠ CLAUDE_API_KEY not set in .env — content generation will fail');
  }
});
