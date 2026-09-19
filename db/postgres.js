/**
 * Kugofox Gaming Arena - PostgreSQL Database Layer
 * Connects to PostgreSQL (Local or Cloud: Neon, Supabase, Render, AWS RDS)
 * Provides resilient connection pooling, auto-schema migration, and fallback storage
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOURNAMENTS_DATA } from '../js/data/tournamentsData.js';
import { LEADERBOARD_DATA } from '../js/data/leaderboardData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORE_FILE = path.join(__dirname, 'local_store.json');
export const STANDINGS_RETENTION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days retention for completed match standings

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || '';
const PGHOST = process.env.PGHOST || 'localhost';
const PGPORT = parseInt(process.env.PGPORT || '5432', 10);
const PGUSER = process.env.PGUSER || 'postgres';
const PGPASSWORD = process.env.PGPASSWORD || '';
const PGDATABASE = process.env.PGDATABASE || 'kugofox_arena';

let pool = null;
let isConnected = false;
let connectionError = null;
let connectingPromise = null;
let lastAttemptTime = 0;
const RETRY_COOLDOWN_MS = 30000;

export const INITIAL_SQUADS = [];

export const INITIAL_EVENTS = [
  {
    id: "ev-1",
    title: "FREEFIRE CHAMPIONSHIP",
    badge: "TOURNAMENT",
    tag: "OPEN FOR ALL",
    game: "freefire",
    gameName: "Free Fire",
    date: "Thursday, 24 Sep 2026, 6:30 PM IST",
    prizePool: "₹400",
    maxSquads: 24,
    registeredSquads: 0,
    status: "upcoming",
    completedAt: null,
    expiresAt: null,
    description: "Official collegiate squad championship. 24 teams battle across Bermuda & Purgatory for the prize pool.",
    icon: "assets/logos/freefire.png"
  },
  {
    id: "ev-2",
    title: "BGMI BATTLEGROUND CLASH",
    badge: "SCRIMS",
    tag: "OPEN FOR ALL",
    game: "bgmi",
    gameName: "BGMI",
    date: "Friday, 25 Sep 2026, 8:00 PM IST",
    prizePool: "₹1,200",
    maxSquads: 25,
    registeredSquads: 14,
    status: "upcoming",
    completedAt: null,
    expiresAt: null,
    description: "High-octane Erangel squad custom rooms with point multipliers.",
    icon: "assets/logos/bgmi.png"
  },
  {
    id: "ev-3",
    title: "CAMPUS VALORANT SHOWDOWN",
    badge: "TOURNAMENT",
    tag: "CAMPUS EXCLUSIVE",
    game: "valorant",
    gameName: "Valorant",
    date: "Completed on 10 Sep 2026",
    prizePool: "₹2,500",
    maxSquads: 16,
    registeredSquads: 16,
    status: "completed",
    winner: "Sentinels X",
    completedAt: new Date(Date.now() - 7 * 86400000),
    expiresAt: new Date(Date.now() + 3 * 86400000),
    description: "Collegiate single-elimination tournament across Haven & Ascent.",
    icon: "assets/logos/valorant.png"
  },
  {
    id: "ev-4",
    title: "MOBA 5V5 DRAFT CUP",
    badge: "CUSTOM",
    tag: "VERIFIED TEAMS",
    game: "mobalegends",
    gameName: "Mobile Legends",
    date: "Completed on 15 Sep 2026",
    prizePool: "₹1,000",
    maxSquads: 8,
    registeredSquads: 8,
    status: "completed",
    winner: "Kugofox Mystic",
    completedAt: new Date(Date.now() - 2 * 86400000),
    expiresAt: new Date(Date.now() + 8 * 86400000),
    description: "Ranked 5v5 draft tournament with verified collegiate rosters.",
    icon: "assets/logos/mobalegends.png"
  },
  {
    id: "ev-5",
    title: "VALORANT RADIANT INVITATIONAL",
    badge: "TOURNAMENT",
    tag: "CAMPUS EXCLUSIVE",
    game: "valorant",
    gameName: "Valorant",
    date: "Saturday, 26 Sep 2026, 7:00 PM IST",
    prizePool: "₹2,500",
    maxSquads: 16,
    registeredSquads: 10,
    status: "upcoming",
    completedAt: null,
    expiresAt: null,
    description: "Premier 5v5 collegiate tournament across Lotus, Haven, and Ascent.",
    icon: "assets/logos/valorant.png"
  },
  {
    id: "ev-6",
    title: "MOBA LEGENDS COLLEGIATE BRAWL",
    badge: "SCRIMS",
    tag: "OPEN FOR ALL",
    game: "mobalegends",
    gameName: "Mobile Legends",
    date: "Sunday, 27 Sep 2026, 5:00 PM IST",
    prizePool: "₹1,500",
    maxSquads: 16,
    registeredSquads: 6,
    status: "upcoming",
    completedAt: null,
    expiresAt: null,
    description: "Weekly campus 5v5 draft scrims with real-time stats verification.",
    icon: "assets/logos/mobalegends.png"
  }
];

export const INITIAL_STANDINGS = [];

function loadLocalStore() {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Store] Could not load local_store.json:', e.message);
  }
  return null;
}

const persisted = loadLocalStore();
const fallbackStore = {
  tournaments: persisted?.tournaments || [...TOURNAMENTS_DATA],
  registrations: Array.isArray(persisted?.registrations) ? persisted.registrations : [],
  votes: persisted?.votes || {},
  chat: Array.isArray(persisted?.chat) ? persisted.chat : [],
  leaderboard: persisted?.leaderboard || {},
  users: Array.isArray(persisted?.users) ? persisted.users : [],
  squads: (persisted?.squads || []).filter(s => !['sq-1', 'sq-2', 'sq-3', 'sq-4', 'sq-5', 'sq-6', 'sq-7', 'sq-8', 'sq-9'].includes(s.id)),
  events: persisted?.events || JSON.parse(JSON.stringify(INITIAL_EVENTS)),
  standings: Array.isArray(persisted?.standings) ? persisted.standings : []
};

export function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(fallbackStore, null, 2), 'utf-8');
  } catch (e) {
    // Graceful fallback for read-only serverless filesystems
  }
}

export async function ensureConnected() {
  if (isConnected && pool) return pool;
  if (connectingPromise) return await connectingPromise;
  try {
    return await connectDB();
  } catch (e) {
    return null;
  }
}

/**
 * Configure & connect PostgreSQL pool
 */
