/**
 * Kugofox Gaming Arena - Leaderboard Database
 * 4 Supported Games: Free Fire, BGMI, Valorant, MOBA Legends
 */

export const LEADERBOARD_DATA = {
  global: [
    { rank: 1, name: "KogoPhantom", tag: "#FOX1", game: "Valorant", tier: "Radiant #1", rating: 2840, winRate: "78.4%", earnings: "$42,500", team: "Kugofox Prime", country: "🇺🇸", avatar: "🦊" },
    { rank: 2, name: "ViperStrike", tag: "#LOUD", game: "Valorant", tier: "Radiant #4", rating: 2790, winRate: "75.2%", earnings: "$38,000", team: "LOUD Fury", country: "🇧🇷", avatar: "🐍" },
    { rank: 3, name: "LordSlayer", tag: "#ONIC", game: "MOBA Legends", tier: "Mythic Immortal", rating: 2740, winRate: "81.0%", earnings: "$35,500", team: "ONIC Nova", country: "🇮🇩", avatar: "⚡" },
    { rank: 4, name: "JonathanGod", tag: "#GODL", game: "BGMI", tier: "Conqueror #1", rating: 2710, winRate: "76.4%", earnings: "$34,000", team: "GodLike Esports", country: "🇮🇳", avatar: "👑" },
    { rank: 5, name: "BooyahGod", tag: "#RUSH", game: "Free Fire", tier: "Grandmaster IV", rating: 2630, winRate: "74.8%", earnings: "$27,000", team: "Kugofox Rushers", country: "🇮🇳", avatar: "🔥" },
    { rank: 6, name: "MortalSoul", tag: "#SOUL", game: "BGMI", tier: "Conqueror #8", rating: 2600, winRate: "73.1%", earnings: "$26,500", team: "Team Soul", country: "🇮🇳", avatar: "🎯" },
    { rank: 7, name: "ShadowAce", tag: "#FNC", game: "Valorant", tier: "Radiant #12", rating: 2550, winRate: "71.6%", earnings: "$22,000", team: "FNATIC Apex", country: "🇬🇧", avatar: "🗡️" },
    { rank: 8, name: "MysticFanny", tag: "#KOG", game: "MOBA Legends", tier: "Mythical Glory", rating: 2510, winRate: "76.4%", earnings: "$19,500", team: "Kugofox Mystic", country: "🇵🇭", avatar: "🦅" }
  ],
  valorant: [
    { rank: 1, name: "KogoPhantom", tag: "#FOX1", tier: "Radiant #1", rating: 2840, winRate: "78.4%", kda: "1.68", main: "Jett / Omen", team: "Kugofox Prime", country: "🇺🇸", headshotRate: "38.2%" },
    { rank: 2, name: "ViperStrike", tag: "#LOUD", tier: "Radiant #4", rating: 2790, winRate: "75.2%", kda: "1.54", main: "Viper / Fade", team: "LOUD Fury", country: "🇧🇷", headshotRate: "34.7%" },
    { rank: 3, name: "ShadowAce", tag: "#FNC", tier: "Radiant #12", rating: 2550, winRate: "71.6%", kda: "1.49", main: "Reyna / Chamber", team: "FNATIC Apex", country: "🇬🇧", headshotRate: "36.0%" },
    { rank: 4, name: "ChronosVal", tag: "#SEN", tier: "Radiant #18", rating: 2490, winRate: "69.8%", kda: "1.42", main: "Sova / Killjoy", team: "Sentinels X", country: "🇨🇦", headshotRate: "31.5%" }
  ],
  bgmi: [
    { rank: 1, name: "JonathanGod", tag: "#GODL", tier: "Conqueror #1", rating: 2710, winRate: "76.4%", avgKills: "9.2", mainWeapon: "M416 / Beryl", team: "GodLike Esports", country: "🇮🇳", dinners: 410 },
    { rank: 2, name: "MortalSoul", tag: "#SOUL", tier: "Conqueror #8", rating: 2600, winRate: "73.1%", avgKills: "8.1", mainWeapon: "M416 / AWM", team: "Team Soul", country: "🇮🇳", dinners: 362 },
    { rank: 3, name: "ScoutOP", tag: "#TX", tier: "Conqueror #15", rating: 2540, winRate: "70.5%", avgKills: "7.8", mainWeapon: "M416 / DP-28", team: "Team XSpark", country: "🇮🇳", dinners: 320 }
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
  ]
};
