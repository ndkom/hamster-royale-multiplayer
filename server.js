// Hamsters FFA Multiplayer Server
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Game state
const players = new Map(); // playerId -> player data (both real and AI)
const realPlayers = new Set(); // Track which players are real humans
const healthPickups = new Map(); // Health pickups on the map
const MAX_HEALTH_PICKUPS = 5;
const HEALTH_RESPAWN_TIME = 15000; // 15 seconds to respawn
const HEALTH_AMOUNT = 35; // Health restored per pickup
const PLAYER_TIMEOUT = 10000; // 10 seconds without movement = frozen

const gameState = {
  teamScores: { red: 0, blue: 0 },
  walls: [],
  projectiles: [],
  difficulty: 'medium',
  gameStarted: true,
  botsPerTeam: 10
};

// Generate random position for health pickup
function randomHealthPosition() {
  return {
    x: Math.random() * 160 - 80, // -80 to 80
    y: 1.5,
    z: Math.random() * 160 - 80
  };
}

// Spawn a health pickup
function spawnHealthPickup() {
  if (healthPickups.size >= MAX_HEALTH_PICKUPS) return;

  const id = 'health-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const pickup = {
    id,
    position: randomHealthPosition(),
    amount: HEALTH_AMOUNT,
    active: true
  };

  healthPickups.set(id, pickup);
  io.emit('healthSpawned', pickup);
  console.log(`Health pickup spawned: ${id}`);
}

// Initialize health pickups
function initializeHealthPickups() {
  for (let i = 0; i < MAX_HEALTH_PICKUPS; i++) {
    spawnHealthPickup();
  }
}

// Check for frozen/disconnected players
function checkFrozenPlayers() {
  const now = Date.now();
  for (const [playerId, player] of players.entries()) {
    if (!player.isBot && player.lastActivity) {
      const timeSinceActivity = now - player.lastActivity;
      if (timeSinceActivity > PLAYER_TIMEOUT && !player.isFrozen) {
        player.isFrozen = true;
        io.emit('playerFrozen', { id: playerId, name: player.name });
        console.log(`Player frozen: ${player.name} (no activity for ${timeSinceActivity}ms)`);
      }
      // Remove after 30 seconds of being frozen
      if (timeSinceActivity > PLAYER_TIMEOUT * 3) {
        console.log(`Removing frozen player: ${player.name}`);
        players.delete(playerId);
        realPlayers.delete(playerId);
        io.emit('playerLeft', playerId);
        // Spawn replacement bot
        spawnReplacementBot(player.team, player.position);
      }
    }
  }
}

// Spawn a replacement bot when player leaves/disconnects
function spawnReplacementBot(team, position) {
  const botCount = Array.from(players.values()).filter(p => p.isBot && p.team === team).length;
  const botId = `bot-${team}-${Date.now()}`;
  players.set(botId, {
    id: botId,
    name: `${team === 'red' ? 'Red' : 'Blue'} Bot ${botCount + 1}`,
    team: team,
    position: position,
    rotation: 0,
    health: 100,
    kills: 0,
    deaths: 0,
    skinType: Math.floor(Math.random() * 5),
    isBot: true
  });
  io.emit('botAdded', players.get(botId));
}

// Start periodic checks
setInterval(checkFrozenPlayers, 2000); // Check every 2 seconds
setInterval(() => {
  // Respawn health pickups if below max
  if (healthPickups.size < MAX_HEALTH_PICKUPS) {
    spawnHealthPickup();
  }
}, 5000); // Check every 5 seconds

// Initialize AI bots
function initializeBots() {
  // Create 10 red bots
  for (let i = 0; i < gameState.botsPerTeam; i++) {
    const botId = `bot-red-${i}`;
    players.set(botId, {
      id: botId,
      name: `Red Bot ${i + 1}`,
      team: 'red',
      position: { x: Math.random() * 40 - 20, y: 1, z: 40 + Math.random() * 20 },
      rotation: 0,
      health: 100,
      kills: 0,
      deaths: 0,
      skinType: Math.floor(Math.random() * 5),
      isBot: true
    });
  }
  
  // Create 10 blue bots
  for (let i = 0; i < gameState.botsPerTeam; i++) {
    const botId = `bot-blue-${i}`;
    players.set(botId, {
      id: botId,
      name: `Blue Bot ${i + 1}`,
      team: 'blue',
      position: { x: Math.random() * 40 - 20, y: 1, z: -40 - Math.random() * 20 },
      rotation: 0,
      health: 100,
      kills: 0,
      deaths: 0,
      skinType: Math.floor(Math.random() * 5),
      isBot: true
    });
  }
  
  console.log('Initialized 20 AI bots (10 per team)');
}