export async function connectDB() {
  if (isConnected && pool) return pool;
  if (connectingPromise) return connectingPromise;

  if (Date.now() - lastAttemptTime < RETRY_COOLDOWN_MS) {
    return null;
  }

  lastAttemptTime = Date.now();
  connectingPromise = (async () => {
    try {
      let poolConfig = {};

      if (DATABASE_URL) {
        const isSslNeeded = DATABASE_URL.includes('sslmode=require') ||
          process.env.PGSSL === 'true' ||
          (!DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1'));

        poolConfig = {
          connectionString: DATABASE_URL,
          ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          max: 10
        };
      } else {
        const isLocal = PGHOST === 'localhost' || PGHOST === '127.0.0.1';
        poolConfig = {
          host: PGHOST,
          port: PGPORT,
          user: PGUSER,
          password: PGPASSWORD,
          database: PGDATABASE,
          ssl: isLocal ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          max: 10
        };
      }

      console.log(`[PostgreSQL] Connecting to ${poolConfig.connectionString ? poolConfig.connectionString.replace(/:[^:@]*@/, ':****@') : `${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`}...`);

      pool = new Pool(poolConfig);

      // Verify connection with test query
      const client = await pool.connect();
      client.release();

      isConnected = true;
      connectionError = null;
      console.log(`[PostgreSQL] Successfully connected to database: ${DATABASE_URL ? (DATABASE_URL.split('/').pop() || 'database').split('?')[0] : PGDATABASE}`);

      // Auto-migrate tables and seed initial data
      await initializeSchema();
      return pool;
    } catch (err) {
      isConnected = false;
      connectionError = err.message;
      console.warn(`[PostgreSQL] Notice: Could not connect (${err.message.split('\n')[0]}).`);
      console.warn(`[PostgreSQL] Running in Resilient Local Storage Mode.`);
      return null;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

/**
 * Auto-create PostgreSQL tables and seed if empty
 */
async function initializeSchema() {
  if (!isConnected || !pool) return;
  try {
    // 1. Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(120) PRIMARY KEY,
        full_name TEXT,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password TEXT,
        division VARCHAR(50),
        department TEXT,
        avatar TEXT,
        stats JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id VARCHAR(120) PRIMARY KEY,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(120) PRIMARY KEY,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(120) PRIMARY KEY,
        match_id VARCHAR(120),
        team_name TEXT,
        voted_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_name TEXT,
        badge TEXT,
        text TEXT,
        time TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS squads (
        id VARCHAR(120) PRIMARY KEY,
        name TEXT,
        game VARCHAR(50),
        game_name TEXT,
        type VARCHAR(50),
        status VARCHAR(50),
        mic_required BOOLEAN,
        total_slots INT,
        filled_slots INT,
        leader TEXT,
        color TEXT,
        letter VARCHAR(10),
        avatar_img TEXT,
        avatar_icon TEXT,
        roster JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(120) PRIMARY KEY,
        title TEXT,
        badge TEXT,
        tag TEXT,
        game VARCHAR(50),
        game_name TEXT,
        date TEXT,
        prize_pool TEXT,
        max_squads INT,
        registered_squads INT,
        status VARCHAR(50),
        description TEXT,
        icon TEXT,
        winner TEXT,
        completed_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS standings (
        id VARCHAR(120) PRIMARY KEY,
        match_id VARCHAR(120),
        match_title TEXT,
        rank INT,
        name TEXT,
        handle TEXT,
        dept TEXT,
        tier TEXT,
        matches INT,
        wins INT,
        best_finish TEXT,
        win_rate TEXT,
        cp INT,
        game VARCHAR(50),
        avatar TEXT,
        completed_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS _metadata (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Clean up any legacy pre-made squads
    try {
      await pool.query(`DELETE FROM squads WHERE id IN ('sq-1', 'sq-2', 'sq-3', 'sq-4', 'sq-5', 'sq-6', 'sq-7', 'sq-8', 'sq-9')`);
    } catch (cleanErr) {
      // ignore if table not yet populated
    }

    // 2. Check if seeded
    const metaCheck = await pool.query(`SELECT value FROM _metadata WHERE key = 'seeded_v1'`);
    if (metaCheck.rows.length > 0) {
      return;
    }

    console.log('[PostgreSQL] Initializing tables with default seed data...');

    // Seed tournaments
    if (Array.isArray(TOURNAMENTS_DATA)) {
      for (const t of TOURNAMENTS_DATA) {
        await pool.query(
          `INSERT INTO tournaments (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
          [t.id || 'tour-' + Math.random().toString(36).substring(2, 8), JSON.stringify(t)]
        );
      }
    }

    // Seed squads
    if (Array.isArray(INITIAL_SQUADS)) {
      for (const s of INITIAL_SQUADS) {
        await pool.query(
          `INSERT INTO squads (id, name, game, game_name, type, status, mic_required, total_slots, filled_slots, leader, color, letter, avatar_img, avatar_icon, roster)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING`,
          [
            s.id, s.name, s.game, s.gameName, s.type, s.status, s.micRequired,
            s.totalSlots, s.filledSlots, s.leader, s.color || null, s.letter || null,
            s.avatarImg || null, s.avatarIcon || null, JSON.stringify(s.roster || [])
          ]
        );
      }
    }

    // Seed events
    if (Array.isArray(INITIAL_EVENTS)) {
      for (const e of INITIAL_EVENTS) {
        await pool.query(
          `INSERT INTO events (id, title, badge, tag, game, game_name, date, prize_pool, max_squads, registered_squads, status, description, icon, winner, completed_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO NOTHING`,
          [
            e.id, e.title, e.badge, e.tag, e.game, e.gameName, e.date, e.prizePool,
            e.maxSquads, e.registeredSquads, e.status, e.description, e.icon,
            e.winner || '', e.completedAt || null, e.expiresAt || null
          ]
        );
      }
    }

    // Seed standings
    if (Array.isArray(INITIAL_STANDINGS)) {
      for (const st of INITIAL_STANDINGS) {
        await pool.query(
          `INSERT INTO standings (id, match_id, match_title, rank, name, handle, dept, tier, matches, wins, best_finish, win_rate, cp, game, avatar, completed_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO NOTHING`,
          [
            st.id, st.matchId, st.matchTitle, st.rank, st.name, st.handle, st.dept,
            st.tier, st.matches, st.wins, st.bestFinish, st.winRate, st.cp,
            st.game, st.avatar, st.completedAt || null, st.expiresAt || null
          ]
        );
      }
    }

    // Seed users from fallback if any
    if (Array.isArray(fallbackStore.users)) {
      for (const u of fallbackStore.users) {
        await pool.query(
          `INSERT INTO users (id, full_name, username, email, password, avatar, stats)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            u.id, u.fullName || '', u.username, u.email, u.password,
            u.avatar || '🦊', JSON.stringify(u.stats || {})
          ]
        );
      }
    }

    await pool.query(`INSERT INTO _metadata (key, value) VALUES ('seeded_v1', '{"seeded": true}') ON CONFLICT (key) DO NOTHING`);
    console.log('[PostgreSQL] Initial schema & seed completed successfully.');
  } catch (err) {
    console.error('[PostgreSQL] Schema initialization error:', err.message);
  }
}

export function getDBStatus() {
  const connectionUri = DATABASE_URL
    ? DATABASE_URL.replace(/:[^:@]*@/, ':****@')
    : `${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}`;

  return {
    connected: isConnected,
    engine: 'PostgreSQL',
    uri: connectionUri,
    dbName: DATABASE_URL ? (DATABASE_URL.split('/').pop() || 'database').split('?')[0] : PGDATABASE,
    status: isConnected ? 'Connected (PostgreSQL Engine)' : 'Standby Mode (Local Sync Active)',
    error: connectionError
  };
}

/* ================== TOURNAMENT REPOSITORY ================== */
export async function getTournaments() {
  if (isConnected && pool) {
    try {
      const res = await pool.query(`SELECT data FROM tournaments ORDER BY created_at DESC`);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => r.data);
      }
    } catch (e) {
      console.error('[PostgreSQL] Query tournaments error:', e.message);
    }
  }
  return fallbackStore.tournaments;
}

/* ================== REGISTRATIONS REPOSITORY ================== */
export async function saveRegistration(registration) {
  const regId = registration.id || 'reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const record = {
    ...registration,
    id: regId,
    createdAt: new Date()
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO registrations (id, data, created_at) VALUES ($1, $2, $3)`,
        [regId, JSON.stringify(record), record.createdAt]
      );
    } catch (e) {
      console.error('[PostgreSQL] Save registration error:', e.message);
    }
  }

  fallbackStore.registrations.unshift(record);
  saveLocalStore();
  return record;
}

export async function getRegistrations() {
  if (isConnected && pool) {
    try {
      const res = await pool.query(`SELECT data FROM registrations ORDER BY created_at DESC`);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => r.data);
      }
    } catch (e) {
      console.error('[PostgreSQL] Query registrations error:', e.message);
    }
  }
  return fallbackStore.registrations;
}

/* ================== VOTES / CHEERS REPOSITORY ================== */
export async function recordVote(matchId, teamName) {
  const voteId = 'vt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO votes (id, match_id, team_name, voted_at) VALUES ($1, $2, $3, NOW())`,
        [voteId, matchId, teamName]
      );
    } catch (e) {
      console.error('[PostgreSQL] Record vote error:', e.message);
    }
  }

  fallbackStore.votes[matchId] = teamName;
  saveLocalStore();
  return { success: true, matchId, teamName };
}

/* ================== CHAT REPOSITORY ================== */
export async function saveChatMessage(chatMsg) {
  const msg = {
    ...chatMsg,
    createdAt: new Date()
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO chat_messages (user_name, badge, text, time, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [msg.user || msg.username || 'Anonymous', msg.badge || '', msg.text, msg.time || '', msg.createdAt]
      );
    } catch (e) {
      console.error('[PostgreSQL] Save chat message error:', e.message);
    }
  }

  fallbackStore.chat.push(msg);
  if (fallbackStore.chat.length > 30) fallbackStore.chat.shift();
  saveLocalStore();
  return msg;
}

export async function getChatMessages() {
  if (isConnected && pool) {
    try {
      const res = await pool.query(`SELECT user_name as user, badge, text, time, created_at as "createdAt" FROM chat_messages ORDER BY id ASC LIMIT 30`);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (e) {
      console.error('[PostgreSQL] Query chat error:', e.message);
    }
  }
  return fallbackStore.chat;
}

/* ================== LEADERBOARD REPOSITORY ================== */
export async function getLeaderboard() {
  return fallbackStore.leaderboard;
}

/* ================== USER AUTHENTICATION REPOSITORY ================== */
export async function createUser(userData) {
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    fullName: userData.fullName || '',
    username: (userData.username || '').replace(/^@/, '').trim().toLowerCase(),
    email: (userData.email || '').trim().toLowerCase(),
    password: userData.password || '',
    avatar: userData.avatar || '🦊',
    createdAt: new Date(),
    stats: {
      matchesPlayed: 0,
      tournamentsWon: 0,
      rank: 'Contender I'
    }
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO users (id, full_name, username, email, password, avatar, stats, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          newUser.id, newUser.fullName, newUser.username, newUser.email,
          newUser.password, newUser.avatar, JSON.stringify(newUser.stats), newUser.createdAt
        ]
      );
    } catch (e) {
      console.error('[PostgreSQL] Create user error:', e.message);
    }
  }

  fallbackStore.users.push(newUser);
  saveLocalStore();
  return sanitizeUser(newUser);
}

export async function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", username, email, password, avatar, stats, created_at as "createdAt"
         FROM users WHERE LOWER(email) = $1`,
        [normalized]
      );
      if (res.rows && res.rows[0]) return res.rows[0];
    } catch (e) {
      console.error('[PostgreSQL] Find user by email error:', e.message);
    }
  }
  return fallbackStore.users.find(u => u.email.toLowerCase() === normalized) || null;
}

export async function findUserByUsername(username) {
  const clean = (username || '').replace(/^@/, '').trim().toLowerCase();
  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", username, email, password, avatar, stats, created_at as "createdAt"
         FROM users WHERE LOWER(username) = $1`,
        [clean]
      );
      if (res.rows && res.rows[0]) return res.rows[0];
    } catch (e) {
      console.error('[PostgreSQL] Find user by username error:', e.message);
    }
  }
  return fallbackStore.users.find(u => u.username.toLowerCase() === clean) || null;
}

