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
  findUserById
} from './db/mongodb.js';
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

// Connect to MongoDB
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
  return new Promise((resolve, reject) => {
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

  /* ================= REST API ROUTES (MONGODB) ================= */
  if (reqPath.startsWith('/api/')) {
    console.log(`[API Request] ${req.method} ${reqPath}`);
    try {
      // 1. Database Health & Connection Status
      if (reqPath === '/api/db-status' && req.method === 'GET') {
        return sendJSON(res, 200, getDBStatus());
      }

      /* ================= AUTHENTICATION ROUTES ================= */
      // Register New Account
      if (reqPath === '/api/auth/register' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const { fullName, username, email, password, division, department } = payload;

        if (!email || !password || !username) {
          return sendJSON(res, 400, { error: 'Email, username, and password are required.' });
        }

        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
          return sendJSON(res, 409, { error: 'An account with this email address already exists.' });
        }

        const existingUser = await findUserByUsername(username);
        if (existingUser) {
          return sendJSON(res, 409, { error: 'This username is already taken. Please choose another.' });
        }

        const user = await createUser({
          fullName: fullName || username,
          username,
          email,
          password,
          division: division || 'campus',
          department: department || ''
        });

        const token = 'korg_token_' + Buffer.from(email + ':' + Date.now()).toString('base64');
        return sendJSON(res, 201, { success: true, message: 'Account created successfully!', user, token });
      }

      // Log In to Existing Account
      if (reqPath === '/api/auth/login' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const identifier = payload.email || payload.username || payload.identifier;
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

      // Continue with Google (Social Auth & Fast Demo Login)
      if (reqPath === '/api/auth/google' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const googleEmail = payload.email || 'rpmohit9@gmail.com';
        const googleName = payload.name || 'Mohit Gupta';
        const googleUsername = payload.username || (googleEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'gamer');
        const googleAvatar = payload.avatar || '🦊';

        let user = await findUserByEmail(googleEmail);
        if (!user) {
          user = await createUser({
            fullName: googleName,
            username: googleUsername,
            email: googleEmail,
            password: 'google_oauth_verified_' + Math.random(),
            division: 'campus',
            department: 'Computer Science & AI',
            avatar: googleAvatar
          });
        }

        const token = 'korg_google_' + Buffer.from(googleEmail + ':' + Date.now()).toString('base64');
        return sendJSON(res, 200, { 
          success: true, 
          message: 'Signed in with Google successfully!', 
          user: { 
            id: user.id || user._id, 
            fullName: user.fullName || googleName, 
            username: user.username || googleUsername, 
            email: user.email || googleEmail, 
            avatar: user.avatar || googleAvatar 
          },
          token 
        });
      }

      // Get Current User Profile
      if (reqPath === '/api/auth/me' && req.method === 'GET') {
        const authHeader = req.headers['authorization'] || '';
        const emailQuery = parsedUrl.searchParams.get('email');
        let user = null;

        if (emailQuery) {
          user = await findUserByEmail(emailQuery);
        } else if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '');
          // Demo lookup: extract email from base64 token if available
          try {
            const raw = token.replace('korg_token_', '').replace('korg_google_', '');
            const decoded = Buffer.from(raw, 'base64').toString('utf8');
            const tokenEmail = decoded.split(':')[0];
            if (tokenEmail) user = await findUserByEmail(tokenEmail);
          } catch (e) {}
        }

        if (user) {
          const { password, _id, ...safe } = user;
          return sendJSON(res, 200, { success: true, user: safe });
        }
        return sendJSON(res, 401, { error: 'Not authenticated' });
      }

      // 2. Tournaments
      if (reqPath === '/api/tournaments' && req.method === 'GET') {
        const tournaments = await getTournaments();
        return sendJSON(res, 200, { success: true, data: tournaments });
      }

      // 3. Player IGN Verification (Axios verifyPlayerGameID)
      if (reqPath === '/api/verify-player') {
        let gameType = '';
        let playerId = '';
        if (req.method === 'GET') {
          gameType = parsedUrl.searchParams.get('gameType') || '';
          playerId = parsedUrl.searchParams.get('playerId') || '';
        } else if (req.method === 'POST') {
          const payload = await parseRequestBody(req);
          gameType = payload.gameType || '';
          playerId = payload.playerId || '';
        }
        const verification = await verifyPlayerGameID(gameType, playerId);
        return sendJSON(res, 200, { success: verification.isValid, ...verification });
      }

      // 4. Team & Player Registrations (GET & POST)
      if (reqPath === '/api/tournaments/registrations' && req.method === 'GET') {
        const registrations = await getRegistrations();
        return sendJSON(res, 200, { success: true, data: registrations });
      }

      if (reqPath === '/api/tournaments/register' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.teamName && !payload.playerName && !payload.captain) {
          return sendJSON(res, 400, { error: 'Team name or player name is required' });
        }

        // Automatic verification check if player ID provided
        if (payload.gameType && payload.playerId) {
          const verification = await verifyPlayerGameID(payload.gameType, payload.playerId);
          payload.verifiedIGN = verification.isValid ? verification.username : (payload.captain || payload.playerName);
          payload.isVerified = verification.isValid;
          payload.verificationSource = verification.source || 'verified';
        }

        const saved = await saveRegistration(payload);
        return sendJSON(res, 201, { success: true, data: saved });
      }

      // 4. Match Votes / Cheers
      if (reqPath === '/api/tournaments/vote' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.matchId || !payload.team) {
          return sendJSON(res, 400, { error: 'MatchId and team are required' });
        }
        const result = await recordVote(payload.matchId, payload.team);
        return sendJSON(res, 200, result);
      }

      // 5. Chat Messages (GET & POST)
      if (reqPath === '/api/chat' && req.method === 'GET') {
        const msgs = await getChatMessages();
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

      return sendJSON(res, 404, { error: 'API endpoint not found' });
    } catch (err) {
      console.error('[API Error]:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  }

  /* ================= STATIC ASSET SERVER ================= */
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

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

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Kogofox Arena Server running at http://localhost:${PORT}`);
    console.log(`MongoDB REST API available at http://localhost:${PORT}/api/db-status`);
  });
}

export default server;
