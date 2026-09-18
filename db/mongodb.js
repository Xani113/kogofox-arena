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
    filledSlots: 2,
    leader: "Abhinav",
    color: "#7b2cbf",
    letter: "A",
    roster: [
      { name: "Abhinav", role: "Captain", avatar: "👑" },
      { name: "Satyam", role: "Support", avatar: "🛡️" }
    ]
  },
  {
    id: "sq-6",
    name: "Assam Gladiators",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 2,
    leader: "Mayank",
    avatarIcon: "🦁",
    roster: [
      { name: "Mayank", role: "IGL", avatar: "🦁" },
      { name: "Dipto", role: "Rusher", avatar: "⚡" }
    ]
  },
  {
    id: "sq-7",
    name: "Blaze Esports",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 2,
    leader: "Rishi",
    color: "#00b4d8",
    letter: "R",
    roster: [
      { name: "Rishi", role: "Sniper", avatar: "🎯" },
      { name: "Anand", role: "Assaulter", avatar: "🔥" }
    ]
  },
  {
    id: "sq-8",
    name: "Bounty Hunters",
    game: "freefire",
    gameName: "Free Fire",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 1,
    leader: "Manish",
    color: "#8d99ae",
    letter: "M",
    roster: [
      { name: "Manish", role: "Leader", avatar: "🎯" }
    ]
  },
  {
    id: "sq-9",
    name: "falana demaka",
    game: "bgmi",
    gameName: "BGMI",
    type: "SQUAD",
    status: "OPEN",
    micRequired: true,
    totalSlots: 4,
    filledSlots: 1,
    leader: "Phantom",
    avatarIcon: "👻",
    roster: [
      { name: "Phantom", role: "Scout / IGL", avatar: "👻" }
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
    description: "Ranked 5v5 draft tournament with verified collegiate rosters.",
    icon: "assets/logos/mobalegends.png"
  }
];