export async function authenticateUser(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const strippedId = cleanId.replace(/^@/, '');

  let candidates = [];

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", username, email, password, avatar, stats, created_at as "createdAt"
         FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(username) = $2`,
        [cleanId, strippedId]
      );
      if (res.rows) candidates = res.rows;
    } catch (e) {
      console.error('[PostgreSQL] Query candidate users error:', e.message);
    }
  }

  if (!candidates || candidates.length === 0) {
    candidates = fallbackStore.users.filter(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.username || '').toLowerCase();
      return uEmail === cleanId || uName === cleanId || uName === strippedId;
    });
  }

  if (!candidates || candidates.length === 0) {
    return { success: false, message: 'Account not found with this email or username' };
  }

  const matchingUser = candidates.find(u => u.password === password);
  if (!matchingUser) {
    return { success: false, message: 'Invalid password. Please check and try again.' };
  }

  return {
    success: true,
    user: sanitizeUser(matchingUser),
    token: 'korg_token_' + Buffer.from(matchingUser.email + ':' + Date.now()).toString('base64')
  };
}

export async function findUserById(id) {
  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", username, email, password, avatar, stats, created_at as "createdAt"
         FROM users WHERE id = $1`,
        [id]
      );
      if (res.rows && res.rows[0]) return sanitizeUser(res.rows[0]);
    } catch (e) {
      console.error('[PostgreSQL] Query user by id error:', e.message);
    }
  }
  const u = fallbackStore.users.find(u => u.id === id);
  return u ? sanitizeUser(u) : null;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, division, department, ...safe } = user;
  if (safe.stats && safe.stats.kCoins !== undefined) {
    const { kCoins, ...cleanStats } = safe.stats;
    safe.stats = cleanStats;
  }
  return safe;
}

