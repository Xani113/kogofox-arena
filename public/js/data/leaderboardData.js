/**
 * Kugofox Gaming Arena - Leaderboard Database
 */

export const LEADERBOARD_DATA = {
  global: [
    { rank: 1, name: "KogoPhantom", tag: "#FOX1", game: "Valorant", tier: "Radiant #1", rating: 2840, winRate: "78.4%", earnings: "$42,500", team: "Kugofox Prime", country: "🇺🇸", avatar: "🦊" },
    { rank: 2, name: "ViperStrike", tag: "#LOUD", game: "Valorant", tier: "Radiant #4", rating: 2790, winRate: "75.2%", earnings: "$38,000", team: "LOUD Fury", country: "🇧🇷", avatar: "🐍" },
    { rank: 3, name: "LordSlayer", tag: "#ONIC", game: "MOBA Legends", tier: "Mythic Immortal", rating: 2740, winRate: "81.0%", earnings: "$35,500", team: "ONIC Nova", country: "🇮🇩", avatar: "⚡" },
    { rank: 4, name: "ChickenReaper", tag: "#NAVI", game: "PUBG", tier: "Grandmaster", rating: 2680, winRate: "68.9%", earnings: "$31,200", team: "Natus Vincere", country: "🇺🇦", avatar: "🎯" },
    { rank: 5, name: "BooyahGod", tag: "#RUSH", game: "Free Fire", tier: "Grandmaster IV", rating: 2630, winRate: "74.8%", earnings: "$27,000", team: "Kugofox Rushers", country: "🇮🇳", avatar: "🔥" },
    { rank: 6, name: "CrownPrince", tag: "#CR77", game: "Clash Royale", tier: "Ultimate Champion", rating: 2590, winRate: "79.3%", earnings: "$24,800", team: "Royal Kings", country: "🇯🇵", avatar: "👑" },
    { rank: 7, name: "ShadowAce", tag: "#FNC", game: "Valorant", tier: "Radiant #12", rating: 2550, winRate: "71.6%", earnings: "$22,000", team: "FNATIC Apex", country: "🇬🇧", avatar: "🗡️" },
    { rank: 8, name: "MysticFanny", tag: "#KOG", game: "MOBA Legends", tier: "Mythical Glory", rating: 2510, winRate: "76.4%", earnings: "$19,500", team: "Kugofox Mystic", country: "🇵🇭", avatar: "🦅" }
  ],
  valorant: [
    { rank: 1, name: "KogoPhantom", tag: "#FOX1", tier: "Radiant #1", rating: 2840, winRate: "78.4%", kda: "1.68", main: "Jett / Omen", team: "Kugofox Prime", country: "🇺🇸", headshotRate: "38.2%" },
    { rank: 2, name: "ViperStrike", tag: "#LOUD", tier: "Radiant #4", rating: 2790, winRate: "75.2%", kda: "1.54", main: "Viper / Fade", team: "LOUD Fury", country: "🇧🇷", headshotRate: "34.7%" },
    { rank: 3, name: "ShadowAce", tag: "#FNC", tier: "Radiant #12", rating: 2550, winRate: "71.6%", kda: "1.49", main: "Reyna / Chamber", team: "FNATIC Apex", country: "🇬🇧", headshotRate: "36.0%" },
    { rank: 4, name: "ChronosVal", tag: "#SEN", tier: "Radiant #18", rating: 2490, winRate: "69.8%", kda: "1.42", main: "Sova / Killjoy", team: "Sentinels X", country: "🇨🇦", headshotRate: "31.5%" }
  ],
  pubg: [
    { rank: 1, name: "ChickenReaper", tag: "#NAVI", tier: "Grandmaster", rating: 2680, winRate: "68.9%", avgKills: "8.4", mainWeapon: "M416 / AWM", team: "Natus Vincere", country: "🇺🇦", dinners: 342 },
    { rank: 2, name: "PochinkiGhost", tag: "#FAZE", tier: "Master I", rating: 2590, winRate: "64.2%", avgKills: "7.9", mainWeapon: "Beryl / Kar98k", team: "FaZe Survival", country: "🇩🇪", dinners: 298 },
    { rank: 3, name: "AirdropKing", tag: "#KOG", tier: "Master II", rating: 2520, winRate: "62.0%", avgKills: "7.2", mainWeapon: "Groza / SLR", team: "Kugofox Squad", country: "🇰🇷", dinners: 275 }
  ],
  freefire: [
    { rank: 1, name: "BooyahGod", tag: "#RUSH", tier: "Grandmaster IV", rating: 2630, winRate: "74.8%", headshots: "72%", mainChar: "Alok / Hayato", team: "Kugofox Rushers", country: "🇮🇳", booyahs: 512 },
    { rank: 2, name: "GlooWallSpeed", tag: "#LOUD", tier: "Grandmaster III", rating: 2580, winRate: "71.4%", headshots: "68%", mainChar: "Chrono / Kelly", team: "LOUD FreeFire", country: "🇧🇷", booyahs: 480 },
    { rank: 3, name: "TotalRuler", tag: "#TG", tier: "Grandmaster I", rating: 2490, winRate: "67.9%", headshots: "65%", mainChar: "Dimitri / Homer", team: "Total Gaming", country: "🇮🇳", booyahs: 441 }
  ],
  mobalegends: [
    { rank: 1, name: "LordSlayer", tag: "#ONIC", tier: "Mythic Immortal 180★", rating: 2740, winRate: "81.0%", kda: "8.6", mainHero: "Fanny / Ling", team: "ONIC Nova", country: "🇮🇩", mvpCount: 620 },
    { rank: 2, name: "MysticFanny", tag: "#KOG", tier: "Mythical Glory 120★", rating: 2510, winRate: "76.4%", kda: "7.9", mainHero: "Chou / Beatrix", team: "Kugofox Mystic", country: "🇵🇭", mvpCount: 540 },
    { rank: 3, name: "CodeBlack", tag: "#BLCK", tier: "Mythical Glory 95★", rating: 2460, winRate: "73.2%", kda: "7.1", mainHero: "Estes / Tigreal", team: "Blacklist Vanguard", country: "🇵🇭", mvpCount: 490 }
  ],
  clashroyale: [
    { rank: 1, name: "CrownPrince", tag: "#CR77", tier: "Ultimate Champion (3250)", rating: 2590, winRate: "79.3%", grandChallenges: 84, favoriteCard: "P.E.K.K.A", team: "Royal Kings", country: "🇯🇵" },
    { rank: 2, name: "HogCycleGod", tag: "#LIGHT", tier: "Ultimate Champion (3190)", rating: 2540, winRate: "76.8%", grandChallenges: 78, favoriteCard: "Hog Rider", team: "Mohamed Squad", country: "🇪🇬" },
    { rank: 3, name: "BaitMasterX", tag: "#KOG", tier: "Ultimate Champion (3080)", rating: 2480, winRate: "72.5%", grandChallenges: 65, favoriteCard: "Goblin Barrel", team: "Kugofox Crown", country: "🇪🇸" }
  ]
};
