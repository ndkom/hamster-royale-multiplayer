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
const gameState = {
  teamScores: { red: 0, blue: 0 },
  walls: [],
  projectiles: [],
  difficulty: 'medium', // Default difficulty
  gameStarted: true, // Game always running
  botsPerTeam: 10
};

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

// Initialize bots on server start
initializeBots();

// Serve static files
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Player joins with name and team - replaces a bot
  socket.on('join', (data) => {
    const { name, team, difficulty } = data;
    
    // Update difficulty if provided
    if (difficulty) {
      gameState.difficulty = difficulty;
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
      deaths: 0,
      skinType: Math.floor(Math.random() * 5),
      isBot: false,
      joinedAt: Date.now() // Track when player joined for session time
    });
    
    realPlayers.add(socket.id);

    // Send current game state to new player
    socket.emit('init', {
      playerId: socket.id,
      players: Array.from(players.values()),
      gameState: gameState
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
    
    if (target && shooter) {
      target.health -= damage;
      
      // Notify target they were hit (only if real player)
      if (!target.isBot) {
        io.to(targetId).emit('takeDamage', { damage, from: socket.id });
      }
      
      // Check if player died
      if (target.health <= 0) {
        // Update scores
        gameState.teamScores[shooter.team]++;
        shooter.kills++;
        target.deaths = (target.deaths || 0) + 1;
        
        // Notify all players of kill
        io.emit('playerKilled', {
          killerId: socket.id,
          killerName: shooter.name,
          killerKills: shooter.kills,
          victimId: targetId,
          victimName: target.name,
          teamScores: gameState.teamScores
        });
        
        // Respawn target after delay
        setTimeout(() => {
          if (players.has(targetId)) {
            target.health = 100;
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
              position: target.position
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
    const leaderboard = Array.from(players.values())
      .filter(p => !p.isBot) // Only real players
      .sort((a, b) => b.kills - a.kills)
      .map(p => ({
        name: p.name,
        team: p.team,
        kills: p.kills,
        deaths: p.deaths || 0,
        playTime: Math.floor((now - (p.joinedAt || now)) / 1000) // Seconds played
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