/* ================== SQUADS REPOSITORY ================== */
export async function getSquads(gameFilter = null) {
  if (isConnected && pool) {
    try {
      let query = `SELECT id, name, game, game_name as "gameName", type, status, mic_required as "micRequired",
                          total_slots as "totalSlots", filled_slots as "filledSlots", leader, color, letter,
                          avatar_img as "avatarImg", avatar_icon as "avatarIcon", roster
                   FROM squads`;
      const params = [];
      if (gameFilter && gameFilter !== 'all') {
        query += ` WHERE game = $1`;
        params.push(gameFilter);
      }
      query += ` ORDER BY created_at DESC`;
      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          ...r,
          roster: typeof r.roster === 'string' ? JSON.parse(r.roster) : (r.roster || [])
        }));
      }
    } catch (e) {
      console.error('[PostgreSQL] Query squads error:', e.message);
    }
  }

  if (gameFilter && gameFilter !== 'all') {
    return fallbackStore.squads.filter(s => s.game === gameFilter);
  }
  return fallbackStore.squads;
}

export async function createSquad(squadData) {
  const newSquad = {
    id: 'sq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name: squadData.name || 'New Squad',
    game: squadData.game || 'freefire',
    gameName: squadData.gameName || 'Free Fire',
    type: squadData.type || 'SQUAD',
    status: squadData.status || 'OPEN',
    micRequired: squadData.micRequired !== undefined ? !!squadData.micRequired : true,
    totalSlots: Number(squadData.totalSlots) || 4,
    filledSlots: 1,
    leader: squadData.leader || 'Leader',
    color: squadData.color || '#ff4655',
    letter: (squadData.name || 'S')[0].toUpperCase(),
    avatarImg: squadData.avatarImg || null,
    avatarIcon: squadData.avatarIcon || null,
    creatorId: squadData.creatorId || null,
    creatorEmail: squadData.creatorEmail || null,
    roster: squadData.roster || [
      { name: squadData.leader || 'Leader', role: 'Captain / IGL', avatar: squadData.avatar || '🎯' }
    ],
    createdAt: new Date()
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO squads (id, name, game, game_name, type, status, mic_required, total_slots, filled_slots, leader, color, letter, avatar_img, avatar_icon, roster, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          newSquad.id, newSquad.name, newSquad.game, newSquad.gameName, newSquad.type, newSquad.status,
          newSquad.micRequired, newSquad.totalSlots, newSquad.filledSlots, newSquad.leader, newSquad.color,
          newSquad.letter, newSquad.avatarImg, newSquad.avatarIcon, JSON.stringify(newSquad.roster), newSquad.createdAt
        ]
      );
    } catch (e) {
      console.error('[PostgreSQL] Create squad error:', e.message);
    }
  }

  fallbackStore.squads.unshift(newSquad);
  saveLocalStore();
  return newSquad;
}