// Initialize bots and health pickups on server start
initializeBots();
initializeHealthPickups();

// Serve static files with no-cache headers for JS files
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Player joins with name and team - replaces a bot
  socket.on('join', (data) => {
    const { name, team, difficulty } = data;

    // Only the FIRST real player can set difficulty
    // After that, everyone uses the server's difficulty
    const isFirstPlayer = realPlayers.size === 0;
    if (isFirstPlayer && difficulty) {
      gameState.difficulty = difficulty;
      console.log(`First player ${name} set difficulty to: ${difficulty}`);
    } else {
      console.log(`${name} joining with server difficulty: ${gameState.difficulty}`);
    }
    
    // Find a bot on the selected team to replace
    let replacedBot = null;
    for (const [botId, bot] of players.entries()) {
      if (bot.isBot && bot.team === team) {
        replacedBot = { id: botId, ...bot };
        players.delete(botId); // Remove the bot
        break;
      }
    }
    
    // Create player (inheriting bot's position if we found one)
    const startPos = replacedBot 
      ? replacedBot.position 
      : { x: 0, y: 1, z: team === 'red' ? 40 : -40 };
    
    players.set(socket.id, {
      id: socket.id,
      name: name,
      team: team,
      position: startPos,
      rotation: 0,
      health: 100,
      kills: 0,
      playerKills: 0,
      botKills: 0,
      deaths: 0,
      skinType: Math.floor(Math.random() * 5),
      isBot: false,
      isDead: false,
      isFrozen: false,
      joinedAt: Date.now(),
      lastActivity: Date.now()
    });

    realPlayers.add(socket.id);

    // Send current game state to new player (including health pickups)
    socket.emit('init', {
      playerId: socket.id,
      players: Array.from(players.values()),
      gameState: gameState,
      healthPickups: Array.from(healthPickups.values())
    });

    // Notify all other players that bot was replaced
    socket.broadcast.emit('playerJoined', players.get(socket.id));
    if (replacedBot) {
      socket.broadcast.emit('botReplaced', { botId: replacedBot.id, playerId: socket.id });
    }
    
    console.log(`${name} joined ${team} team (replaced ${replacedBot ? replacedBot.name : 'no bot'})`);
  });

  // Player movement update
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      player.lastActivity = Date.now();

      // Clear frozen status if player was frozen
      if (player.isFrozen) {
        player.isFrozen = false;
        io.emit('playerUnfrozen', { id: socket.id });
      }

      // Broadcast to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  // Player shoots
  socket.on('shoot', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast shot to all players
      io.emit('playerShot', {
        playerId: socket.id,
        position: data.position,
        direction: data.direction,
        weaponType: data.weaponType,
        color: data.color
      });
    }
  });

  // Player hit
  socket.on('playerHit', (data) => {
    const { targetId, damage } = data;
    const target = players.get(targetId);
    const shooter = players.get(socket.id);

    console.log(`HIT EVENT: ${shooter?.name || 'unknown'} -> ${target?.name || 'unknown'} (${targetId}) for ${damage} damage`);

    if (!target) {
      console.log(`  ERROR: Target ${targetId} not found in players!`);
      console.log(`  Available players:`, Array.from(players.keys()));
      return;
    }
    if (!shooter) {
      console.log(`  ERROR: Shooter ${socket.id} not found!`);
      return;
    }

    target.health -= damage;
    console.log(`  ${target.name} health: ${target.health + damage} -> ${target.health}`);

      // Notify target they were hit (only if real player)
      if (!target.isBot) {
        io.to(targetId).emit('takeDamage', { damage, from: socket.id, health: target.health });
      }

      // Broadcast health update to all players (so they see health bars)
      io.emit('playerHealthUpdate', {
        id: targetId,
        health: target.health
      });

      // Check if player died
      if (target.health <= 0) {
        // Update scores
        gameState.teamScores[shooter.team]++;
        shooter.kills++;
        target.deaths = (target.deaths || 0) + 1;

        // Track player vs bot kills
        if (target.isBot) {
          shooter.botKills = (shooter.botKills || 0) + 1;
        } else {
          shooter.playerKills = (shooter.playerKills || 0) + 1;
        }

        // Mark target as dead
        target.isDead = true;

        // Notify all players of kill (include kill breakdown)
        io.emit('playerKilled', {
          killerId: socket.id,
          killerName: shooter.name,
          killerKills: shooter.kills,
          killerPlayerKills: shooter.playerKills || 0,
          killerBotKills: shooter.botKills || 0,
          victimId: targetId,
          victimName: target.name,
          victimIsBot: target.isBot,
          teamScores: gameState.teamScores
        });

        // Broadcast that player is dead (for visual indicator)
        io.emit('playerDied', {
          id: targetId,
          name: target.name,
          respawnIn: 3000
        });

        // Respawn target after delay
        setTimeout(() => {
          if (players.has(targetId)) {
            target.health = 100;
            target.isDead = false;
            target.position = {
              x: Math.random() * 40 - 20,
              y: 1,
              z: target.team === 'red' ? 40 + Math.random() * 20 : -40 - Math.random() * 20
            };

            // Notify if real player
            if (!target.isBot) {
              io.to(targetId).emit('respawn', {
                position: target.position,
                health: target.health
              });
            }

            io.emit('playerRespawned', {
              id: targetId,
              position: target.position,
              health: target.health
            });
          }
        }, 3000);
      } else {
        // Just update health (only if real player)
        if (!target.isBot) {
          io.to(targetId).emit('healthUpdate', { health: target.health });
        }
      }
    }
  });
  
  // Request leaderboard
  socket.on('requestLeaderboard', () => {
    const now = Date.now();
    const realPlayersList = Array.from(players.values()).filter(p => !p.isBot);
    console.log(`Leaderboard requested. Real players: ${realPlayersList.length}`);

    const leaderboard = realPlayersList
      .sort((a, b) => b.kills - a.kills)
      .map(p => ({
        name: p.name,
        team: p.team,
        kills: p.kills,
        playerKills: p.playerKills || 0,
        botKills: p.botKills || 0,
        deaths: p.deaths || 0,
        isDead: p.isDead || false,
        playTime: Math.floor((now - (p.joinedAt || now)) / 1000)
      }));

    socket.emit('leaderboard', {
      players: leaderboard,
      teamScores: gameState.teamScores
    });
  });

  // Wall placed
  socket.on('wallPlaced', (data) => {
    gameState.walls.push({
      id: Date.now() + Math.random(),
      position: data.position,
      rotation: data.rotation,
      health: 200
    });
    
    // Broadcast to all players
    io.emit('wallCreated', data);
  });

  // Wall destroyed
  socket.on('wallDestroyed', (data) => {
    gameState.walls = gameState.walls.filter(w =>
      w.position.x !== data.position.x ||
      w.position.z !== data.position.z
    );

    // Broadcast to all players
    io.emit('wallRemoved', data);
  });

  // Player picks up health
  socket.on('pickupHealth', (data) => {
    const player = players.get(socket.id);
    const pickup = healthPickups.get(data.pickupId);

    if (player && pickup && pickup.active) {
      // Give health to player (cap at 100)
      const oldHealth = player.health;
      player.health = Math.min(100, player.health + pickup.amount);
      const healthGained = player.health - oldHealth;

      // Remove pickup
      pickup.active = false;
      healthPickups.delete(data.pickupId);

      // Notify all players
      io.emit('healthPickedUp', {
        pickupId: data.pickupId,
        playerId: socket.id,
        playerName: player.name,
        healthGained: healthGained,
        newHealth: player.health
      });

      // Notify the player who picked it up
      socket.emit('healthUpdate', { health: player.health });

      console.log(`${player.name} picked up health (+${healthGained})`);

      // Respawn health after delay
      setTimeout(() => {
        spawnHealthPickup();
      }, HEALTH_RESPAWN_TIME);
    }
  });

  // Player disconnects - replace with bot
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player && !player.isBot) {
      console.log(`${player.name} disconnected`);
      
      realPlayers.delete(socket.id);
      const team = player.team;
      const position = player.position;
      
      // Remove player
      players.delete(socket.id);
      
      // Create a new bot to replace them
      const botCount = Array.from(players.values()).filter(p => p.isBot && p.team === team).length;
      const botId = `bot-${team}-${Date.now()}`;
      players.set(botId, {
        id: botId,
        name: `${team === 'red' ? 'Red' : 'Blue'} Bot ${botCount + 1}`,
        team: team,
        position: position,
        rotation: 0,
        health: 100,
        kills: 0,
        deaths: 0,
        skinType: Math.floor(Math.random() * 5),
        isBot: true
      });
      
      // Notify all players
      io.emit('playerLeft', socket.id);
      io.emit('botAdded', players.get(botId));
      
      console.log(`Replaced ${player.name} with ${players.get(botId).name}`);
    }
  });

  // Chat message
  socket.on('chatMessage', (message) => {
    const player = players.get(socket.id);
    if (player) {
      io.emit('chatMessage', {
        playerId: socket.id,
        name: player.name,
        team: player.team,
        message: message
      });
    }
  });
});

http.listen(PORT, () => {
  console.log(`🎮 Hamsters FFA Server running on port ${PORT}`);
});
