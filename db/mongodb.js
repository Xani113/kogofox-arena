/**
 * Kugofox Gaming Arena - MongoDB Database Layer
 * Connects to MongoDB (Local or MongoDB Atlas) with resilient auto-seeding & fallback
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
import { TOURNAMENTS_DATA } from '../js/data/tournamentsData.js';
import { LEADERBOARD_DATA } from '../js/data/leaderboardData.js';

dotenv.config();

// Ensure SRV DNS records resolve properly on Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if dns.setServers is unavailable in runtime
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kugofox_arena';
const DB_NAME = process.env.DB_NAME || 'kugofox_arena';

let client = null;
let db = null;
let isConnected = false;
let connectionError = null;

// Local fallback in-memory store if MongoDB instance is not currently active
const fallbackStore = {
  tournaments: [...TOURNAMENTS_DATA],
  registrations: [],
  votes: {},
  chat: [
    { user: 'RadiantDemon', badge: 'VIP', text: 'THAT FLICK ON C-SITE WAS DISGUSTING!! 🔥', time: '19:10' },
    { user: 'ErangelSniper', badge: 'PRO', text: 'AWM collateral incoming in the final circle!', time: '19:11' },
    { user: 'FoxFanatic', badge: 'FAN', text: 'KUGOFOX RUNNING THE BRACKET TODAY 🦊🦊🦊', time: '19:12' }
  ],
  leaderboard: { ...LEADERBOARD_DATA },
  users: [
    {
      id: 'usr_mohit_1',
      fullName: 'Mohit Gupta',
      username: 'mohit_gupta',
      email: 'rpmohit9@gmail.com',
      password: 'password123',
      avatar: '🚂',
      createdAt: new Date()
    },
    {
      id: 'usr_sanidhaya_2',
      fullName: 'Sanidhaya Gupta',
      username: 'sanidhaya_gupta',
      email: 'mkgsani9@gmail.com',
      password: 'password123',
      avatar: '⚡',
      createdAt: new Date()
    },
    {
      id: 'usr_abhijit_3',
      fullName: 'Abhijit Gupta',
      username: 'abhijit_gupta',
      email: 'abhijitg9226@gmail.com',
      password: 'password123',
      avatar: '🦊',
      createdAt: new Date()
    }
  ]
};

export async function connectDB() {
  try {
    console.log(`[MongoDB] Connecting to ${MONGODB_URI}...`);
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    connectionError = null;
    console.log(`[MongoDB] Successfully connected to database: ${DB_NAME}`);

    // Seed initial data if empty
    await seedInitialData();
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${MONGODB_URI} (${err.message}).`);
    console.warn(`[MongoDB] Running in Resilient Storage Mode. Configure MONGODB_URI in .env to connect to your MongoDB Atlas or local daemon.`);
  }
}

async function seedInitialData() {
  if (!isConnected || !db) return;
  try {
    const tourneyCount = await db.collection('tournaments').countDocuments();
    if (tourneyCount === 0) {
      console.log('[MongoDB] Seeding initial tournaments collection...');
      await db.collection('tournaments').insertMany(TOURNAMENTS_DATA);
    }

    const lbCount = await db.collection('leaderboard').countDocuments();
    if (lbCount === 0) {
      console.log('[MongoDB] Seeding initial leaderboard collection...');
      await db.collection('leaderboard').insertOne({ id: 'current', data: LEADERBOARD_DATA });
    }

    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB] Seeding initial users collection...');
      await db.collection('users').insertMany(fallbackStore.users);
    }
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

