/**
 * Kugofox Gaming Arena - MongoDB Database Layer
 * Connects to MongoDB (Local or MongoDB Atlas) with resilient auto-seeding & fallback
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOURNAMENTS_DATA } from '../js/data/tournamentsData.js';
import { LEADERBOARD_DATA } from '../js/data/leaderboardData.js';

dotenv.config();

// Ensure Google & Cloudflare DNS for Node.js SRV queries on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[MongoDB] DNS server set notice:', dnsErr.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORE_FILE = path.join(__dirname, 'local_store.json');
export const STANDINGS_RETENTION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days retention for completed match standings

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kugofox_arena';
const DB_NAME = process.env.DB_NAME || 'kugofox_arena';

let client = null;
let db = null;
let isConnected = false;
let connectionError = null;
let connectingPromise = null;
let lastAttemptTime = 0;
const RETRY_COOLDOWN_MS = 30000; // Only retry connection every 30s to avoid blocking requests

export const INITIAL_SQUADS = [
  {
    id: "sq-1",
    name: "FREEFIRE squad",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 4,
    leader: "Karan",
    color: "#00b4d8",
    letter: "W",
    roster: [
      { name: "Karan", role: "Leader / IGL", avatar: "👑" },
      { name: "Aryan", role: "Rusher", avatar: "🔥" },
      { name: "Rohit", role: "Sniper", avatar: "🎯" },
      { name: "Dev", role: "Support", avatar: "🛡️" }
    ]
  },
  {
    id: "sq-2",
    name: "NS esports",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 6,
    filledSlots: 6,
    leader: "Nitin",
    avatarImg: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80",
    roster: [
      { name: "Nitin", role: "Captain", avatar: "⚡" },
      { name: "Sameer", role: "Assaulter", avatar: "🗡️" },
      { name: "Vikas", role: "Flanker", avatar: "🦅" },
      { name: "Ashish", role: "Sniper", avatar: "🎯" },
      { name: "Rahul", role: "Sub", avatar: "🎮" },
      { name: "Pooja", role: "Strategist", avatar: "🧠" }
    ]
  },
  {
    id: "sq-3",
    name: "Andha rush",
    game: "bgmi",
    gameName: "BGMI",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 2,
    leader: "CyberBot",
    avatarIcon: "🤖",
    roster: [
      { name: "CyberBot", role: "Rusher / IGL", avatar: "🤖" },
      { name: "Hunter99", role: "Fragger", avatar: "🏹" }
    ]
  },
  {
    id: "sq-4",
    name: "Seducers",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 4,
    leader: "Newton",
    avatarIcon: "⚛️",
    roster: [
      { name: "Newton", role: "IGL", avatar: "⚛️" },
      { name: "Pulse", role: "Rusher", avatar: "⚡" },
      { name: "Zero", role: "Cover", avatar: "🎯" },
      { name: "Blaze", role: "Entry", avatar: "🔥" }
    ]
  },
  {
    id: "sq-5",
    name: "Bihari's Legend",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 4,
    leader: "Legend1",
    avatarIcon: "🔥",
    roster: [
      { name: "Legend1", role: "Captain", avatar: "🔥" },
      { name: "BihariBoy", role: "Rusher", avatar: "⚡" },
      { name: "KGF_King", role: "Sniper", avatar: "🎯" },
      { name: "PatnaOp", role: "Support", avatar: "🛡️" }
    ]
  },
  {
    id: "sq-6",
    name: "7_hills_esports",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 5,
    filledSlots: 5,
    leader: "HillClimber",
    avatarIcon: "⛰️",
    roster: [
      { name: "HillClimber", role: "IGL", avatar: "⛰️" },
      { name: "ValleyKing", role: "Assaulter", avatar: "🗡️" },
      { name: "RidgeRider", role: "Scout", avatar: "🦅" },
      { name: "PeakSniper", role: "Sniper", avatar: "🎯" },
      { name: "SummitDoc", role: "Support", avatar: "💊" }
    ]
  },
  {
    id: "sq-7",
    name: "Phoenix Rising",
    game: "valorant",
    gameName: "Valorant",
    type: "TEAM",
    status: "OPEN",
    micRequired: true,
    totalSlots: 5,
    filledSlots: 3,
    leader: "Ashes",
    color: "#ff4655",
    letter: "P",
    roster: [
      { name: "Ashes", role: "Duelist / IGL", avatar: "🔥" },
      { name: "ViperMain", role: "Controller", avatar: "🐍" },
      { name: "SovaGod", role: "Initiator", avatar: "🏹" }
    ]
  },
  {
    id: "sq-8",
    name: "Shadow Syndicate",
    game: "bgmi",
    gameName: "BGMI",
    type: "SQUAD",
    status: "OPEN",
    micRequired: false,
    totalSlots: 4,
    filledSlots: 1,
    leader: "GhostRider",
    avatarIcon: "👻",
    roster: [
      { name: "GhostRider", role: "Scout / IGL", avatar: "👻" }
    ]
  }
];

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
    completedAt: new Date(Date.now() - 7 * 86400000), // completed 7 days ago
    expiresAt: new Date(Date.now() + 3 * 86400000),   // 3 days remaining of 10-day retention
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
    completedAt: new Date(Date.now() - 2 * 86400000), // completed 2 days ago
    expiresAt: new Date(Date.now() + 8 * 86400000),   // 8 days remaining of 10-day retention
    description: "Ranked 5v5 draft tournament with verified collegiate rosters.",
    icon: "assets/logos/mobalegends.png"
  }
];

export const INITIAL_STANDINGS = [
  { id: "p-1", matchId: "ev-3", matchTitle: "CAMPUS VALORANT SHOWDOWN", rank: 1, name: "Prince Nanda", handle: "@skie", dept: "Statistics", tier: "Bronze", matches: 7, wins: 2, bestFinish: "7th", winRate: "29%", cp: 81, game: "valorant", avatar: "🧑‍💻", completedAt: new Date(Date.now() - 7 * 86400000), expiresAt: new Date(Date.now() + 3 * 86400000) },
  { id: "p-2", matchId: "ev-3", matchTitle: "CAMPUS VALORANT SHOWDOWN", rank: 2, name: "Gautam Yadav", handle: "@gautam_486", dept: "Computer Science & Engineering", tier: "Bronze", matches: 7, wins: 2, bestFinish: "7th", winRate: "29%", cp: 75, game: "valorant", avatar: "👨‍🎓", completedAt: new Date(Date.now() - 7 * 86400000), expiresAt: new Date(Date.now() + 3 * 86400000) },
  { id: "p-3", matchId: "ev-3", matchTitle: "CAMPUS VALORANT SHOWDOWN", rank: 3, name: "Bicky Sarkar", handle: "@bicky_798", dept: "Computer Science & Engineering", tier: "Bronze", matches: 7, wins: 1, bestFinish: "1st", winRate: "14%", cp: 69, game: "valorant", avatar: "🦸", completedAt: new Date(Date.now() - 7 * 86400000), expiresAt: new Date(Date.now() + 3 * 86400000) },
  { id: "p-4", matchId: "ev-3", matchTitle: "CAMPUS VALORANT SHOWDOWN", rank: 4, name: "Sarthak Gupta", handle: "@sarthak", dept: "Computer Science & Engineering", tier: "Bronze", matches: 6, wins: 2, bestFinish: "1st", winRate: "33%", cp: 67, game: "valorant", avatar: "🧑", completedAt: new Date(Date.now() - 7 * 86400000), expiresAt: new Date(Date.now() + 3 * 86400000) },
  { id: "p-5", matchId: "ev-3", matchTitle: "CAMPUS VALORANT SHOWDOWN", rank: 5, name: "Suman Nandi", handle: "@suman_590", dept: "Computer Science & Engineering", tier: "Bronze", matches: 5, wins: 2, bestFinish: "1st", winRate: "40%", cp: 64, game: "valorant", avatar: "⚡", completedAt: new Date(Date.now() - 7 * 86400000), expiresAt: new Date(Date.now() + 3 * 86400000) },
  { id: "p-6", matchId: "ev-3", matchTitle: "CAMPUS VALORANT SHOWDOWN", rank: 6, name: "JOD OP", handle: "@jod_581", dept: "Computer Science & Engineering", tier: "Bronze", matches: 5, wins: 2, bestFinish: "1st", winRate: "40%", cp: 62, game: "valorant", avatar: "🔥", completedAt: new Date(Date.now() - 7 * 86400000), expiresAt: new Date(Date.now() + 3 * 86400000) },
  { id: "p-7", matchId: "ev-4", matchTitle: "MOBA 5V5 DRAFT CUP", rank: 1, name: "Spondon Nath", handle: "@spondon_07", dept: "Computer Science & Engineering", tier: "Bronze", matches: 6, wins: 2, bestFinish: "1st", winRate: "33%", cp: 61, game: "mobalegends", avatar: "🎯", completedAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() + 8 * 86400000) },
  { id: "p-8", matchId: "ev-4", matchTitle: "MOBA 5V5 DRAFT CUP", rank: 2, name: "Gurram yutish govind", handle: "@yutish", dept: "Mechanical Engineering", tier: "Bronze", matches: 5, wins: 1, bestFinish: "2nd", winRate: "20%", cp: 58, game: "mobalegends", avatar: "🕶️", completedAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() + 8 * 86400000) },
  { id: "p-9", matchId: "ev-4", matchTitle: "MOBA 5V5 DRAFT CUP", rank: 3, name: "Aniket Roy", handle: "@aniket_roy", dept: "Electrical Engineering", tier: "Bronze", matches: 5, wins: 1, bestFinish: "3rd", winRate: "20%", cp: 55, game: "mobalegends", avatar: "🦊", completedAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() + 8 * 86400000) },
  { id: "p-10", matchId: "ev-4", matchTitle: "MOBA 5V5 DRAFT CUP", rank: 4, name: "Tanmay Sharma", handle: "@tanmay_s", dept: "Civil Engineering", tier: "Bronze", matches: 4, wins: 1, bestFinish: "1st", winRate: "25%", cp: 52, game: "mobalegends", avatar: "👑", completedAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() + 8 * 86400000) },
  { id: "p-11", matchId: "ev-4", matchTitle: "MOBA 5V5 DRAFT CUP", rank: 5, name: "Kushagra Verma", handle: "@kush_v", dept: "Information Technology", tier: "Bronze", matches: 4, wins: 1, bestFinish: "2nd", winRate: "25%", cp: 48, game: "mobalegends", avatar: "🎯", completedAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() + 8 * 86400000) },
  { id: "p-12", matchId: "ev-4", matchTitle: "MOBA 5V5 DRAFT CUP", rank: 6, name: "Priya Das", handle: "@priya_d", dept: "Biotechnology", tier: "Bronze", matches: 3, wins: 1, bestFinish: "1st", winRate: "33%", cp: 45, game: "mobalegends", avatar: "🌸", completedAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() + 8 * 86400000) }
];

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
  registrations: persisted?.registrations || [],
  votes: persisted?.votes || {},
  chat: persisted?.chat || [
    { user: 'RadiantDemon', badge: 'VIP', text: 'THAT FLICK ON C-SITE WAS DISGUSTING!! 🔥', time: '19:10' },
    { user: 'ErangelSniper', badge: 'PRO', text: 'AWM collateral incoming in the final circle!', time: '19:11' },
    { user: 'FoxFanatic', badge: 'FAN', text: 'KUGOFOX RUNNING THE BRACKET TODAY 🦊🦊🦊', time: '19:12' }
  ],
  leaderboard: persisted?.leaderboard || { ...LEADERBOARD_DATA },
  users: persisted?.users || [],
  squads: persisted?.squads || JSON.parse(JSON.stringify(INITIAL_SQUADS)),
  events: persisted?.events || JSON.parse(JSON.stringify(INITIAL_EVENTS)),
  standings: persisted?.standings || JSON.parse(JSON.stringify(INITIAL_STANDINGS))
};

export function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(fallbackStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Store] Could not write local_store.json:', e.message);
  }
}

export async function connectDB() {
  if (isConnected && db) return db;
  if (connectingPromise) return connectingPromise;

  // If a connection attempt recently failed, skip waiting and immediately use resilient storage mode
  if (Date.now() - lastAttemptTime < RETRY_COOLDOWN_MS) {
    return null;
  }

  lastAttemptTime = Date.now();
  connectingPromise = (async () => {
    try {
      console.log(`[MongoDB] Connecting to ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}...`);
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      await client.connect();
      db = client.db(DB_NAME);
      isConnected = true;
      connectionError = null;
      console.log(`[MongoDB] Successfully connected to database: ${DB_NAME}`);

      // Seed initial data once if brand new database
      await seedInitialData();
      return db;
    } catch (err) {
      isConnected = false;
      connectionError = err.message;
      console.warn(`[MongoDB] Notice: Could not connect (${err.message.split('\n')[0]}).`);
      console.warn(`[MongoDB] Running in Resilient Storage Mode.`);
      return null;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

async function seedInitialData() {
  if (!isConnected || !db) return;
  try {
    const meta = await db.collection('_metadata').findOne({ key: 'seeded_v1' });
    if (meta) {
      // Database has already been initialized previously. Never overwrite or re-seed deleted items.
      return;
    }

    console.log('[MongoDB] Performing one-time initial seed for new database...');
    if (Array.isArray(TOURNAMENTS_DATA) && TOURNAMENTS_DATA.length > 0) {
      await db.collection('tournaments').insertMany(TOURNAMENTS_DATA).catch(() => {});
    }
    await db.collection('leaderboard').updateOne(
      { id: 'current' },
      { $set: { id: 'current', data: LEADERBOARD_DATA } },
      { upsert: true }
    ).catch(() => {});
    if (Array.isArray(fallbackStore.users) && fallbackStore.users.length > 0) {
      await db.collection('users').insertMany(fallbackStore.users).catch(() => {});
    }
    if (Array.isArray(INITIAL_SQUADS) && INITIAL_SQUADS.length > 0) {
      await db.collection('squads').insertMany(INITIAL_SQUADS).catch(() => {});
    }
    if (Array.isArray(INITIAL_EVENTS) && INITIAL_EVENTS.length > 0) {
      await db.collection('events').insertMany(INITIAL_EVENTS).catch(() => {});
    }
    if (Array.isArray(INITIAL_STANDINGS) && INITIAL_STANDINGS.length > 0) {
      await db.collection('standings').insertMany(INITIAL_STANDINGS).catch(() => {});
    }
    await db.collection('_metadata').insertOne({ key: 'seeded_v1', seededAt: new Date() });
    console.log('[MongoDB] Initial database seed completed.');
  } catch (e) {
    console.error('[MongoDB] Error during seeding:', e.message);
  }
}

export function getDBStatus() {
  return {
    connected: isConnected,
    uri: isConnected ? MONGODB_URI.replace(/:[^:]*@/, ':****@') : MONGODB_URI,
    dbName: DB_NAME,
    status: isConnected ? 'Connected (MongoDB Engine)' : 'Standby Mode (Memory Sync Active)',
    error: connectionError
  };
}

/* ================== TOURNAMENT REPOSITORY ================== */
export async function getTournaments() {
  if (isConnected && db) {
    try {
      const list = await db.collection('tournaments').find({}).toArray();
      if (list && list.length > 0) return list;
    } catch (e) {
      console.error('[MongoDB] Query error:', e.message);
    }
  }
  return fallbackStore.tournaments;
}