export async function joinSquad(squadId, applicantData) {
  let squad = null;
  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `SELECT id, name, game, game_name as "gameName", type, status, mic_required as "micRequired",
                total_slots as "totalSlots", filled_slots as "filledSlots", leader, color, letter,
                avatar_img as "avatarImg", avatar_icon as "avatarIcon", roster
         FROM squads WHERE id = $1`,
        [squadId]
      );
      if (res.rows && res.rows[0]) {
        squad = {
          ...res.rows[0],
          roster: typeof res.rows[0].roster === 'string' ? JSON.parse(res.rows[0].roster) : (res.rows[0].roster || [])
        };
      }
    } catch (e) {
      console.error('[PostgreSQL] Find squad error:', e.message);
    }
  }

  if (!squad) {
    squad = fallbackStore.squads.find(s => s.id === squadId);
  }

  if (!squad) {
    return { success: false, message: 'Squad not found' };
  }

  if (squad.filledSlots >= squad.totalSlots) {
    return { success: false, message: 'Squad is already full' };
  }

  const applicant = {
    name: applicantData.name || applicantData.username || 'Applicant',
    role: applicantData.role || 'Member',
    avatar: applicantData.avatar || '🎮',
    joinedAt: new Date()
  };

  squad.roster = squad.roster || [];
  squad.roster.push(applicant);
  squad.filledSlots = squad.roster.length;
  if (squad.filledSlots >= squad.totalSlots) {
    squad.status = 'FULL';
  }

  if (isConnected && pool) {
    try {
      await pool.query(
        `UPDATE squads SET roster = $1, filled_slots = $2, status = $3 WHERE id = $4`,
        [JSON.stringify(squad.roster), squad.filledSlots, squad.status, squadId]
      );
    } catch (e) {
      console.error('[PostgreSQL] Update squad roster error:', e.message);
    }
  }

  const fbIdx = fallbackStore.squads.findIndex(s => s.id === squadId);
  if (fbIdx !== -1) {
    fallbackStore.squads[fbIdx] = squad;
  }
  saveLocalStore();

  return { success: true, squad, member: applicant };
}

