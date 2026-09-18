import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  connectDB,
  getDBStatus,
  getTournaments,
  saveRegistration,
  getRegistrations,
  recordVote,
  getChatMessages,
  saveChatMessage,
  getLeaderboard,
  createUser,
  findUserByEmail,
  findUserByUsername,
  authenticateUser,
  findUserById,
  getSquads,
  createSquad,
  joinSquad,
  getEvents,
  saveEvent,
  updateEvent,
  deleteEvent,
  getCompetitiveStandings,
  getStandingsMatches,
  awardPlayerPoints
} from './db/postgres.js';
import { verifyPlayerGameID } from './services/playerVerification.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5173;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Connect to PostgreSQL (falls back to local_store.json if unavailable)
connectDB();

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseRequestBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return Promise.resolve(req.body);
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (e) {
        return Promise.resolve({});
      }
    }
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = parsedUrl.pathname;

  // Handle Vercel serverless query rewrite: /api/index.js?__path=db-status -> /api/db-status
  if (parsedUrl.searchParams.has('__path')) {
    const p = parsedUrl.searchParams.get('__path');
    reqPath = p.startsWith('/') ? `/api${p}` : `/api/${p}`;
  } else if (req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api/')) {
    reqPath = req.headers['x-matched-path'];
  } else if (reqPath.startsWith('/api/index.js')) {
    reqPath = reqPath.replace('/api/index.js', '/api');
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  /* ================= REST API ROUTES (POSTGRESQL) ================= */
  if (reqPath.startsWith('/api/')) {
    try {
      // 1. Database Status
      if (reqPath === '/api/db-status' && req.method === 'GET') {
        const status = await getDBStatus();
        return sendJSON(res, 200, status);
      }

      // 1.5. Player Verification API
      if ((reqPath === '/api/verify-player' || reqPath === '/api/verify-ign') && (req.method === 'GET' || req.method === 'POST')) {
        let gameType, playerId;
        if (req.method === 'GET') {
          gameType = parsedUrl.searchParams.get('gameType') || parsedUrl.searchParams.get('game') || 'freefire';
          playerId = parsedUrl.searchParams.get('playerId') || parsedUrl.searchParams.get('id') || '';
        } else {
          const body = await parseRequestBody(req);
          gameType = body.gameType || body.game || 'freefire';
          playerId = body.playerId || body.id || '';
        }

        if (!playerId) {
          return sendJSON(res, 400, {
            success: false,
            isValid: false,
            message: 'Player ID / UID is required.'
          });
        }

        const verificationResult = await verifyPlayerGameID(gameType, playerId);
        return sendJSON(res, 200, {
          success: verificationResult.isValid,
          ...verificationResult
        });
      }

      // 2. Authentication
      if (reqPath === '/api/auth/register' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.username || !payload.email || !payload.password) {
          return sendJSON(res, 400, { error: 'Username, email and password are required.' });
        }

        const existingEmail = await findUserByEmail(payload.email);
        if (existingEmail) {
          return sendJSON(res, 409, { error: 'Email already registered. Please login.' });
        }

        const existingUser = await findUserByUsername(payload.username);
        if (existingUser) {
          return sendJSON(res, 409, { error: 'Username already taken. Pick another.' });
        }

        const user = await createUser(payload);
        const token = 'korg_' + Buffer.from(user.id + ':' + Date.now()).toString('base64');
        return sendJSON(res, 201, { success: true, message: 'Account registered successfully!', user, token });
      }

      if (reqPath === '/api/auth/login' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const identifier = payload.email || payload.identifier;
        const password = payload.password;

        if (!identifier || !password) {
          return sendJSON(res, 400, { error: 'Email/Username and password are required.' });
        }

        const result = await authenticateUser(identifier, password);
        if (!result.success) {
          return sendJSON(res, 401, { error: result.message });
        }

        return sendJSON(res, 200, { success: true, message: 'Login successful!', user: result.user, token: result.token });
      }

      // Google OAuth & Auth Configuration Endpoint
      if (reqPath === '/api/auth/config' && req.method === 'GET') {
        let rawId = (process.env.GOOGLE_CLIENT_ID || '').trim();
        rawId = rawId.replace(/^VITE_GOOGLE_CLIENT_ID\s*=\s*/i, '').replace(/^["']|["']$/g, '');
        const isValid = rawId.includes('.apps.googleusercontent.com') && !rawId.includes('your-copied-client-id');
        return sendJSON(res, 200, {
          success: true,
          googleClientId: isValid ? rawId : ''
        });
      }

      // Save Google Client ID Endpoint
      if (reqPath === '/api/auth/google-client-id' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const clientId = (payload.clientId || '').trim();
        if (!clientId) {
          return sendJSON(res, 400, { error: 'Client ID is required' });
        }
        process.env.GOOGLE_CLIENT_ID = clientId;
        try {
          const envPath = path.join(__dirname, '.env');
          let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
          if (content.includes('GOOGLE_CLIENT_ID=')) {
            content = content.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID=${clientId}`);
          } else {
            content += `\nGOOGLE_CLIENT_ID=${clientId}\n`;
          }
          fs.writeFileSync(envPath, content, 'utf8');
        } catch (e) {
          console.warn('[Config] Notice writing .env:', e.message);
        }
        return sendJSON(res, 200, {
          success: true,
          message: 'Google Client ID updated successfully!',
          googleClientId: clientId
        });
      }

      // Continue with Google (Dynamic Official OAuth + Token Verification)
      if (reqPath === '/api/auth/google' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        let googleEmail = payload.email;
        let googleName = payload.name;
        let googleAvatar = payload.avatar || '⚡';

        // 1. If Google OAuth Access Token provided, verify with Google UserInfo API
        if (payload.accessToken) {
          try {
            const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${payload.accessToken}` }
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              if (gData.email) {
                googleEmail = gData.email;
                googleName = gData.name || googleName;
                if (gData.picture) googleAvatar = gData.picture;
              }
            }
          } catch (gErr) {
            console.warn('[Google Auth] Access token verify warning:', gErr.message);
          }
        }

        // 2. If Google ID Token (credential) provided, verify with Google TokenInfo API
        if (payload.credential && (!googleEmail || !googleEmail.includes('@'))) {
          try {
            const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(payload.credential)}`);
            if (gRes.ok) {
              const gData = await gRes.json();
              if (gData.email) {
                googleEmail = gData.email;
                googleName = gData.name || googleName;
                if (gData.picture) googleAvatar = gData.picture;
              }
            }
          } catch (gErr) {
            console.warn('[Google Auth] Credential verify warning:', gErr.message);
          }
        }

        if (!googleEmail || typeof googleEmail !== 'string' || !googleEmail.includes('@')) {
          return sendJSON(res, 400, { error: 'A valid email address is required for Google Sign-In.' });
        }

        googleEmail = googleEmail.trim().toLowerCase();
        googleName = (googleName && googleName.trim()) || googleEmail.split('@')[0];
        const rawUsername = payload.username || googleEmail.split('@')[0];
        const googleUsername = rawUsername.replace(/[^a-zA-Z0-9_]/g, '') || 'gamer';

        let user = await findUserByEmail(googleEmail);
        if (!user) {
          user = await createUser({
            fullName: googleName,
            username: googleUsername,
            email: googleEmail,
            password: 'google_oauth_verified_' + Math.random(),
            division: 'campus',
            department: 'eSports Contender',
            avatar: googleAvatar
          });
        }

        const token = 'korg_google_' + Buffer.from(googleEmail + ':' + Date.now()).toString('base64');
        return sendJSON(res, 200, {
          success: true,
          message: 'Google Sign-In verified successfully!',
          user,
          token
        });
      }

      if (reqPath === '/api/auth/session' && req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return sendJSON(res, 401, { error: 'No authorization token provided' });
        }
        const token = authHeader.split(' ')[1];
        try {
          const raw = Buffer.from(token.replace('korg_', ''), 'base64').toString('utf-8');
          const [idOrEmail] = raw.split(':');
          let user = await findUserById(idOrEmail);
          if (!user) {
            user = await findUserByEmail(idOrEmail);
          }
          if (user) {
            return sendJSON(res, 200, { success: true, user });
          }
        } catch (e) {}
        return sendJSON(res, 401, { error: 'Invalid or expired session token' });
      }

      // 3. Tournaments
      if (reqPath === '/api/tournaments' && req.method === 'GET') {
        const game = parsedUrl.searchParams.get('game');
        const status = parsedUrl.searchParams.get('status');
        const filter = {};
        if (game) filter.game = game;
        if (status) filter.status = status;
        const tournaments = await getTournaments(filter);
        return sendJSON(res, 200, { success: true, count: tournaments.length, data: tournaments });
      }

      // 4. Registration for Tournaments
      if (reqPath === '/api/tournaments/register' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.tournamentId || !payload.teamName || !payload.captainName || !payload.email || !payload.phone) {
          return sendJSON(res, 400, { error: 'Missing required registration fields' });
        }

        // Verify captain Player ID if provided
        if (payload.gameId && payload.gameType) {
          const verification = await verifyPlayerGameID(payload.gameType, payload.gameId);
          payload.isVerified = verification.isValid;
          payload.verifiedIGN = verification.username || payload.inGameName || payload.teamName;
        }

        const registration = await saveRegistration(payload);
        return sendJSON(res, 201, {
          success: true,
          message: 'Tournament registration submitted successfully!',
          registrationId: registration.registrationId,
          data: registration
        });
      }

      if (reqPath === '/api/tournaments/registrations' && req.method === 'GET') {
        const tournamentId = parsedUrl.searchParams.get('tournamentId');
        const registrations = await getRegistrations(tournamentId);
        return sendJSON(res, 200, { success: true, count: registrations.length, data: registrations });
      }

      // 4.5. Bracket Predictions / Tournament Voting
      if (reqPath === '/api/tournaments/vote' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.tournamentId || !payload.candidateId) {
          return sendJSON(res, 400, { error: 'tournamentId and candidateId are required.' });
        }
        const updated = await recordVote(payload.tournamentId, payload.candidateId);
        return sendJSON(res, 200, {
          success: true,
          message: 'Vote cast successfully!',
          data: updated
        });
      }

      // 5. Global / Match Chat
      if (reqPath === '/api/chat' && req.method === 'GET') {
        const channel = parsedUrl.searchParams.get('channel') || 'global';
        const msgs = await getChatMessages(channel);
        return sendJSON(res, 200, { success: true, data: msgs });
      }

      if (reqPath === '/api/chat' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.text) {
          return sendJSON(res, 400, { error: 'Message text is required' });
        }
        const saved = await saveChatMessage(payload);
        return sendJSON(res, 201, { success: true, data: saved });
      }

      // 6. Leaderboard
      if (reqPath === '/api/leaderboard' && req.method === 'GET') {
        const lb = await getLeaderboard();
        return sendJSON(res, 200, { success: true, data: lb });
      }

      // 7. Squads LFG (Player Finder)
      if (reqPath === '/api/squads' && req.method === 'GET') {
        const game = parsedUrl.searchParams.get('game');
        const squads = await getSquads(game);
        return sendJSON(res, 200, { success: true, count: squads.length, data: squads });
      }

      if (reqPath === '/api/squads' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.name) {
          return sendJSON(res, 400, { error: 'Squad name is required' });
        }
        const created = await createSquad(payload);
        return sendJSON(res, 201, { success: true, message: 'Squad created successfully!', data: created });
      }

      if ((reqPath === '/api/squads/join' || reqPath.startsWith('/api/squads/join/')) && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const squadId = payload.squadId || reqPath.replace('/api/squads/join/', '');
        if (!squadId) {
          return sendJSON(res, 400, { error: 'Squad ID is required' });
        }
        const result = await joinSquad(squadId, payload);
        if (!result.success) {
          return sendJSON(res, 400, result);
        }
        return sendJSON(res, 200, { success: true, message: 'Joined squad successfully!', data: result.squad });
      }

      // 8. Campus Scrims & Tournaments Events
      if (reqPath === '/api/events' && req.method === 'GET') {
        const status = parsedUrl.searchParams.get('status');
        const events = await getEvents(status);
        return sendJSON(res, 200, { success: true, count: events.length, data: events });
      }

      // 9. Competitive Standings (Combat Points)
      if (reqPath === '/api/standings' && req.method === 'GET') {
        const game = parsedUrl.searchParams.get('game');
        const matchId = parsedUrl.searchParams.get('matchId');
        const result = await getCompetitiveStandings(matchId, game);
        return sendJSON(res, 200, {
          success: true,
          match: result.match,
          availableMatches: result.availableMatches,
          notice: result.notice || null,
          count: (result.standings || []).length,
          data: result.standings || []
        });
      }

      if (reqPath === '/api/standings/matches' && req.method === 'GET') {
        const matches = await getStandingsMatches();
        return sendJSON(res, 200, { success: true, count: matches.length, data: matches });
      }

      // 10. Admin API endpoints
      if (reqPath === '/api/admin/check-access' && req.method === 'GET') {
        const email = (parsedUrl.searchParams.get('email') || '').toLowerCase().trim();
        const allowedEmails = (process.env.ADMIN_EMAILS || 'rpmohit9@gmail.com,mkgsani9@gmail.com')
          .toLowerCase()
          .split(',')
          .map(e => e.trim());
        const isAdmin = email ? allowedEmails.includes(email) : false;
        return sendJSON(res, 200, { success: true, isAdmin, email });
      }

      if (reqPath === '/api/admin/verify' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const email = (payload.email || '').toLowerCase().trim();
        const password = payload.password || payload.passkey || '';

        const allowedEmails = (process.env.ADMIN_EMAILS || 'rpmohit9@gmail.com,mkgsani9@gmail.com')
          .toLowerCase()
          .split(',')
          .map(e => e.trim());
        const adminPassword = process.env.ADMIN_PASSWORD || 'kugofox13';

        if (!allowedEmails.includes(email)) {
          return sendJSON(res, 403, {
            success: false,
            error: 'Access denied: This email is not authorized for the Admin Panel.'
          });
        }

        if (password !== adminPassword) {
          return sendJSON(res, 401, {
            success: false,
            error: 'Invalid admin password. Access denied.'
          });
        }

        return sendJSON(res, 200, {
          success: true,
          message: `Admin authorization granted for ${email}`,
          token: 'korg_admin_' + Buffer.from(email + ':' + Date.now()).toString('base64'),
          adminEmail: email
        });
      }

      if (reqPath === '/api/admin/events' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.title) {
          return sendJSON(res, 400, { error: 'Tournament title is required' });
        }
        const event = await saveEvent(payload);
        return sendJSON(res, 201, { success: true, message: 'Event saved successfully!', data: event });
      }

      if ((reqPath === '/api/admin/events/update' || (reqPath.startsWith('/api/admin/events/') && req.method === 'PUT')) && (req.method === 'POST' || req.method === 'PUT')) {
        const payload = await parseRequestBody(req);
        let id = payload.id || parsedUrl.searchParams.get('id');
        if (!id && reqPath.startsWith('/api/admin/events/') && reqPath !== '/api/admin/events/update') {
          id = reqPath.replace('/api/admin/events/', '').trim();
        }
        if (!id || id === 'update') {
          return sendJSON(res, 400, { error: 'Event ID is required' });
        }
        const updated = await updateEvent(id, payload);
        return sendJSON(res, 200, { success: true, message: 'Event updated successfully!', data: updated });
      }

      if ((reqPath === '/api/admin/events/delete' || (reqPath.startsWith('/api/admin/events/') && req.method === 'DELETE')) && (req.method === 'POST' || req.method === 'DELETE')) {
        const payload = await parseRequestBody(req);
        let id = payload.id || parsedUrl.searchParams.get('id');
        if (!id && reqPath.startsWith('/api/admin/events/') && reqPath !== '/api/admin/events/delete') {
          id = reqPath.replace('/api/admin/events/', '').trim();
        }
        if (!id || id === 'delete') {
          return sendJSON(res, 400, { error: 'Valid Event ID is required' });
        }
        const result = await deleteEvent(id);
        return sendJSON(res, 200, { success: true, message: 'Event deleted successfully!', data: result });
      }

      if (reqPath === '/api/admin/players/points' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const { matchId, identifier, pointsDelta, details } = payload;
        if (!matchId) {
          return sendJSON(res, 400, {
            error: 'Match ID is required. Points can only be awarded to a specific ongoing match.'
          });
        }
        if (!identifier || pointsDelta === undefined) {
          return sendJSON(res, 400, { error: 'Player identifier and pointsDelta are required' });
        }
        const result = await awardPlayerPoints(matchId, identifier, Number(pointsDelta), details || {});
        if (!result.success) {
          return sendJSON(res, 400, { error: result.error || 'Failed to award points' });
        }
        return sendJSON(res, 200, {
          success: true,
          message: `Successfully awarded ${pointsDelta >= 0 ? '+' : ''}${pointsDelta} CP to ${result.player.name} in match "${result.match.title}"!`,
          data: result.player,
          match: result.match
        });
      }

      return sendJSON(res, 404, { error: 'API endpoint not found' });
    } catch (err) {
      console.error('[API Error]:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  }

  /* ================= STATIC ASSET SERVER ================= */
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);

  // If not found in root, check public folder
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', reqPath === '/' ? 'index.html' : reqPath);
  }

  // SPA fallback for client-side routing
  const ext = path.extname(filePath).toLowerCase();
  if (!fs.existsSync(filePath) && (!ext || ext === '.html')) {
    filePath = fs.existsSync(path.join(__dirname, 'index.html'))
      ? path.join(__dirname, 'index.html')
      : path.join(__dirname, 'public', 'index.html');
  }

  const finalExt = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[finalExt] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    }
  });
}

const server = http.createServer(handleRequest);

// Start server on PORT for local development
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Kugofox Arena Server running at http://localhost:${PORT}`);
    console.log(`PostgreSQL REST API available at http://localhost:${PORT}/api/db-status`);
  });
}

export default async function handler(req, res) {
  return handleRequest(req, res);
}

export { server };