export const INITIAL_STANDINGS = [
  { id: "p-1", rank: 1, name: "Prince Nanda", handle: "@skie", dept: "Statistics", tier: "Bronze", matches: 7, wins: 2, bestFinish: "7th", winRate: "29%", cp: 81, game: "freefire", avatar: "🧑‍💻" },
  { id: "p-2", rank: 2, name: "Gautam Yadav", handle: "@gautam_486", dept: "Computer Science & Engineering", tier: "Bronze", matches: 7, wins: 2, bestFinish: "7th", winRate: "29%", cp: 75, game: "bgmi", avatar: "👨‍🎓" },
  { id: "p-3", rank: 3, name: "Bicky Sarkar", handle: "@bicky_798", dept: "Computer Science & Engineering", tier: "Bronze", matches: 7, wins: 1, bestFinish: "1st", winRate: "14%", cp: 69, game: "freefire", avatar: "🦸" },
  { id: "p-4", rank: 4, name: "Sarthak Gupta", handle: "@sarthak", dept: "Computer Science & Engineering", tier: "Bronze", matches: 6, wins: 2, bestFinish: "1st", winRate: "33%", cp: 67, game: "valorant", avatar: "🧑" },
  { id: "p-5", rank: 5, name: "Suman Nandi", handle: "@suman_590", dept: "Computer Science & Engineering", tier: "Bronze", matches: 5, wins: 2, bestFinish: "1st", winRate: "40%", cp: 64, game: "bgmi", avatar: "⚡" },
  { id: "p-6", rank: 6, name: "JOD OP", handle: "@jod_581", dept: "Computer Science & Engineering", tier: "Bronze", matches: 5, wins: 2, bestFinish: "1st", winRate: "40%", cp: 62, game: "freefire", avatar: "🔥" },
  { id: "p-7", rank: 7, name: "Spondon Nath", handle: "@spondon_07", dept: "Computer Science & Engineering", tier: "Bronze", matches: 6, wins: 2, bestFinish: "1st", winRate: "33%", cp: 61, game: "freefire", avatar: "🎯" },
  { id: "p-8", rank: 8, name: "Gurram yutish govind", handle: "@yutish", dept: "Mechanical Engineering", tier: "Bronze", matches: 5, wins: 1, bestFinish: "2nd", winRate: "20%", cp: 58, game: "bgmi", avatar: "🕶️" },
  { id: "p-9", rank: 9, name: "Aniket Roy", handle: "@aniket_roy", dept: "Electrical Engineering", tier: "Bronze", matches: 5, wins: 1, bestFinish: "3rd", winRate: "20%", cp: 55, game: "valorant", avatar: "🦊" },
  { id: "p-10", rank: 10, name: "Tanmay Sharma", handle: "@tanmay_s", dept: "Civil Engineering", tier: "Bronze", matches: 4, wins: 1, bestFinish: "1st", winRate: "25%", cp: 52, game: "mobalegends", avatar: "👑" },
  { id: "p-11", rank: 11, name: "Kushagra Verma", handle: "@kush_v", dept: "Information Technology", tier: "Bronze", matches: 4, wins: 1, bestFinish: "2nd", winRate: "25%", cp: 48, game: "bgmi", avatar: "🎯" },
  { id: "p-12", rank: 12, name: "Priya Das", handle: "@priya_d", dept: "Biotechnology", tier: "Bronze", matches: 3, wins: 1, bestFinish: "1st", winRate: "33%", cp: 45, game: "freefire", avatar: "🌸" }
];

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
  users: [],
  squads: JSON.parse(JSON.stringify(INITIAL_SQUADS)),
  events: JSON.parse(JSON.stringify(INITIAL_EVENTS)),
  standings: JSON.parse(JSON.stringify(INITIAL_STANDINGS))
};

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
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      await client.connect();
      db = client.db(DB_NAME);
      isConnected = true;
      connectionError = null;
      console.log(`[MongoDB] Successfully connected to database: ${DB_NAME}`);

      // Seed initial data if empty
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

    const squadsCount = await db.collection('squads').countDocuments();
    if (squadsCount === 0) {
      console.log('[MongoDB] Seeding initial squads collection...');
      await db.collection('squads').insertMany(INITIAL_SQUADS);
    }

    const eventsCount = await db.collection('events').countDocuments();
    if (eventsCount === 0) {
      console.log('[MongoDB] Seeding initial events collection...');
      await db.collection('events').insertMany(INITIAL_EVENTS);
    }

    const standingsCount = await db.collection('standings').countDocuments();
    if (standingsCount === 0) {
      console.log('[MongoDB] Seeding initial standings collection...');
      await db.collection('standings').insertMany(INITIAL_STANDINGS);
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

/* ================== SQUADS REPOSITORY ================== */
export async function getSquads(gameFilter = null) {
  if (isConnected && db) {
    try {
      const query = gameFilter && gameFilter !== 'all' ? { game: gameFilter } : {};
      const list = await db.collection('squads').find(query).toArray();
      if (list && list.length > 0) return list;
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

  return { success: true, squad, member: applicant };
}

/* ================== EVENTS & SCRIMS REPOSITORY ================== */
export async function getEvents(statusFilter = null) {
  if (isConnected && db) {
    try {
      const query = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
      const list = await db.collection('events').find(query).toArray();
      if (list && list.length > 0) return list;
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
  return newEvent;
}

export async function updateEvent(id, updateData) {
  if (isConnected && db) {
    try {
      await db.collection('events').updateOne({ id }, { $set: updateData });
    } catch (e) {
      console.error('[MongoDB] Update event error:', e.message);
    }
  }

  const idx = fallbackStore.events.findIndex(e => e.id === id);
  if (idx !== -1) {
    fallbackStore.events[idx] = { ...fallbackStore.events[idx], ...updateData };
    return fallbackStore.events[idx];
  }
  return null;
}

export async function deleteEvent(id) {
  if (isConnected && db) {
    try {
      await db.collection('events').deleteOne({ id });
    } catch (e) {
      console.error('[MongoDB] Delete event error:', e.message);
    }
  }
  fallbackStore.events = fallbackStore.events.filter(e => e.id !== id);
  return { success: true, id };
}

/* ================== COMPETITIVE STANDINGS / POINTS REPOSITORY ================== */
export async function getCompetitiveStandings(gameFilter = null) {
  if (isConnected && db) {
    try {
      const query = gameFilter && gameFilter !== 'all' ? { game: gameFilter } : {};
      const list = await db.collection('standings').find(query).sort({ cp: -1 }).toArray();
      if (list && list.length > 0) {
        return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
      }
    } catch (e) {
      console.error('[MongoDB] Query standings error:', e.message);
    }
  }

  let list = [...fallbackStore.standings];
  if (gameFilter && gameFilter !== 'all') {
    list = list.filter(p => p.game === gameFilter);
  }
  list.sort((a, b) => (b.cp || 0) - (a.cp || 0));
  return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

export async function awardPlayerPoints(identifier, pointsDelta, details = {}) {
  const cleanId = (identifier || '').trim().toLowerCase();
  let player = null;

  if (isConnected && db) {
    try {
      player = await db.collection('standings').findOne({
        $or: [
          { id: identifier },
          { handle: cleanId },
          { handle: '@' + cleanId.replace(/^@/, '') },
          { name: new RegExp('^' + identifier + '$', 'i') }
        ]
      });
    } catch (e) {
      console.error('[MongoDB] Find player error:', e.message);
    }
  }

  if (!player) {
    player = fallbackStore.standings.find(p =>
      p.id === identifier ||
      p.handle.toLowerCase() === cleanId ||
      p.handle.toLowerCase() === '@' + cleanId.replace(/^@/, '') ||
      p.name.toLowerCase() === cleanId
    );
  }

  if (!player) {
    // If player doesn't exist, create them in standings
    const newPlayer = {
      id: 'p-' + Date.now(),
      rank: fallbackStore.standings.length + 1,
      name: identifier.replace(/^@/, ''),
      handle: identifier.startsWith('@') ? identifier : '@' + identifier,
      dept: details.dept || 'Campus Arena',
      tier: 'Bronze',
      matches: details.matches || 1,
      wins: details.wins || 0,
      bestFinish: details.bestFinish || '1st',
      winRate: details.winRate || '0%',
      cp: Math.max(0, Number(pointsDelta) || 0),
      game: details.game || 'freefire',
      avatar: details.avatar || '🎮'
    };

    if (isConnected && db) {
      try {
        await db.collection('standings').insertOne(newPlayer);
      } catch (e) {
        console.error('[MongoDB] Insert new standings player error:', e.message);
      }
    }
    fallbackStore.standings.push(newPlayer);
    fallbackStore.standings.sort((a, b) => b.cp - a.cp);
    return { success: true, player: newPlayer, pointsAwarded: Number(pointsDelta) || 0 };
  }

  // Update existing player
  player.cp = Math.max(0, (player.cp || 0) + Number(pointsDelta));
  if (details.matches) player.matches = (player.matches || 0) + Number(details.matches);
  if (details.wins) player.wins = (player.wins || 0) + Number(details.wins);
  if (details.tier) player.tier = details.tier;
  if (details.bestFinish) player.bestFinish = details.bestFinish;
  if (player.matches > 0) {
    player.winRate = Math.round(((player.wins || 0) / player.matches) * 100) + '%';
  }

  // Auto tier update based on CP
  if (player.cp >= 200) player.tier = 'Radiant / Ace';
  else if (player.cp >= 120) player.tier = 'Diamond';
  else if (player.cp >= 80) player.tier = 'Gold';
  else if (player.cp >= 50) player.tier = 'Silver';
  else player.tier = 'Bronze';

  if (isConnected && db) {
    try {
      await db.collection('standings').updateOne(
        { id: player.id },
        { $set: {
          cp: player.cp,
          matches: player.matches,
          wins: player.wins,
          tier: player.tier,
          winRate: player.winRate,
          bestFinish: player.bestFinish
        }}
      );
    } catch (e) {
      console.error('[MongoDB] Update standings player error:', e.message);
    }
  }

  const idx = fallbackStore.standings.findIndex(p => p.id === player.id);
  if (idx !== -1) {
    fallbackStore.standings[idx] = player;
  }
  fallbackStore.standings.sort((a, b) => b.cp - a.cp);

  return { success: true, player, pointsAwarded: Number(pointsDelta) || 0 };
}