/* ================== EVENTS & SCRIMS REPOSITORY ================== */
export async function getEvents(statusFilter = null) {
  await ensureConnected();

  if (isConnected && pool) {
    try {
      let query = `SELECT id, title, badge, tag, game, game_name as "gameName", date, prize_pool as "prizePool",
                          max_squads as "maxSquads", registered_squads as "registeredSquads", status, description,
                          icon, winner, completed_at as "completedAt", expires_at as "expiresAt", created_at as "createdAt"
                   FROM events`;
      const params = [];
      if (statusFilter && statusFilter !== 'all') {
        query += ` WHERE status = $1`;
        params.push(statusFilter);
      }
      query += ` ORDER BY created_at DESC`;
      const res = await pool.query(query, params);
      return res.rows || [];
    } catch (e) {
      console.error('[PostgreSQL] Query events error:', e.message);
    }
  }

  if (statusFilter && statusFilter !== 'all') {
    return fallbackStore.events.filter(e => e.status === statusFilter);
  }
  return fallbackStore.events;
}

export async function saveEvent(eventData) {
  await ensureConnected();

  const newEvent = {
    id: eventData.id || 'ev-' + Date.now(),
    title: eventData.title || 'New Tournament',
    badge: eventData.badge || 'TOURNAMENT',
    tag: eventData.tag || 'OPEN FOR ALL',
    game: eventData.game || 'freefire',
    gameName: eventData.gameName || 'Free Fire',
    date: eventData.date || 'TBD',
    prizePool: eventData.prizePool || '₹400',
    maxSquads: Number(eventData.maxSquads) || 24,
    registeredSquads: Number(eventData.registeredSquads) || 0,
    status: eventData.status || 'upcoming',
    description: eventData.description || '',
    icon: eventData.icon || 'assets/logos/freefire.png',
    winner: eventData.winner || '',
    createdAt: new Date(),
    completedAt: null,
    expiresAt: null
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO events (id, title, badge, tag, game, game_name, date, prize_pool, max_squads, registered_squads, status, description, icon, winner, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          newEvent.id, newEvent.title, newEvent.badge, newEvent.tag, newEvent.game, newEvent.gameName,
          newEvent.date, newEvent.prizePool, newEvent.maxSquads, newEvent.registeredSquads,
          newEvent.status, newEvent.description, newEvent.icon, newEvent.winner, newEvent.createdAt
        ]
      );
    } catch (e) {
      console.error('[PostgreSQL] Save event error:', e.message);
    }
  }

  fallbackStore.events.unshift(newEvent);
  saveLocalStore();
  return newEvent;
}

export async function updateEvent(id, updateData) {
  const cleanId = String(id || '').trim();
  await ensureConnected();

  // Status transitions: completed (10-day retention) or live (ongoing)
  if (updateData.status === 'completed') {
    if (!updateData.completedAt) updateData.completedAt = new Date();
    if (!updateData.expiresAt) {
      updateData.expiresAt = new Date(new Date(updateData.completedAt).getTime() + STANDINGS_RETENTION_MS);
    }
  } else if (updateData.status === 'live') {
    updateData.completedAt = null;
    updateData.expiresAt = null;
  }

  if (isConnected && pool) {
    try {
      const setClauses = [];
      const values = [cleanId];
      let paramIdx = 2;

      const mapping = {
        title: 'title', badge: 'badge', tag: 'tag', game: 'game', gameName: 'game_name',
        date: 'date', prizePool: 'prize_pool', maxSquads: 'max_squads', registeredSquads: 'registered_squads',
        status: 'status', description: 'description', icon: 'icon', winner: 'winner',
        completedAt: 'completed_at', expiresAt: 'expires_at'
      };

      for (const [key, val] of Object.entries(updateData)) {
        if (mapping[key]) {
          setClauses.push(`${mapping[key]} = $${paramIdx}`);
          values.push(val);
          paramIdx++;
        }
      }

      if (setClauses.length > 0) {
        await pool.query(
          `UPDATE events SET ${setClauses.join(', ')} WHERE id = $1`,
          values
        );
      }

      // Sync standings timestamps
      if (updateData.status === 'completed') {
        await pool.query(
          `UPDATE standings SET completed_at = $1, expires_at = $2 WHERE match_id = $3`,
          [updateData.completedAt, updateData.expiresAt, cleanId]
        );
      } else if (updateData.status === 'live') {
        await pool.query(
          `UPDATE standings SET completed_at = NULL, expires_at = NULL WHERE match_id = $1`,
          [cleanId]
        );
      }
    } catch (e) {
      console.error('[PostgreSQL] Update event error:', e.message);
    }
  }

  const idx = fallbackStore.events.findIndex(e => e.id === cleanId || e.id === id);
  if (idx !== -1) {
    fallbackStore.events[idx] = { ...fallbackStore.events[idx], ...updateData };
    const eventId = fallbackStore.events[idx].id;

    if (updateData.status === 'completed') {
      fallbackStore.standings.forEach(s => {
        if (s.matchId === eventId || s.matchId === cleanId) {
          s.completedAt = updateData.completedAt;
          s.expiresAt = updateData.expiresAt;
        }
      });
    } else if (updateData.status === 'live') {
      fallbackStore.standings.forEach(s => {
        if (s.matchId === eventId || s.matchId === cleanId) {
          s.completedAt = null;
          s.expiresAt = null;
        }
      });
    }

    saveLocalStore();
    return fallbackStore.events[idx];
  }

  saveLocalStore();
  return { id, ...updateData };
}