/* ================== REGISTRATIONS REPOSITORY ================== */
export async function saveRegistration(registration) {
  const record = {
    ...registration,
    createdAt: new Date()
  };

  if (isConnected && db) {
    try {
      const result = await db.collection('registrations').insertOne(record);
      record._id = result.insertedId;
    } catch (e) {
      console.error('[MongoDB] Registration save error:', e.message);
    }
  }

  fallbackStore.registrations.unshift(record);
  saveLocalStore();
  return record;
}

export async function getRegistrations() {
  if (isConnected && db) {
    try {
      return await db.collection('registrations').find({}).sort({ createdAt: -1 }).toArray();
    } catch (e) {
      console.error('[MongoDB] Query registrations error:', e.message);
    }
  }
  return fallbackStore.registrations;
}

/* ================== VOTES / CHEERS REPOSITORY ================== */
export async function recordVote(matchId, teamName) {
  const voteDoc = {
    matchId,
    teamName,
    votedAt: new Date()
  };

  if (isConnected && db) {
    try {
      await db.collection('votes').insertOne(voteDoc);
    } catch (e) {
      console.error('[MongoDB] Vote record error:', e.message);
    }
  }

  fallbackStore.votes[matchId] = teamName;
  return { success: true, matchId, teamName };
}

/* ================== CHAT REPOSITORY ================== */
export async function saveChatMessage(chatMsg) {
  const msg = {
    ...chatMsg,
    createdAt: new Date()
  };

  if (isConnected && db) {
    try {
      await db.collection('chat').insertOne(msg);
    } catch (e) {
      console.error('[MongoDB] Chat save error:', e.message);
    }
  }

  fallbackStore.chat.push(msg);
  if (fallbackStore.chat.length > 30) fallbackStore.chat.shift();
  return msg;
}

