/**
 * Kugofox Gaming Arena - Comprehensive Game Database
 * Order: 1st Free Fire, 2nd MOBA Legends, 3rd Valorant, 4th PUBG, 5th Clash Royale
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

  pubg: {
    id: "pubg",
    name: "PUBG: Battlegrounds",
    category: "Battle Royale",
    tagline: "Winner Winner Chicken Dinner - 100 Players, 1 Survivor",
    description: "The pioneer of battle royale. Drop onto massive 8x8 km maps, loot high-tier tactical gear, navigate deadly blue zones, and battle to be the last squad standing.",
    accentColor: "#f2a900",
    secondaryColor: "#ff7700",
    bgGradient: "linear-gradient(135deg, rgba(242, 169, 0, 0.15), rgba(18, 18, 20, 0.95))",
    icon: "🪂",
    logo: "assets/logos/pubg.png",
    badge: "100-MAN BATTLE ROYALE",
    playerBase: "45M+ Active",
    prizePool: "$20,000",
    bannerTag: "ERANGEL SURVIVAL CUP",
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

  clashroyale: {
    id: "clashroyale",
    name: "Clash Royale",
    category: "Real-Time Strategy Card Battler",
    tagline: "Enter the Arena - Fast 1v1 & 2v2 Card Battles",
    description: "Collect and upgrade dozens of cards featuring troops, spells, and defenses. Knock the enemy King and Princesses from their towers in dynamic 3-minute battles.",
    accentColor: "#38bdf8",
    secondaryColor: "#eab308",
    bgGradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(30, 41, 59, 0.95))",
    icon: "👑",
    logo: "assets/logos/clashroyale.png",
    badge: "1v1 REAL-TIME STRATEGY",
    playerBase: "35M+ Active",
    prizePool: "$10,000",
    bannerTag: "CROWN ROYALE GRAND PRIX",
    cards: [
      { id: "pekka", name: "P.E.K.K.A", elixir: 7, rarity: "Epic", type: "Troop", dps: "516 DMG", target: "Ground", role: "Tank Killer / Win Condition Defender" },
      { id: "megaknight", name: "Mega Knight", elixir: 7, rarity: "Legendary", type: "Troop", dps: "Spawn Splash + Jump", target: "Ground", role: "Area Splash / Push Stopper" },
      { id: "hogrider", name: "Hog Rider", elixir: 4, rarity: "Rare", type: "Troop", dps: "Fast Tower Rusher", target: "Buildings", role: "Fast Cycle Win Condition" },
      { id: "goblinbarrel", name: "Goblin Barrel", elixir: 3, rarity: "Epic", type: "Spell", dps: "Direct Tower Spawn", target: "Anywhere", role: "Spell Bait Win Condition" },
      { id: "electro", name: "Electro Wizard", elixir: 4, rarity: "Legendary", type: "Troop", dps: "Dual Zap Stun", target: "Air & Ground", role: "Reset & Air Defense" },
      { id: "fireball", name: "Fireball", elixir: 4, rarity: "Rare", type: "Spell", dps: "High Burst Knockback", target: "Area", role: "Medium Spell Removal" },
      { id: "log", name: "The Log", elixir: 2, rarity: "Legendary", type: "Spell", dps: "Ground Knockback", target: "Ground", role: "Cheap Swarm Sweeper" },
      { id: "princess", name: "Princess", elixir: 3, rarity: "Legendary", type: "Troop", dps: "Longest Range AOE", target: "Ground & Air", role: "Bridge Pressure & Bait" },
      { id: "bandit", name: "Bandit", elixir: 3, rarity: "Legendary", type: "Troop", dps: "Invulnerable Dash", target: "Ground", role: "Single Target Assassin" },
      { id: "icespirit", name: "Ice Spirit", elixir: 1, rarity: "Common", type: "Troop", dps: "1.2s Freeze Stun", target: "Air & Ground", role: "Cycle & Stun" },
      { id: "knight", name: "Knight", elixir: 3, rarity: "Common", type: "Troop", dps: "High HP Melee Tank", target: "Ground", role: "Cheap Defense Anchor" },
      { id: "musketeer", name: "Musketeer", elixir: 4, rarity: "Rare", type: "Troop", dps: "High Single-target Range", target: "Air & Ground", role: "DPS & Anti-Air" },
      { id: "babydragon", name: "Baby Dragon", elixir: 4, rarity: "Epic", type: "Troop", dps: "Flying Splash", target: "Air & Ground", role: "Flying Splash Tank" },
      { id: "infernotower", name: "Inferno Tower", elixir: 5, rarity: "Rare", type: "Building", dps: "Ramping Melter", target: "Air & Ground", role: "Heavy Tank Destroyer" },
      { id: "miner", name: "Miner", elixir: 3, rarity: "Legendary", type: "Troop", dps: "Burrows anywhere", target: "Ground", role: "Chipping & Tanking" },
      { id: "skarmy", name: "Skeleton Army", elixir: 3, rarity: "Epic", type: "Troop", dps: "15 Skeletons Swarm", target: "Ground", role: "Single Target Shredder" }
    ],
    features: [
      { title: "8-Card Deck Laboratory", desc: "Build custom decks, calculate real-time elixir averages, and analyze archetype balance." },
      { title: "Deck Battle Simulator", desc: "Simulate deck synergy score against Meta Beatdown, Cycle, and Siege archetypes." },
      { title: "Crown Cup Scrims", desc: "Compete in standard tournament level cap (Level 11) scrims." }
    ]
  }
};