export async function deleteEvent(id) {
  const cleanId = String(id || '').trim();
  await ensureConnected();

  if (isConnected && pool) {
    try {
      await pool.query(`DELETE FROM events WHERE id = $1`, [cleanId]);
      await pool.query(`DELETE FROM standings WHERE match_id = $1`, [cleanId]);
    } catch (e) {
      console.error('[PostgreSQL] Delete event error:', e.message);
    }
  }

  fallbackStore.events = fallbackStore.events.filter(e => String(e.id || e._id) !== cleanId);
  fallbackStore.standings = fallbackStore.standings.filter(s => String(s.matchId) !== cleanId);
  saveLocalStore();
  return { success: true, id: cleanId };
}

/* ================== COMPETITIVE STANDINGS / POINTS REPOSITORY ================== */
export async function purgeExpiredStandings() {
  const now = new Date();

  if (isConnected && pool) {
    try {
      await pool.query(`DELETE FROM standings WHERE expires_at IS NOT NULL AND expires_at <= NOW()`);
    } catch (e) {
      console.error('[PostgreSQL] Purge expired standings error:', e.message);
    }
  }

  // Also purge from fallbackStore
  fallbackStore.standings = (fallbackStore.standings || []).filter(item => {
    if (!item.expiresAt) return true;
    const exp = new Date(item.expiresAt);
    return exp.getTime() > now.getTime();
  });
  saveLocalStore();
}

export async function getStandingsMatches() {
  await purgeExpiredStandings();
  const allEvents = await getEvents();
  const now = Date.now();

  const matches = allEvents.filter(ev => {
    if (ev.status === 'live') return true;
    if (ev.status === 'completed') {
      if (!ev.expiresAt && ev.completedAt) {
        ev.expiresAt = new Date(new Date(ev.completedAt).getTime() + STANDINGS_RETENTION_MS);
      }
      if (ev.expiresAt) {
        return new Date(ev.expiresAt).getTime() > now;
      }
      return true;
    }
    return false;
  });

  return matches.map(ev => {
    const isLive = ev.status === 'live';
    const isCompleted = ev.status === 'completed';
    let daysRemaining = null;
    if (isCompleted && ev.expiresAt) {
      const msLeft = new Date(ev.expiresAt).getTime() - now;
      daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    }
    return {
      id: ev.id,
      title: ev.title,
      game: ev.game,
      gameName: ev.gameName || ev.game,
      status: ev.status,
      prizePool: ev.prizePool,
      date: ev.date,
      isLive,
      isCompleted,
      daysRemaining,
      expiresAt: ev.expiresAt || null,
      completedAt: ev.completedAt || null
    };
  });
}

export async function getCompetitiveStandings(matchId = null, gameFilter = null) {
  await purgeExpiredStandings();
  const availableMatches = await getStandingsMatches();
  let targetMatch = null;

  if (matchId && matchId !== 'all') {
    targetMatch = availableMatches.find(m => m.id === matchId);
    if (!targetMatch) {
      const allEvents = await getEvents();
      targetMatch = allEvents.find(e => e.id === matchId) || null;
    }
  }

  if (!targetMatch && availableMatches.length > 0) {
    targetMatch = availableMatches.find(m => m.isLive) || availableMatches[0];
  }

  if (!targetMatch) {
    return {
      match: null,
      availableMatches,
      standings: []
    };
  }

  if (targetMatch.status === 'upcoming') {
    return {
      match: targetMatch,
      availableMatches,
      standings: [],
      notice: 'This match is upcoming. Standings will activate once the match goes Live!'
    };
  }

  let standingsList = [];

  if (isConnected && pool) {
    try {
      let query = `SELECT id, match_id as "matchId", match_title as "matchTitle", rank, name, handle, dept,
                          tier, matches, wins, best_finish as "bestFinish", win_rate as "winRate", cp,
                          game, avatar, completed_at as "completedAt", expires_at as "expiresAt"
                   FROM standings WHERE match_id = $1`;
      const params = [targetMatch.id];
      if (gameFilter && gameFilter !== 'all') {
        query += ` AND game = $2`;
        params.push(gameFilter);
      }
      query += ` ORDER BY cp DESC`;
      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        standingsList = res.rows;
      }
    } catch (e) {
      console.error('[PostgreSQL] Query standings error:', e.message);
    }
  }

  if (!standingsList || standingsList.length === 0) {
    standingsList = (fallbackStore.standings || []).filter(s => {
      const matchesMatch = s.matchId === targetMatch.id;
      const matchesGame = !gameFilter || gameFilter === 'all' || s.game === gameFilter;
      return matchesMatch && matchesGame;
    });
  }

  standingsList.sort((a, b) => (b.cp || 0) - (a.cp || 0));
  const ranked = standingsList.map((item, idx) => ({ ...item, rank: idx + 1 }));

  return {
    match: targetMatch,
    availableMatches,
    standings: ranked
  };
}