export async function getChatMessages() {
  if (isConnected && db) {
    try {
      const msgs = await db.collection('chat').find({}).sort({ createdAt: 1 }).limit(30).toArray();
      if (msgs && msgs.length > 0) return msgs;
    } catch (e) {
      console.error('[MongoDB] Chat query error:', e.message);
    }
  }
  return fallbackStore.chat;
}

/* ================== LEADERBOARD REPOSITORY ================== */
export async function getLeaderboard() {
  if (isConnected && db) {
    try {
      const lb = await db.collection('leaderboard').findOne({ id: 'current' });
      if (lb && lb.data) return lb.data;
    } catch (e) {
      console.error('[MongoDB] Leaderboard query error:', e.message);
    }
  }
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
    division: userData.division || 'campus',
    department: userData.department || '',
    avatar: userData.avatar || (userData.division === 'campus' ? '🎓' : '🌐'),
    createdAt: new Date(),
    stats: {
      matchesPlayed: 0,
      tournamentsWon: 0,
      kCoins: 500, // Welcome bonus
      rank: 'Contender I'
    }
  };

  if (isConnected && db) {
    try {
      const res = await db.collection('users').insertOne(newUser);
      newUser._id = res.insertedId;
    } catch (e) {
      console.error('[MongoDB] Create user error:', e.message);
    }
  }

  fallbackStore.users.push(newUser);
  saveLocalStore();
  return sanitizeUser(newUser);
}

