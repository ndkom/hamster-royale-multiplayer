// Game configuration and constants
export const CONFIG = {
  // Difficulty presets
  difficulty: {
    easy: {
      enemyHealth: 40,
      enemyDamage: 5,
      enemySpeed: 6,
      enemyShootCooldown: 3000,
      enemyShootRange: 40,
      enemiesPerTeam: 3,
      spawnInterval: 5
    },
    medium: {
      enemyHealth: 60,
      enemyDamage: 10,
      enemySpeed: 8,
      enemyShootCooldown: 2000,
      enemyShootRange: 50,
      enemiesPerTeam: 4,
      spawnInterval: 4
    },
    hard: {
      enemyHealth: 80,
      enemyDamage: 15,
      enemySpeed: 10,
      enemyShootCooldown: 1500,
      enemyShootRange: 60,
      enemiesPerTeam: 5,
      spawnInterval: 3
    }
  },

  currentDifficulty: 'medium', // Default difficulty

  // Weapons configuration
  weapons: {
    RANGED: {
      name: 'Blaster',
      damage: 20,
      fireRate: 200, // ms between shots
      ammo: 60,
      maxAmmo: 60,
      reloadTime: 2000,
      spread: 0.02,
      range: 100,
      automatic: true,
      color: 0x00ffff,
      type: 'ranged'
    },
    MELEE: {
      name: 'Bonk Stick',
      damage: 50,
      fireRate: 500,
      ammo: Infinity,
      maxAmmo: Infinity,
      reloadTime: 0,
      spread: 0,
      range: 3,
      automatic: false,
      color: 0xff6600,
      type: 'melee'
    }
  },

  // Player configuration
  player: {
    maxHealth: 200,
    moveSpeed: 12,
    eyeHeight: 1.6,
    groundLevel: 1
  },

  // Team configuration
  teams: {
    red: {
      color: 0xff4444,
      name: 'Red Team'
    },
    blue: {
      color: 0x4444ff,
      name: 'Blue Team'
    }
  },

  // Enemy configuration (dynamically adjusted by difficulty)
  enemy: {
    spawnRadius: 50,
    minSpawnDistance: 20,
    botsPerTeam: 10 // Always maintain 10 bots per team
  },

  // Build configuration
  build: {
    wallHealth: 200,
    maxWalls: 20,
    placementRange: 10,
    buildCooldown: 2000 // ms between wall placements
  },

  // Environment obstacles
  environment: {
    treeCount: 15,
    rockCount: 10
  },

  // Arena configuration
  arena: {
    size: 200
  }
};