export async function awardPlayerPoints(matchId, identifier, pointsDelta, details = {}) {
  if (!matchId) {
    return {
      success: false,
      error: 'Match ID is required. Points can only be awarded for an ongoing match.'
    };
  }

  const cleanId = (identifier || '').trim().toLowerCase();
  const allEvents = await getEvents();
  const event = allEvents.find(e => e.id === matchId);

  if (!event) {
    return { success: false, error: 'Match not found.' };
  }

  if (event.status !== 'live') {
    return {
      success: false,
      error: `Points can only be increased for ongoing games! Match "${event.title}" is currently ${event.status.toUpperCase()} and locked.`
    };
  }

  let playerStanding = null;

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `SELECT id, match_id as "matchId", match_title as "matchTitle", rank, name, handle, dept,
                tier, matches, wins, best_finish as "bestFinish", win_rate as "winRate", cp,
                game, avatar, completed_at as "completedAt", expires_at as "expiresAt"
         FROM standings
         WHERE match_id = $1 AND (LOWER(handle) = $2 OR LOWER(handle) = $3 OR LOWER(name) = $4)`,
        [event.id, cleanId, '@' + cleanId.replace(/^@/, ''), cleanId]
      );
      if (res.rows && res.rows[0]) {
        playerStanding = res.rows[0];
      }
    } catch (e) {
      console.error('[PostgreSQL] Find player standing error:', e.message);
    }
  }

  if (!playerStanding) {
    playerStanding = fallbackStore.standings.find(p =>
      p.matchId === event.id && (
        p.handle.toLowerCase() === cleanId ||
        p.handle.toLowerCase() === '@' + cleanId.replace(/^@/, '') ||
        p.name.toLowerCase() === cleanId
      )
    );
  }

  const delta = Number(pointsDelta) || 0;

  if (!playerStanding) {
    const newStanding = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      matchId: event.id,
      matchTitle: event.title,
      game: event.game,
      name: identifier.replace(/^@/, ''),
      handle: identifier.startsWith('@') ? identifier : '@' + identifier,
      dept: details.dept || 'Campus Arena',
      tier: 'Bronze',
      matches: details.matches || 1,
      wins: details.wins || 0,
      bestFinish: details.bestFinish || '1st',
      winRate: details.winRate || '0%',
      cp: Math.max(0, delta),
      avatar: details.avatar || '🎮',
      completedAt: null,
      expiresAt: null,
      createdAt: new Date()
    };

    if (newStanding.cp >= 200) newStanding.tier = 'Radiant / Ace';
    else if (newStanding.cp >= 120) newStanding.tier = 'Diamond';
    else if (newStanding.cp >= 80) newStanding.tier = 'Gold';
    else if (newStanding.cp >= 50) newStanding.tier = 'Silver';
    else newStanding.tier = 'Bronze';

    if (isConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO standings (id, match_id, match_title, rank, name, handle, dept, tier, matches, wins, best_finish, win_rate, cp, game, avatar, completed_at, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            newStanding.id, newStanding.matchId, newStanding.matchTitle, 1, newStanding.name, newStanding.handle,
            newStanding.dept, newStanding.tier, newStanding.matches, newStanding.wins, newStanding.bestFinish,
            newStanding.winRate, newStanding.cp, newStanding.game, newStanding.avatar, null, null, newStanding.createdAt
          ]
        );
      } catch (e) {
        console.error('[PostgreSQL] Insert standing error:', e.message);
      }
    }

    fallbackStore.standings.push(newStanding);
    saveLocalStore();
    return { success: true, match: event, player: newStanding, pointsAwarded: delta };
  }

  // Update existing standing
  playerStanding.cp = Math.max(0, (playerStanding.cp || 0) + delta);
  if (details.matches) playerStanding.matches = (playerStanding.matches || 0) + Number(details.matches);
  if (details.wins) playerStanding.wins = (playerStanding.wins || 0) + Number(details.wins);
  if (details.bestFinish) playerStanding.bestFinish = details.bestFinish;
  if (playerStanding.matches > 0) {
    playerStanding.winRate = Math.round(((playerStanding.wins || 0) / playerStanding.matches) * 100) + '%';
  }

  if (playerStanding.cp >= 200) playerStanding.tier = 'Radiant / Ace';
  else if (playerStanding.cp >= 120) playerStanding.tier = 'Diamond';
  else if (playerStanding.cp >= 80) playerStanding.tier = 'Gold';
  else if (playerStanding.cp >= 50) playerStanding.tier = 'Silver';
  else playerStanding.tier = 'Bronze';

  if (isConnected && pool) {
    try {
      await pool.query(
        `UPDATE standings SET cp = $1, matches = $2, wins = $3, tier = $4, win_rate = $5, best_finish = $6 WHERE id = $7`,
        [playerStanding.cp, playerStanding.matches, playerStanding.wins, playerStanding.tier, playerStanding.winRate, playerStanding.bestFinish, playerStanding.id]
      );
    } catch (e) {
      console.error('[PostgreSQL] Update standing error:', e.message);
    }
  }

  const idx = fallbackStore.standings.findIndex(p => p.id === playerStanding.id);
  if (idx !== -1) {
    fallbackStore.standings[idx] = playerStanding;
  }
  saveLocalStore();

  return { success: true, match: event, player: playerStanding, pointsAwarded: delta };
}