export async function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (isConnected && db) {
    try {
      const user = await db.collection('users').findOne({ email: normalized });
      if (user) return user;
    } catch (e) {
      console.error('[MongoDB] Query user by email error:', e.message);
    }
  }
  return fallbackStore.users.find(u => u.email.toLowerCase() === normalized) || null;
}

export async function findUserByUsername(username) {
  const clean = (username || '').replace(/^@/, '').trim().toLowerCase();
  if (isConnected && db) {
    try {
      const user = await db.collection('users').findOne({ username: clean });
      if (user) return user;
    } catch (e) {
      console.error('[MongoDB] Query user by username error:', e.message);
    }
  }
  return fallbackStore.users.find(u => u.username.toLowerCase() === clean) || null;
}

export async function authenticateUser(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const strippedId = cleanId.replace(/^@/, '');

  let candidates = [];

  if (isConnected && db) {
    try {
      candidates = await db.collection('users').find({
        $or: [
          { email: cleanId },
          { username: cleanId },
          { username: strippedId }
        ]
      }).toArray();
    } catch (e) {
      console.error('[MongoDB] Query candidate users error:', e.message);
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

  // Check if any candidate has matching password
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
  if (isConnected && db) {
    try {
      const user = await db.collection('users').findOne({ id });
      if (user) return sanitizeUser(user);
    } catch (e) {
      console.error('[MongoDB] Query user by id error:', e.message);
    }
  }
  const u = fallbackStore.users.find(u => u.id === id);
  return u ? sanitizeUser(u) : null;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, _id, ...safe } = user;
  return safe;
}

/* ================== SQUADS REPOSITORY ================== */
export async function getSquads(gameFilter = null) {
  if (isConnected && db) {
    try {
      const query = gameFilter && gameFilter !== 'all' ? { game: gameFilter } : {};
      const list = await db.collection('squads').find(query).toArray();
      if (Array.isArray(list)) return list;
    } catch (e) {
      console.error('[MongoDB] Query squads error:', e.message);
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
    roster: squadData.roster || [
      { name: squadData.leader || 'Leader', role: 'Captain / IGL', avatar: squadData.avatar || '🎯' }
    ],
    createdAt: new Date()
  };

  if (isConnected && db) {
    try {
      const res = await db.collection('squads').insertOne(newSquad);
      newSquad._id = res.insertedId;
    } catch (e) {
      console.error('[MongoDB] Create squad error:', e.message);
    }
  }

  fallbackStore.squads.unshift(newSquad);
  saveLocalStore();
  return newSquad;
}

export async function joinSquad(squadId, applicantData) {
  let squad = null;
  if (isConnected && db) {
    try {
      squad = await db.collection('squads').findOne({ id: squadId });
    } catch (e) {
      console.error('[MongoDB] Find squad error:', e.message);
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

  if (isConnected && db) {
    try {
      await db.collection('squads').updateOne(
        { id: squadId },
        { $set: { roster: squad.roster, filledSlots: squad.filledSlots, status: squad.status } }
      );
    } catch (e) {
      console.error('[MongoDB] Update squad roster error:', e.message);
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
  if (isConnected && db) {
    try {
      const query = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
      const list = await db.collection('events').find(query).toArray();
      if (Array.isArray(list)) return list;
    } catch (e) {
      console.error('[MongoDB] Query events error:', e.message);
    }
  }
  if (statusFilter && statusFilter !== 'all') {
    return fallbackStore.events.filter(e => e.status === statusFilter);
  }
  return fallbackStore.events;
}

export async function saveEvent(eventData) {
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
    createdAt: new Date()
  };

  if (isConnected && db) {
    try {
      const res = await db.collection('events').insertOne(newEvent);
      newEvent._id = res.insertedId;
    } catch (e) {
      console.error('[MongoDB] Save event error:', e.message);
    }
  }

  fallbackStore.events.unshift(newEvent);
  saveLocalStore();
  return newEvent;
}

export async function updateEvent(id, updateData) {
  const cleanId = String(id || '').trim();
  let objId = null;
  try {
    if (ObjectId.isValid(cleanId)) {
      objId = new ObjectId(cleanId);
    }
  } catch (_) {}

  const filter = {
    $or: [
      { id: cleanId },
      { id: id },
      ...(objId ? [{ _id: objId }] : [])
    ]
  };

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

  if (isConnected && db) {
    try {
      await db.collection('events').updateMany(filter, { $set: updateData });

      if (updateData.status === 'completed') {
        await db.collection('standings').updateMany(
          { $or: [{ matchId: cleanId }, { matchId: id }] },
          { $set: { completedAt: updateData.completedAt, expiresAt: updateData.expiresAt } }
        );
      } else if (updateData.status === 'live') {
        await db.collection('standings').updateMany(
          { $or: [{ matchId: cleanId }, { matchId: id }] },
          { $set: { completedAt: null, expiresAt: null } }
        );
      }
    } catch (e) {
      console.error('[MongoDB] Update event error:', e.message);
    }
  }

  const idx = fallbackStore.events.findIndex(e =>
    e.id === cleanId || e.id === id || (objId && String(e._id) === String(objId))
  );
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
  let objId = null;
  try {
    if (ObjectId.isValid(cleanId)) {
      objId = new ObjectId(cleanId);
    }
  } catch (_) {}

  const filter = {
    $or: [
      { id: cleanId },
      { id: id },
      ...(objId ? [{ _id: objId }] : [])
    ]
  };

  if (isConnected && db) {
    try {
      await db.collection('events').deleteMany(filter);
      await db.collection('standings').deleteMany({
        $or: [
          { matchId: cleanId },
          { matchId: id },
          ...(objId ? [{ matchId: String(objId) }] : [])
        ]
      });
    } catch (e) {
      console.error('[MongoDB] Delete event error:', e.message);
    }
  }

  fallbackStore.events = fallbackStore.events.filter(e =>
    e.id !== cleanId && e.id !== id && (!objId || String(e._id) !== String(objId))
  );
  fallbackStore.standings = fallbackStore.standings.filter(s =>
    s.matchId !== cleanId && s.matchId !== id
  );
  saveLocalStore();
  return { success: true, id };
}

/* ================== COMPETITIVE STANDINGS / POINTS REPOSITORY ================== */

export async function purgeExpiredStandings() {
  const now = new Date();

  if (isConnected && db) {
    try {
      // Ensure TTL index exists on expiresAt
      await db.collection('standings').createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      ).catch(() => {});

      // Delete standings where 10-day retention has expired
      await db.collection('standings').deleteMany({
        expiresAt: { $exists: true, $ne: null, $lte: now }
      });
    } catch (e) {
      console.error('[MongoDB] Purge expired standings error:', e.message);
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

  // Standings are available for Live (ongoing) matches or completed matches within 10 days
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

  // If no matchId specified, prioritize live match, then latest completed match
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

  // If match is upcoming, standings are not active yet
  if (targetMatch.status === 'upcoming') {
    return {
      match: targetMatch,
      availableMatches,
      standings: [],
      notice: 'This match is upcoming. Standings will activate once the match goes Live!'
    };
  }

  let standingsList = [];

  if (isConnected && db) {
    try {
      const query = { matchId: targetMatch.id };
      if (gameFilter && gameFilter !== 'all') query.game = gameFilter;
      standingsList = await db.collection('standings').find(query).sort({ cp: -1 }).toArray();
    } catch (e) {
      console.error('[MongoDB] Query match standings error:', e.message);
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
  const event = allEvents.find(e => e.id === matchId || String(e._id) === String(matchId));

  if (!event) {
    return { success: false, error: 'Match not found.' };
  }

  // Strict constraint: Points can ONLY be increased for ongoing games!
  if (event.status !== 'live') {
    return {
      success: false,
      error: `Points can only be increased for ongoing games! Match "${event.title}" is currently ${event.status.toUpperCase()} and locked.`
    };
  }

  let playerStanding = null;

  if (isConnected && db) {
    try {
      playerStanding = await db.collection('standings').findOne({
        matchId: event.id,
        $or: [
          { handle: cleanId },
          { handle: '@' + cleanId.replace(/^@/, '') },
          { name: new RegExp('^' + identifier + '$', 'i') }
        ]
      });
    } catch (e) {
      console.error('[MongoDB] Find match player standing error:', e.message);
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
    // Create new player standing for this ongoing match
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

    if (isConnected && db) {
      try {
        await db.collection('standings').insertOne(newStanding);
      } catch (e) {
        console.error('[MongoDB] Insert match standing error:', e.message);
      }
    }
    fallbackStore.standings.push(newStanding);
    saveLocalStore();
    return { success: true, match: event, player: newStanding, pointsAwarded: delta };
  }

  // Update existing standing for this ongoing match
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

  if (isConnected && db) {
    try {
      await db.collection('standings').updateOne(
        { id: playerStanding.id },
        { $set: {
          cp: playerStanding.cp,
          matches: playerStanding.matches,
          wins: playerStanding.wins,
          tier: playerStanding.tier,
          winRate: playerStanding.winRate,
          bestFinish: playerStanding.bestFinish
        }}
      );
    } catch (e) {
      console.error('[MongoDB] Update match standing error:', e.message);
    }
  }

  const idx = fallbackStore.standings.findIndex(p => p.id === playerStanding.id);
  if (idx !== -1) {
    fallbackStore.standings[idx] = playerStanding;
  }
  saveLocalStore();

  return { success: true, match: event, player: playerStanding, pointsAwarded: delta };
}

