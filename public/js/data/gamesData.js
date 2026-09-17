/**
 * Kugofox Gaming Arena - Official Battle Arenas Database
 * 4 Core Titles: Free Fire, BGMI, Valorant, MOBA Legends
 */

export const GAMES_DATA = {
  freefire: {
    id: "freefire",
    name: "Free Fire",
    category: "Action Survival BR",
    tagline: "Battle in Style - Fast 10-Minute Adrenaline Survival",
    description: "Intense mobile battle royale featuring unique character abilities, rapid 50-player matches, gloo wall tactical play, and competitive Clash Squad 4v4 modes.",
    accentColor: "#ff4612",
    secondaryColor: "#ff8c00",
    bgGradient: "linear-gradient(135deg, rgba(255, 70, 18, 0.15), rgba(17, 11, 26, 0.95))",
    icon: "🔥",
    logo: "assets/logos/freefire.png",
    banner: "assets/banners/freefire.jpg",
    badge: "CLASH SQUAD & BR",
    playerBase: "60M+ Active",
    prizePool: "$25,000",
    bannerTag: "BOOYAH PREMIER CUP",
    characters: [
      { name: "Alok", skill: "Drop the Beat", type: "Active", effect: "Creates 5m aura that increases move speed by 15% and restores 30 HP.", role: "Support / Rusher" },
      { name: "Chrono", skill: "Time Turner", type: "Active", effect: "Creates force field blocking 800 DMG. Undisputed defensive anchor.", role: "Defender" },
      { name: "Dimitri", skill: "Healing Heartbeat", type: "Active", effect: "Generates 3.5m healing zone enabling self-revival for all downed teammates.", role: "Medic" },
      { name: "Kelly", skill: "Dash", type: "Passive", effect: "Increases sprinting speed by 6% permanently with burst awakening damage.", role: "Rusher" },
      { name: "Hayato", skill: "Bushido", type: "Passive", effect: "Max armor penetration increases as HP decreases. Lethal comeback master.", role: "Flanker" },
      { name: "Homer", skill: "Senses Shockwave", type: "Active", effect: "Releases drone to nearest frontal enemy, dealing explosive damage & reducing fire rate.", role: "Initiator" }
    ],
    modes: ["Clash Squad Ranked 4v4", "Lone Wolf 1v1", "Battle Royale Ranked", "Bomb Squad 5v5"],
    features: [
      { title: "Gloo Wall Master", desc: "Fast-reaction shield placement tactical drill simulator." },
      { title: "Character Synergy Lab", desc: "Pair active & passive skills to build the ultimate competitive Rusher loadout." },
      { title: "Booyah Pass Rewards", desc: "Earn exclusive neon Kugofox skins and weapon vouchers." }
    ]
  },

  bgmi: {
    id: "bgmi",
    name: "BGMI",
    fullName: "Battlegrounds Mobile India",
    category: "Tactical Battle Royale",
    tagline: "India Ka Battleground - 100 Players, 1 Winner Squad",
    description: "India's premier tactical battle royale. Drop into Erangel, Miramar, and Sanhok, master recoil control, coordinate squad tactics, and claim the Chicken Dinner.",
    accentColor: "#f59e0b",
    secondaryColor: "#ff7700",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(18, 18, 20, 0.95))",
    icon: "🪂",
    logo: "assets/logos/bgmi.png",
    banner: "assets/banners/bgmi.jpg",
    badge: "100-MAN BATTLE ROYALE",
    playerBase: "100M+ Downloads",
    prizePool: "$25,000",
    bannerTag: "BGIS & BMPS TOURNAMENT CIRCUIT",
    dropZones: [
      { name: "Pochinki", map: "Erangel", risk: "EXTREME", lootTier: "Tier 3", desc: "Dense urban hot-drop in center of map with immediate street CQB." },
      { name: "Military Base (Sosnovka)", map: "Erangel", risk: "MAXIMUM", lootTier: "Tier 3+", desc: "Airfield radar towers, crates, Level 3 armor and military sniper spawns." },
      { name: "School & Apartments", map: "Erangel", risk: "VERY HIGH", lootTier: "Tier 3", desc: "High octane indoor firefights, rooftop sniping dominance." },
      { name: "Georgopol Containers", map: "Erangel", risk: "HIGH", lootTier: "Tier 3", desc: "Labyrinth of shipping crates with abundant assault rifles and optics." },
      { name: "Pecado Casino", map: "Miramar", risk: "EXTREME", lootTier: "Tier 3+", desc: "The deadliest multi-floor boxing ring and hotel brawl in the desert." },
      { name: "Bootcamp", map: "Sanhok", risk: "INSANE", lootTier: "Tier 3+", desc: "Main central fortress where 20+ players contest weapons inside 15 seconds." }
    ],
    weapons: [
      { name: "M416", type: "AR", ammo: "5.56mm", desc: "Fully moddable workhorse with supreme stability." },
      { name: "Beryl M762", type: "AR", ammo: "7.62mm", desc: "High recoil, devastating close-range DPS." },
      { name: "AWM", type: "Crate Sniper", ammo: ".300 Magnum", desc: "One-shot kill through Level 3 Spetsnaz helmet." },
      { name: "Kar98k", type: "Sniper", ammo: "7.62mm", desc: "Iconic bolt-action sniper rifle for headshot specialists." }
    ],
    features: [
      { title: "Hot Drop Radar", desc: "Real-time tactical drop zone recommendations based on flight trajectory." },
      { title: "Squad Scrims Hub", desc: "Organized custom rooms for Tier 1 & Tier 2 competitive squads." },
      { title: "Chicken Dinner Bounty", desc: "Accumulate victories for every certified 15+ kill squad victory." }
    ]
  },

  valorant: {
    id: "valorant",
    name: "Valorant",
    category: "Tactical FPS",
    tagline: "Defy the Limits - 5v5 Character-Based Tactical Shooter",
    description: "A precision-focused tactical shooter where crisp gunplay meets game-changing agent abilities. Plant or defuse the Spike in high-stakes 5v5 rounds.",
    accentColor: "#fa4454",
    secondaryColor: "#bd3944",
    bgGradient: "linear-gradient(135deg, rgba(250, 68, 84, 0.15), rgba(15, 25, 35, 0.95))",
    icon: "🎯",
    logo: "assets/logos/valorant.png",
    banner: "assets/banners/valorant.jpg",
    badge: "5v5 TAC-FPS",
    playerBase: "28M+ Active",
    prizePool: "$25,000",
    bannerTag: "VCT STAGE 1 SCENE",
    agents: [
      { name: "Jett", role: "Duelist", country: "South Korea", signature: "Tailwind / Blade Storm", difficulty: "Hard", winRate: "52.4%" },
      { name: "Reyna", role: "Duelist", country: "Mexico", signature: "Dismiss / Empress", difficulty: "Medium", winRate: "53.1%" },
      { name: "Omen", role: "Controller", country: "Unknown", signature: "Dark Cover / From the Shadows", difficulty: "Medium", winRate: "51.8%" },
      { name: "Sova", role: "Initiator", country: "Russia", signature: "Recon Bolt / Hunter's Fury", difficulty: "Hard", winRate: "50.9%" },
      { name: "Killjoy", role: "Sentinel", country: "Germany", signature: "Turret / Lockdown", difficulty: "Medium", winRate: "52.7%" },
      { name: "Chamber", role: "Sentinel", country: "France", signature: "Rendezvous / Tour De Force", difficulty: "Hard", winRate: "51.2%" },
      { name: "Fade", role: "Initiator", country: "Turkey", signature: "Haunt / Nightfall", difficulty: "Medium", winRate: "51.5%" },
      { name: "Viper", role: "Controller", country: "USA", signature: "Toxic Screen / Viper's Pit", difficulty: "Hard", winRate: "53.8%" }
    ],
    maps: ["Ascent", "Haven", "Bind", "Split", "Lotus", "Sunset", "Breeze"],
    weapons: [
      { name: "Vandal", type: "Rifle", cost: "2,900 Creds", fireRate: "9.75 rds/sec", headshot: "160 DMG (Instant Kill)" },
      { name: "Phantom", type: "Rifle", cost: "2,900 Creds", fireRate: "11 rds/sec", headshot: "156 DMG (<15m)" },
      { name: "Operator", type: "Sniper", cost: "4,700 Creds", fireRate: "0.6 rds/sec", headshot: "255 DMG (Body One-Shot)" },
      { name: "Sheriff", type: "Sidearm", cost: "800 Creds", fireRate: "4 rds/sec", headshot: "159 DMG (<30m)" }
    ],
    features: [
      { title: "Aim & Reflex Range", desc: "Test your reaction time with the Kugofox Radiant crosshair test." },
      { title: "Scrim Matchmaker", desc: "Find ready-to-scrim 5-stacks for competitive Ascendant/Immortal lobbies." },
      { title: "Spike Plant Protocol", desc: "Simulate defuse timing down to 0.01s pressure scenarios." }
    ]
  },

  mobalegends: {
    id: "mobalegends",
    name: "MOBA Legends",
    category: "5v5 Action MOBA",
    tagline: "Join Your Friends - 10-Second Matchmaking, 10-Minute Match",
    description: "Classic 3-lane 5v5 MOBA action. Real-time team fights, tower pushes, jungle boss steals, and deep hero counter-play. Settle the score in the Land of Dawn.",
    accentColor: "#00f0ff",
    secondaryColor: "#7928ca",
    bgGradient: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(12, 16, 51, 0.95))",
    icon: "⚔️",
    logo: "assets/logos/mobalegends.png",
    banner: "assets/banners/mobalegends.jpg",
    badge: "5v5 TOWER DEFENSE",
    playerBase: "50M+ Active",
    prizePool: "$22,000",
    bannerTag: "MYTHIC GLORY CHAMPIONSHIP",
    heroes: [
      { name: "Fanny", role: "Assassin", lane: "Jungle", diff: "MAX", counter: "Khufra, Franco", signature: "Steel Cable & Tornado Strike", icon: "🗡️" },
      { name: "Chou", role: "Fighter", lane: "Exp Lane / Roam", diff: "Hard", counter: "Diggie, Valir", signature: "Jeet Kune Do & The Way of Dragon", icon: "🥊" },
      { name: "Granger", role: "Marksman", lane: "Gold Lane / Jungle", diff: "Medium", counter: "Lolita, Hayabusa", signature: "Rhapsody & Death Sonata", icon: "🔫" },
      { name: "Kagura", role: "Mage", lane: "Mid Lane", diff: "Hard", counter: "Chou, Eudora", signature: "Seimei Umbrella Open & Yin Yang Overturn", icon: "☂️" },
      { name: "Tigreal", role: "Tank", lane: "Roam", diff: "Easy", counter: "Diggie, Akai", signature: "Sacred Hammer & Implosion", icon: "🛡️" },
      { name: "Ling", role: "Assassin", lane: "Jungle", diff: "Hard", counter: "Minsitthar, Saber", signature: "Finch Poise & Tempest of Blades", icon: "🦅" },
      { name: "Beatrix", role: "Marksman", lane: "Gold Lane", diff: "Hard", counter: "Natalia, Clint", signature: "Mechanical Genius & 4 Swap Weapons", icon: "⚡" },
      { name: "Estes", role: "Support", lane: "Roam", diff: "Easy", counter: "Baxia, Dominance Ice", signature: "Moonlight Immersion & Blessing of Moon Goddess", icon: "🌿" }
    ],
    objectives: [
      { name: "Lord", timer: "8:00 min", effect: "Spawns mega-reinforcement siege boss pushing weakest enemy lane." },
      { name: "Turtle", timer: "2:00 min", effect: "Grants team shield, bonus gold, and sustained damage buff." },
      { name: "Lithowanderer", timer: "0:45 min", effect: "River scout granting vision and mana regeneration." }
    ],
    features: [
      { title: "Draft & Ban Simulator", desc: "Simulate pro tournament picks and bans with meta counter-hero suggestions." },
      { title: "Objective Clock", desc: "Live countdowns for Turtle, Lord, and buff timers." },
      { title: "Mythic Scrim Ladder", desc: "Verified 5-man squads competing for cash prize invitations." }
    ]
  }
};
