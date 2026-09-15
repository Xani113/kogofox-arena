/**
 * Kugofox Gaming Arena - Tournaments & Bracket Database
 */

export const TOURNAMENTS_DATA = [
  {
    id: "tourney-val-01",
    gameId: "valorant",
    title: "Kugofox VCT Radiant Invitational",
    status: "LIVE",
    prizePool: "$25,000",
    date: "TODAY • GRAND FINALS",
    timeRemaining: "01h 42m",
    teamsCount: 16,
    format: "5v5 Single Elimination",
    tier: "S-Tier Major",
    description: "The premier Valorant showdown featuring top tier radiant teams fighting through Lotus, Haven, and Ascent.",
    bracket: {
      quarterFinals: [
        { matchId: "v-q1", team1: { name: "Sentinels X", score: 2, odds: "1.45" }, team2: { name: "Paper Rex Prime", score: 1, odds: "2.60" }, winner: "Sentinels X", status: "COMPLETED" },
        { matchId: "v-q2", team1: { name: "FNATIC Apex", score: 2, odds: "1.80" }, team2: { name: "DRX Cyber", score: 0, odds: "2.05" }, winner: "FNATIC Apex", status: "COMPLETED" },
        { matchId: "v-q3", team1: { name: "LOUD Fury", score: 2, odds: "1.50" }, team2: { name: "Team Liquid Neo", score: 1, odds: "2.50" }, winner: "LOUD Fury", status: "COMPLETED" },
        { matchId: "v-q4", team1: { name: "Gen.G Shadow", score: 2, odds: "1.90" }, team2: { name: "Kugofox Elite", score: 0, odds: "1.90" }, winner: "Gen.G Shadow", status: "COMPLETED" }
      ],
      semiFinals: [
        { matchId: "v-s1", team1: { name: "Sentinels X", score: 2, odds: "1.75" }, team2: { name: "FNATIC Apex", score: 1, odds: "2.10" }, winner: "Sentinels X", status: "COMPLETED" },
        { matchId: "v-s2", team1: { name: "LOUD Fury", score: 2, odds: "1.65" }, team2: { name: "Gen.G Shadow", score: 1, odds: "2.20" }, winner: "LOUD Fury", status: "COMPLETED" }
      ],
      grandFinal: {
        matchId: "v-f1",
        team1: { name: "Sentinels X", score: 1, odds: "1.85", logo: "🛡️" },
        team2: { name: "LOUD Fury", score: 1, odds: "1.95", logo: "⚡" },
        currentMap: "Decider: Haven (Overtime 13-13)",
        status: "LIVE NOW"
      }
    }
  },
  {
    id: "tourney-moba-01",
    gameId: "mobalegends",
    title: "Kugofox Mythic Glory Invitational",
    status: "LIVE",
    prizePool: "$22,000",
    date: "TODAY • SEMI FINALS",
    timeRemaining: "03h 15m",
    teamsCount: 16,
    format: "5v5 Best of 5",
    tier: "Mythic Championship",
    description: "Battle for the Mythic Trophy. 5v5 high-octane drafting, Lord steals, and base sieges.",
    bracket: {
      quarterFinals: [
        { matchId: "m-q1", team1: { name: "Blacklist Vanguard", score: 3, odds: "1.40" }, team2: { name: "Echo Blitz", score: 1, odds: "2.80" }, winner: "Blacklist Vanguard", status: "COMPLETED" },
        { matchId: "m-q2", team1: { name: "ONIC Esports Nova", score: 3, odds: "1.55" }, team2: { name: "RRQ Hoshi Neo", score: 2, odds: "2.40" }, winner: "ONIC Esports Nova", status: "COMPLETED" },
        { matchId: "m-q3", team1: { name: "Bren Cyber", score: 3, odds: "1.70" }, team2: { name: "Todak Storm", score: 0, odds: "2.10" }, winner: "Bren Cyber", status: "COMPLETED" },
        { matchId: "m-q4", team1: { name: "Kugofox Mystic", score: 3, odds: "1.85" }, team2: { name: "EVOS Legends", score: 2, odds: "1.95" }, winner: "Kugofox Mystic", status: "COMPLETED" }
      ],
      semiFinals: [
        { matchId: "m-s1", team1: { name: "Blacklist Vanguard", score: 1, odds: "1.80" }, team2: { name: "ONIC Esports Nova", score: 2, odds: "2.00" }, status: "LIVE NOW", currentMap: "Game 4 (ONIC leads 2-1)" },
        { matchId: "m-s2", team1: { name: "Bren Cyber", score: 0, odds: "1.90" }, team2: { name: "Kugofox Mystic", score: 0, odds: "1.90" }, status: "UPCOMING", currentMap: "Starts after SF1" }
      ],
      grandFinal: {
        matchId: "m-f1",
        team1: { name: "TBD", score: 0, odds: "2.00", logo: "⚔️" },
        team2: { name: "TBD", score: 0, odds: "2.00", logo: "👑" },
        currentMap: "Bo5 Grand Finals",
        status: "SCHEDULED"
      }
    }
  },
  {
    id: "tourney-pubg-01",
    gameId: "pubg",
    title: "Erangel Chicken Dinner Royale",
    status: "UPCOMING",
    prizePool: "$20,000",
    date: "TOMORROW • 19:00 UTC",
    timeRemaining: "18h 30m",
    teamsCount: 25,
    format: "Squads 4-Man • 6 Matches (Erangel / Miramar)",
    tier: "Survival Masters",
    description: "100 players, 25 top professional squads. Points calculated via kill count and survival placement.",
    bracket: {
      quarterFinals: [],
      semiFinals: [],
      grandFinal: {
        matchId: "p-f1",
        team1: { name: "Natus Vincere PUBG", score: 84, odds: "1.70", logo: "🍗" },
        team2: { name: "FaZe Clan Survival", score: 79, odds: "1.80", logo: "🎯" },
        currentMap: "Erangel Military Circle Stage 5",
        status: "STARTS SOON"
      }
    }
  },
  {
    id: "tourney-ff-01",
    gameId: "freefire",
    title: "Booyah Clash Squad Championship",
    status: "LIVE",
    prizePool: "$15,000",
    date: "TODAY • CLASH SQUAD FINALS",
    timeRemaining: "00h 55m",
    teamsCount: 16,
    format: "4v4 Clash Squad Bo7",
    tier: "Clash Squad Premier",
    description: "Insane rush gameplay, split-second gloo wall clutches, and high-stakes 4v4 duels.",
    bracket: {
      quarterFinals: [
        { matchId: "ff-q1", team1: { name: "LOUD FreeFire", score: 4, odds: "1.50" }, team2: { name: "Fluxo Pro", score: 2, odds: "2.50" }, winner: "LOUD FreeFire", status: "COMPLETED" },
        { matchId: "ff-q2", team1: { name: "Total Gaming eSports", score: 4, odds: "1.60" }, team2: { name: "Keyd Stars", score: 3, odds: "2.30" }, winner: "Total Gaming eSports", status: "COMPLETED" },
        { matchId: "ff-q3", team1: { name: "Miners GG", score: 4, odds: "1.75" }, team2: { name: "EVOS Phoenix", score: 1, odds: "2.10" }, winner: "Miners GG", status: "COMPLETED" },
        { matchId: "ff-q4", team1: { name: "Kugofox Rushers", score: 4, odds: "1.65" }, team2: { name: "Corinthians FF", score: 2, odds: "2.20" }, winner: "Kugofox Rushers", status: "COMPLETED" }
      ],
      semiFinals: [
        { matchId: "ff-s1", team1: { name: "LOUD FreeFire", score: 4, odds: "1.80" }, team2: { name: "Total Gaming eSports", score: 3, odds: "2.00" }, winner: "LOUD FreeFire", status: "COMPLETED" },
        { matchId: "ff-s2", team1: { name: "Miners GG", score: 2, odds: "2.10" }, team2: { name: "Kugofox Rushers", score: 4, odds: "1.75" }, winner: "Kugofox Rushers", status: "COMPLETED" }
      ],
      grandFinal: {
        matchId: "ff-f1",
        team1: { name: "LOUD FreeFire", score: 3, odds: "1.90", logo: "🔥" },
        team2: { name: "Kugofox Rushers", score: 3, odds: "1.90", logo: "🦊" },
        currentMap: "Match Point: Round 7 Factory",
        status: "LIVE NOW"
      }
    }
  },
  {
    id: "tourney-cr-01",
    gameId: "clashroyale",
    title: "Kugofox Crown Masters Invitational",
    status: "LIVE",
    prizePool: "$10,000",
    date: "TODAY • 1V1 DUELS",
    timeRemaining: "02h 10m",
    teamsCount: 32,
    format: "1v1 Duel Format (Ban 1 Deck, Win with 2 Decks)",
    tier: "Crown Grand Prix",
    description: "The ultimate Clash Royale strategy championship. Master cycle, beatdown, and bait archetypes.",
    bracket: {
      quarterFinals: [
        { matchId: "cr-q1", team1: { name: "Mohamed Light", score: 2, odds: "1.30" }, team2: { name: "Surgical Goblin", score: 0, odds: "3.20" }, winner: "Mohamed Light", status: "COMPLETED" },
        { matchId: "cr-q2", team1: { name: "Mugi Cyber", score: 2, odds: "1.60" }, team2: { name: "LucasXGamer", score: 1, odds: "2.30" }, winner: "Mugi Cyber", status: "COMPLETED" },
        { matchId: "cr-q3", team1: { name: "Samuel Bassotto", score: 2, odds: "1.70" }, team2: { name: "Airsurfer", score: 1, odds: "2.15" }, winner: "Samuel Bassotto", status: "COMPLETED" },
        { matchId: "cr-q4", team1: { name: "Kugofox CrownKing", score: 2, odds: "1.75" }, team2: { name: "Ruben CR", score: 0, odds: "2.10" }, winner: "Kugofox CrownKing", status: "COMPLETED" }
      ],
      semiFinals: [
        { matchId: "cr-s1", team1: { name: "Mohamed Light", score: 1, odds: "1.65" }, team2: { name: "Mugi Cyber", score: 1, odds: "2.20" }, status: "LIVE NOW", currentMap: "Decider Game 3: Miner Poison vs Lava Hound" },
        { matchId: "cr-s2", team1: { name: "Samuel Bassotto", score: 0, odds: "1.95" }, team2: { name: "Kugofox CrownKing", score: 0, odds: "1.85" }, status: "UPCOMING", currentMap: "Starts after SF1" }
      ],
      grandFinal: {
        matchId: "cr-f1",
        team1: { name: "TBD", score: 0, odds: "2.00", logo: "👑" },
        team2: { name: "TBD", score: 0, odds: "2.00", logo: "⚡" },
        currentMap: "Bo5 Grand Finals",
        status: "SCHEDULED"
      }
    }
  }
];
