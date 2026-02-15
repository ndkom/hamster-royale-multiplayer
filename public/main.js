import * as THREE from 'three';
import { FirstPersonCameraController } from './rosie/controls/rosieControls.js';
import { createHamster, createWeapon } from './Hamster.js';
import { Enemy } from './Enemy.js';
import { WeaponSystem } from './WeaponSystem.js';
import { BuildSystem } from './BuildSystem.js';
import { generateEnvironment } from './Environment.js';
import { CONFIG } from './config.js';

// Global game state
let gameStarted = false;
let selectedDifficulty = null;
let isHost = false;
let selectedTeam = null;
let playerName = null;
let network = null;

// Remote players (other humans in multiplayer)
const remotePlayers = new Map(); // odid -> { mesh, data }

// Initialize network
import { NetworkManager } from './NetworkManager.js';

// Player joins game (picks name and team)
async function joinGame(name, team, difficulty = 'medium') {
  playerName = name;
  selectedTeam = team;
  
  // Save name to sessionStorage so we don't ask again on respawn
  sessionStorage.setItem('playerName', name);
  sessionStorage.setItem('playerTeam', team);
  sessionStorage.setItem('playerDifficulty', difficulty);
  
  // Hide login
  document.getElementById('login-screen').style.display = 'none';
  
  // Connect to server
  if (!network) {
    network = new NetworkManager();
    try {
      await network.connect(window.location.origin);
      
      // Join game immediately - replaces a bot
      const initData = await network.joinGame(name, team, difficulty);

      // Start game right away
      startGame(difficulty);

      // Setup multiplayer event listeners
      setupNetworkListeners();

      // Create existing players from server
      if (initData.players) {
        initData.players.forEach(p => {
          if (p.id !== network.playerId && !p.isBot) {
            createRemotePlayer(p);
          }
        });
      }

      showNotification(`Welcome ${name}! You replaced a bot on ${team} team.`);
      
    } catch (error) {
      console.log('Server not available - starting single-player mode');
      // Fall back to single player
      startGame(difficulty);
      showNotification(`Welcome ${name}! Playing in Single-Player Mode`);
    }
  }
}

// Show difficulty selection (host only)
function showDifficultySelection() {
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.display = 'flex';
  document.getElementById('player-name').style.display = 'none';
  document.querySelector('.team-btn').style.display = 'none';
  document.getElementById('join-red').parentElement.style.display = 'none';
  document.getElementById('waiting-message').style.display = 'none';
  document.getElementById('difficulty-selection').style.display = 'block';
  document.querySelector('h1').textContent = 'SELECT DIFFICULTY';
}

// Show waiting message (non-host players)
function showWaitingForHost() {
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.display = 'flex';
  document.getElementById('player-name').style.display = 'none';
  document.querySelector('.team-btn').style.display = 'none';
  document.getElementById('join-red').parentElement.style.display = 'none';
  document.getElementById('difficulty-selection').style.display = 'none';
  document.getElementById('waiting-message').style.display = 'block';
  document.querySelector('h1').textContent = 'WAITING FOR HOST';
}

// Start game with difficulty
function startGame(difficulty) {
  selectedDifficulty = difficulty;
  CONFIG.currentDifficulty = difficulty;
  
  // Set player's team
  playerState.team = selectedTeam;
  
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  gameStarted = true;
  
  // Request pointer lock immediately
  renderer.domElement.requestPointerLock();
  
  // Initialize game
  initGame();
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px 40px;
    border-radius: 10px;
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
    z-index: 10000;
    border: 2px solid #00ffff;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ========== KILL MILESTONE SYSTEM ==========

const KILL_MILESTONES = [
  { kills: 10, title: 'KILLER', color: '#ffaa00' },
  { kills: 25, title: 'SUPER KILLER', color: '#ff6600' },
  { kills: 50, title: 'ULTRA KILLER', color: '#ff0066' },
  { kills: 100, title: 'MEGA KILLER', color: '#ff00ff' },
  { kills: 200, title: 'LEGENDARY', color: '#00ffff' },
  { kills: 300, title: 'GODLIKE', color: '#00ff00' },
  { kills: 500, title: 'UNSTOPPABLE', color: '#ffffff' }
];

// Check if kills hit a milestone
function checkKillMilestone(playerName, kills) {
  for (const milestone of KILL_MILESTONES) {
    if (kills === milestone.kills) {
      showMilestoneAnnouncement(playerName, milestone.title, milestone.kills, milestone.color);
      return;
    }
  }
}

// Show BIG milestone announcement
function showMilestoneAnnouncement(playerName, title, kills, color) {
  const announcement = document.createElement('div');
  announcement.style.cssText = `
    position: fixed;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10001;
    pointer-events: none;
    animation: milestoneAnim 4s ease-out forwards;
  `;

  announcement.innerHTML = `
    <div style="
      font-family: 'Orbitron', sans-serif;
      font-size: 72px;
      font-weight: bold;
      color: ${color};
      text-shadow: 0 0 30px ${color}, 0 0 60px ${color}, 2px 2px 4px black;
      letter-spacing: 5px;
      animation: pulseGlow 0.5s ease-in-out infinite alternate;
    ">${title}</div>
    <div style="
      font-family: 'Orbitron', sans-serif;
      font-size: 36px;
      color: white;
      text-shadow: 0 0 20px ${color}, 2px 2px 4px black;
      margin-top: 10px;
    ">${playerName} - ${kills} KILLS!</div>
  `;

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes milestoneAnim {
      0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
      10% { opacity: 1; transform: translateX(-50%) scale(1.2); }
      20% { transform: translateX(-50%) scale(1); }
      80% { opacity: 1; }
      100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
    }
    @keyframes pulseGlow {
      from { text-shadow: 0 0 30px ${color}, 0 0 60px ${color}, 2px 2px 4px black; }
      to { text-shadow: 0 0 50px ${color}, 0 0 100px ${color}, 0 0 150px ${color}, 2px 2px 4px black; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(announcement);

  setTimeout(() => {
    announcement.remove();
    style.remove();
  }, 4000);
}

// ========== MULTIPLAYER FUNCTIONS ==========

// Create a remote player's hamster model
function createRemotePlayer(playerData) {
  if (remotePlayers.has(playerData.id)) return;

  const teamColor = playerData.team === 'red' ? CONFIG.teams.red.color : CONFIG.teams.blue.color;
  const mesh = createHamster(teamColor, playerData.skinType);
  mesh.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
  mesh.rotation.y = playerData.rotation || 0;
  scene.add(mesh);

  // Add name tag above player
  const nameTag = createNameTag(playerData.name, playerData.team);
  nameTag.position.y = 3.0;
  mesh.add(nameTag);

  // Add health bar above player
  const healthBar = createHealthBar();
  healthBar.position.y = 2.5;
  mesh.add(healthBar);

  remotePlayers.set(playerData.id, {
    mesh,
    data: playerData,
    nameTag,
    healthBar,
    health: 100,
    isDead: false,
    lastUpdate: Date.now()
  });
  console.log(`Remote player joined: ${playerData.name} (${playerData.team} team)`);
}

// Create health bar for remote player
function createHealthBar() {
  const group = new THREE.Group();

  // Background (dark red)
  const bgGeometry = new THREE.PlaneGeometry(1.5, 0.15);
  const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
  const bg = new THREE.Mesh(bgGeometry, bgMaterial);
  group.add(bg);

  // Health fill (green)
  const fillGeometry = new THREE.PlaneGeometry(1.5, 0.15);
  const fillMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  const fill = new THREE.Mesh(fillGeometry, fillMaterial);
  fill.position.z = 0.01;
  fill.name = 'healthFill';
  group.add(fill);

  return group;
}

// Update remote player health bar
function updateRemotePlayerHealth(playerId, health) {
  const remote = remotePlayers.get(playerId);
  if (remote && remote.healthBar) {
    remote.health = health;
    const fill = remote.healthBar.getObjectByName('healthFill');
    if (fill) {
      const percent = Math.max(0, health / 100);
      fill.scale.x = percent;
      fill.position.x = -(1 - percent) * 0.75;
      // Change color based on health
      if (health > 60) {
        fill.material.color.setHex(0x00ff00);
      } else if (health > 30) {
        fill.material.color.setHex(0xffaa00);
      } else {
        fill.material.color.setHex(0xff0000);
      }
    }
  }
}

// Mark remote player as dead
function setRemotePlayerDead(playerId, isDead) {
  const remote = remotePlayers.get(playerId);
  if (remote) {
    remote.isDead = isDead;
    // Make player semi-transparent when dead
    remote.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = isDead ? 0.3 : 1.0;
      }
    });
    // Hide/show health bar
    if (remote.healthBar) {
      remote.healthBar.visible = !isDead;
    }
  }
}

// Create floating name tag
function createNameTag(name, team) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = team === 'red' ? '#ff4444' : '#4444ff';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 42);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
}

// Update remote player position (set target for interpolation)
function updateRemotePlayer(playerId, position, rotation) {
  const remote = remotePlayers.get(playerId);
  if (remote) {
    // Store target position for smooth interpolation
    remote.targetPosition = { x: position.x, y: position.y, z: position.z };
    remote.targetRotation = rotation;
  }
}

// Interpolate all remote players for smooth movement
function interpolateRemotePlayers(deltaTime) {
  const lerpSpeed = 15; // Higher = faster catch-up
  remotePlayers.forEach((remote) => {
    if (remote.targetPosition) {
      // Smoothly interpolate position
      remote.mesh.position.x += (remote.targetPosition.x - remote.mesh.position.x) * lerpSpeed * deltaTime;
      remote.mesh.position.y += (remote.targetPosition.y - remote.mesh.position.y) * lerpSpeed * deltaTime;
      remote.mesh.position.z += (remote.targetPosition.z - remote.mesh.position.z) * lerpSpeed * deltaTime;
    }
    if (remote.targetRotation !== undefined) {
      // Smoothly interpolate rotation
      let rotDiff = remote.targetRotation - remote.mesh.rotation.y;
      // Handle wrap-around
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      remote.mesh.rotation.y += rotDiff * lerpSpeed * deltaTime;
    }
  });
}

// Remove remote player
function removeRemotePlayer(playerId) {
  const remote = remotePlayers.get(playerId);
  if (remote) {
    scene.remove(remote.mesh);
    remotePlayers.delete(playerId);
    console.log(`Remote player left: ${playerId}`);
  }
}

// Setup network event listeners
function setupNetworkListeners() {
  if (!network || !network.socket) return;

  // Another player joined
  network.on('playerJoined', (playerData) => {
    if (!playerData.isBot) {
      createRemotePlayer(playerData);
      showNotification(`${playerData.name} joined ${playerData.team} team!`);
    }
  });

  // Player moved
  network.on('playerMoved', (data) => {
    updateRemotePlayer(data.id, data.position, data.rotation);
  });

  // Player left
  network.on('playerLeft', (playerId) => {
    const remote = remotePlayers.get(playerId);
    if (remote) {
      showNotification(`${remote.data.name} left the game`);
      removeRemotePlayer(playerId);
    }
  });

  // Player shot (show their projectile)
  network.on('playerShot', (data) => {
    if (data.playerId !== network.playerId) {
      const pos = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
      const dir = new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z);
      createProjectile(pos, dir, data.color, false);
    }
  });

  // Player killed
  network.on('playerKilled', (data) => {
    showNotification(`${data.killerName} eliminated ${data.victimName}!`);
    teamScores.red = data.teamScores.red;
    teamScores.blue = data.teamScores.blue;

    // Update our own kills if we're the killer
    if (data.killerId === network.playerId) {
      playerState.kills = data.killerKills;
    }

    // Check for kill milestones (shows big announcement)
    checkKillMilestone(data.killerName, data.killerKills);

    updateUI();
  });

  // We took damage
  network.on('takeDamage', (data) => {
    playerState.health = Math.max(0, playerState.health - data.damage);
    updateUI();
    if (playerState.health <= 0) {
      playerState.deaths++;
      respawnPlayer();
    }
  });

  // We respawned
  network.on('respawn', (data) => {
    player.position.set(data.position.x, data.position.y, data.position.z);
    playerState.health = data.health;
    updateUI();
  });

  // Leaderboard data
  network.on('leaderboard', (data) => {
    updateLeaderboardFromServer(data);
  });

  // Wall created by another player
  network.on('wallCreated', (data) => {
    // Only create if we didn't place it (avoid duplicates)
    const pos = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
    buildSystem.createWallFromNetwork(pos, data.rotation);
  });

  // Wall destroyed
  network.on('wallRemoved', (data) => {
    buildSystem.removeWallAt(data.position);
  });

  // Player respawned (update their position)
  network.on('playerRespawned', (data) => {
    if (data.id !== network.playerId) {
      updateRemotePlayer(data.id, data.position, 0);
      setRemotePlayerDead(data.id, false);
      updateRemotePlayerHealth(data.id, data.health || 100);
    }
  });

  // Player died - show visual indicator
  network.on('playerDied', (data) => {
    if (data.id !== network.playerId) {
      setRemotePlayerDead(data.id, true);
      // Show floating "DEAD" text briefly
      showFloatingText(data.name + ' DEAD!', '#ff0000');
    }
  });

  // Health update for remote player (when they take damage)
  network.on('playerHealthUpdate', (data) => {
    if (data.id !== network.playerId) {
      updateRemotePlayerHealth(data.id, data.health);
    }
  });
}

// Show floating text notification
function showFloatingText(text, color) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Orbitron', sans-serif;
    font-size: 28px;
    font-weight: bold;
    color: ${color};
    text-shadow: 2px 2px 4px black;
    z-index: 10000;
    pointer-events: none;
    animation: floatUp 2s ease-out forwards;
  `;
  notification.textContent = text;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatUp {
      0% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 2000);
}

// Update leaderboard with server data
function updateLeaderboardFromServer(data) {
  const leaderboardBody = document.getElementById('leaderboard-body');
  document.getElementById('red-team-score').textContent = data.teamScores.red;
  document.getElementById('blue-team-score').textContent = data.teamScores.blue;

  leaderboardBody.innerHTML = data.players.map((p, index) => {
    const teamColor = p.team === 'red' ? '#ff4444' : '#4444ff';
    const teamEmoji = p.team === 'red' ? '🔴' : '🔵';
    const kd = p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2);
    const playTime = formatPlayTime(p.playTime || 0);
    const statusIcon = p.isDead ? '💀' : '✅';
    const playerKills = p.playerKills || 0;
    const botKills = p.botKills || 0;
    return `
      <tr style="border-bottom: 1px solid #333; ${p.isDead ? 'opacity: 0.5;' : ''}">
        <td style="padding: 10px; text-align: left;">#${index + 1}</td>
        <td style="padding: 10px; text-align: left; font-weight: bold;">${statusIcon} ${p.name}</td>
        <td style="padding: 10px; text-align: center; color: ${teamColor};">${teamEmoji}</td>
        <td style="padding: 10px; text-align: center;">
          <span style="color: #ff6666;" title="Player kills">${playerKills}P</span> /
          <span style="color: #888;" title="Bot kills">${botKills}B</span>
        </td>
        <td style="padding: 10px; text-align: center;">${p.deaths}</td>
        <td style="padding: 10px; text-align: center; color: #00ffff;">${kd}</td>
        <td style="padding: 10px; text-align: center; color: #ffaa00;">${playTime}</td>
      </tr>
    `;
  }).join('');
}

// Format seconds into mm:ss or hh:mm:ss
function formatPlayTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========== END MULTIPLAYER FUNCTIONS ==========

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 30);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -80;
directionalLight.shadow.camera.right = 80;
directionalLight.shadow.camera.top = 80;
directionalLight.shadow.camera.bottom = -80;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground with team-colored zones
const groundSize = CONFIG.arena.size;

// Center ground (neutral)
const centerGeometry = new THREE.PlaneGeometry(groundSize, groundSize / 2);
const centerMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x90ee90,
  roughness: 0.8,
  metalness: 0.2
});
const centerGround = new THREE.Mesh(centerGeometry, centerMaterial);
centerGround.rotation.x = -Math.PI / 2;
centerGround.position.z = 0;
centerGround.receiveShadow = true;
scene.add(centerGround);

// Red team zone (back half)
const redZoneGeometry = new THREE.PlaneGeometry(groundSize, groundSize / 4);
const redZoneMaterial = new THREE.MeshStandardMaterial({ 
  color: 0xff6666,
  roughness: 0.7,
  metalness: 0.3,
  emissive: 0x440000,
  emissiveIntensity: 0.2
});
const redZone = new THREE.Mesh(redZoneGeometry, redZoneMaterial);
redZone.rotation.x = -Math.PI / 2;
redZone.position.z = groundSize / 4 + groundSize / 8;
redZone.receiveShadow = true;
scene.add(redZone);

// Blue team zone (front half)
const blueZoneGeometry = new THREE.PlaneGeometry(groundSize, groundSize / 4);
const blueZoneMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x6666ff,
  roughness: 0.7,
  metalness: 0.3,
  emissive: 0x000044,
  emissiveIntensity: 0.2
});
const blueZone = new THREE.Mesh(blueZoneGeometry, blueZoneMaterial);
blueZone.rotation.x = -Math.PI / 2;
blueZone.position.z = -(groundSize / 4 + groundSize / 8);
blueZone.receiveShadow = true;
scene.add(blueZone);

// Add some arena walls for boundaries
const wallMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x8B4513,
  roughness: 0.9 
});
const arenaSize = CONFIG.arena.size / 2;

function createBoundaryWall(width, height, depth, x, y, z) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(geometry, wallMaterial);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  return wall;
}

// Create boundary walls
createBoundaryWall(CONFIG.arena.size + 4, 5, 2, 0, 2.5, -arenaSize - 1);
createBoundaryWall(CONFIG.arena.size + 4, 5, 2, 0, 2.5, arenaSize + 1);
createBoundaryWall(2, 5, CONFIG.arena.size, -arenaSize - 1, 2.5, 0);
createBoundaryWall(2, 5, CONFIG.arena.size, arenaSize + 1, 2.5, 0);

// Player setup
const player = createHamster(0xffaa88);
player.position.y = CONFIG.player.groundLevel;
scene.add(player);

// Player state
const playerState = {
  health: CONFIG.player.maxHealth,
  maxHealth: CONFIG.player.maxHealth,
  kills: 0,
  deaths: 0,
  team: 'red', // Will be set when joining
  lastWallPlaceTime: 0
};

// Team scores
const teamScores = {
  red: 0,
  blue: 0
};

// Camera controller
const cameraController = new FirstPersonCameraController(
  camera,
  player,
  renderer.domElement,
  {
    eyeHeight: CONFIG.player.eyeHeight,
    mouseSensitivity: 0.002
  }
);
cameraController.enable();

// Weapon system
const weaponSystem = new WeaponSystem();

// Build system
const buildSystem = new BuildSystem(scene);

// Environment obstacles
const obstacles = generateEnvironment(scene, CONFIG.arena.size);

// Weapon model in view
let currentWeaponModel = createWeapon(weaponSystem.getCurrentWeapon());
currentWeaponModel.position.set(0.3, -0.2, -0.5);
camera.add(currentWeaponModel);
scene.add(camera);

// Enemies
const enemies = [];

function spawnEnemy(team) {
  const difficulty = CONFIG.difficulty[CONFIG.currentDifficulty];
  const maxEnemies = difficulty.enemiesPerTeam;
  
  // Count current enemies in this team
  const teamEnemies = enemies.filter(e => e.team === team);
  if (teamEnemies.length >= maxEnemies) return;

  const angle = Math.random() * Math.PI * 2;
  const distance = CONFIG.enemy.minSpawnDistance + Math.random() * (CONFIG.enemy.spawnRadius - CONFIG.enemy.minSpawnDistance);
  const position = new THREE.Vector3(
    player.position.x + Math.cos(angle) * distance,
    CONFIG.player.groundLevel,
    player.position.z + Math.sin(angle) * distance
  );

  // Keep within arena bounds
  position.x = Math.max(-arenaSize + 5, Math.min(arenaSize - 5, position.x));
  position.z = Math.max(-arenaSize + 5, Math.min(arenaSize - 5, position.z));

  enemies.push(new Enemy(scene, position, team, difficulty));
}

function initGame() {
  // Spawn initial enemies for both teams
  const difficulty = CONFIG.difficulty[CONFIG.currentDifficulty];
  
  // Player's team (red)
  for (let i = 0; i < difficulty.enemiesPerTeam - 1; i++) {
    spawnEnemy('red');
  }
  
  // Enemy team (blue)
  for (let i = 0; i < difficulty.enemiesPerTeam; i++) {
    spawnEnemy('blue');
  }
  
  updateUI();
}

// Projectiles
const projectiles = [];

function createProjectile(position, direction, color, isEnemy = false, damage = 10, team = null) {
  const geometry = new THREE.SphereGeometry(0.1, 8, 8);
  const material = new THREE.MeshBasicMaterial({ 
    color: color,
    emissive: color,
    emissiveIntensity: 1
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  scene.add(mesh);

  projectiles.push({
    mesh,
    velocity: direction.multiplyScalar(100),
    lifetime: 2,
    isEnemy,
    damage,
    team
  });
}

// Input handling
const keys = {};
let mouseDown = false;

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  // Weapon toggle
  if (e.code === 'KeyQ') {
    weaponSystem.toggleWeapon();
    updateWeaponModel();
  }

  // Reload
  if (e.code === 'KeyR') {
    weaponSystem.reload();
  }

  // Place wall (always available with cooldown)
  if (e.code === 'KeyE') {
    const now = Date.now();
    if (now - playerState.lastWallPlaceTime >= CONFIG.build.buildCooldown) {
      if (buildSystem.placeWall(player.position, cameraController.rotationY)) {
        playerState.lastWallPlaceTime = now;
        // Sync wall to network
        if (network && network.isConnected) {
          const walls = buildSystem.getWalls();
          const lastWall = walls[walls.length - 1];
          network.sendWallPlaced(lastWall.position, lastWall.mesh.rotation.y);
        }
      }
    }
  }

  // Toggle leaderboard with TAB
  if (e.code === 'Tab' && gameStarted) {
    e.preventDefault();
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard.style.display === 'none') {
      // Request leaderboard from server in multiplayer
      if (network && network.isConnected && network.socket) {
        network.socket.emit('requestLeaderboard');
      } else {
        updateLeaderboard();
      }
      leaderboard.style.display = 'block';
    } else {
      leaderboard.style.display = 'none';
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    mouseDown = true;
  }
});

document.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    mouseDown = false;
  }
});

function updateWeaponModel() {
  camera.remove(currentWeaponModel);
  currentWeaponModel = createWeapon(weaponSystem.getCurrentWeapon());
  currentWeaponModel.position.set(0.3, -0.2, -0.5);
  camera.add(currentWeaponModel);
}

// UI updates
function updateUI() {
  if (!gameStarted) return;
  
  document.getElementById('health-fill').style.width = 
    (playerState.health / playerState.maxHealth * 100) + '%';
  
  const weaponName = weaponSystem.getWeaponName();
  document.getElementById('weapon-info').textContent = weaponName;
  
  const ammo = weaponSystem.getAmmo();
  const maxAmmo = weaponSystem.getMaxAmmo();
  
  if (weaponName === 'Bonk Stick') {
    document.getElementById('ammo-info').textContent = 'Melee Weapon';
  } else {
    document.getElementById('ammo-info').textContent = 
      weaponSystem.isReloading ? 'Reloading...' : `Ammo: ${ammo} / ${maxAmmo}`;
  }
  
  document.getElementById('score').textContent = `Your Kills: ${playerState.kills}`;
  
  // Update team scores
  document.querySelector('.red-team').textContent = `Red Team: ${teamScores.red}`;
  document.querySelector('.blue-team').textContent = `Blue Team: ${teamScores.blue}`;
}

function showHitMarker() {
  const marker = document.createElement('div');
  marker.className = 'hit-marker';
  marker.textContent = 'X';
  document.getElementById('ui').appendChild(marker);
  setTimeout(() => marker.remove(), 300);
}

// Respawn player
function respawnPlayer() {
  showNotification('You died! Respawning...');
  
  // Reset health
  playerState.health = playerState.maxHealth;
  
  // Respawn at random location in player's team zone
  const arenaSize = CONFIG.arena.size / 2;
  const spawnZ = playerState.team === 'red' ? 
    arenaSize * 0.5 + Math.random() * 20 - 10 : // Red team back area
    -(arenaSize * 0.5 + Math.random() * 20 - 10); // Blue team front area
  
  player.position.set(
    Math.random() * 40 - 20,
    CONFIG.player.groundLevel,
    spawnZ
  );
  
  // Reload weapon
  weaponSystem.reload();
  
  updateUI();
  
  setTimeout(() => {
    showNotification('Back in action!');
  }, 1000);
}

// Update leaderboard display
function updateLeaderboard() {
  const leaderboardBody = document.getElementById('leaderboard-body');
  
  // Update team scores
  document.getElementById('red-team-score').textContent = teamScores.red;
  document.getElementById('blue-team-score').textContent = teamScores.blue;
  
  // In single-player mode, just show the player
  const players = [{
    name: playerName,
    team: playerState.team,
    kills: playerState.kills,
    deaths: playerState.deaths,
    kd: playerState.deaths > 0 ? (playerState.kills / playerState.deaths).toFixed(2) : playerState.kills.toFixed(2)
  }];
  
  // Sort by kills (descending)
  players.sort((a, b) => b.kills - a.kills);
  
  // Build table rows
  leaderboardBody.innerHTML = players.map((player, index) => {
    const teamColor = player.team === 'red' ? '#ff4444' : '#4444ff';
    const teamEmoji = player.team === 'red' ? '🔴' : '🔵';
    return `
      <tr style="border-bottom: 1px solid #333;">
        <td style="padding: 10px; text-align: left;">#${index + 1}</td>
        <td style="padding: 10px; text-align: left; font-weight: bold;">${player.name}</td>
        <td style="padding: 10px; text-align: center; color: ${teamColor};">${teamEmoji}</td>
        <td style="padding: 10px; text-align: center;">${player.kills}</td>
        <td style="padding: 10px; text-align: center;">${player.deaths}</td>
        <td style="padding: 10px; text-align: center; color: #00ffff;">${player.kd}</td>
      </tr>
    `;
  }).join('');
}

// Raycasting for shooting
const raycaster = new THREE.Raycaster();

function shoot() {
  if (!weaponSystem.canShoot()) return;

  const weapon = weaponSystem.getCurrentWeapon();
  const shots = weaponSystem.shoot();
  if (!shots) return;

  // Weapon recoil animation
  currentWeaponModel.position.z = -0.6;
  setTimeout(() => {
    currentWeaponModel.position.z = -0.5;
  }, 50);

  // Melee attack
  if (weapon.type === 'melee') {
    // Swing animation
    currentWeaponModel.rotation.z = -0.5;
    setTimeout(() => {
      currentWeaponModel.rotation.z = 0;
    }, 200);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    raycaster.set(camera.position, direction);
    
    // Check for hits in melee range
    const targets = enemies.map(e => e.mesh);
    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // Check if within melee range
      if (hit.distance <= weapon.range) {
        for (const enemy of enemies) {
          if (enemy.mesh === hit.object || enemy.mesh.children.includes(hit.object)) {
            if (enemy.team !== playerState.team) {
              const killed = enemy.takeDamage(weapon.damage);
              showHitMarker();
              
              if (killed) {
                const enemyTeam = enemy.team;
                enemies.splice(enemies.indexOf(enemy), 1);
                enemy.destroy();
                playerState.kills++;
                teamScores.red++;
                checkKillMilestone(playerName || 'You', playerState.kills);

                setTimeout(() => spawnEnemy(enemyTeam), 2000);
              }
            }
            break;
          }
        }
      }
    }
  } else {
    // Ranged attack
    shots.forEach(shot => {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      // Add spread
      direction.x += (Math.random() - 0.5) * shot.spread;
      direction.y += (Math.random() - 0.5) * shot.spread;
      direction.normalize();

      // Send shot to network
      if (network && network.isConnected) {
        network.sendShoot(camera.position, direction, weapon.name, shot.color);
      }

      raycaster.set(camera.position, direction);

      // Check for hits - include remote players
      const targets = enemies.map(e => e.mesh);
      const remotePlayerMeshes = Array.from(remotePlayers.values()).map(r => r.mesh);
      const walls = buildSystem.getWalls().map(w => w.mesh);
      const obstacleMeshes = obstacles.map(o => o.mesh);
      const intersects = raycaster.intersectObjects([...targets, ...remotePlayerMeshes, ...walls, ...obstacleMeshes], true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        
        // Check if hit an enemy
        for (const enemy of enemies) {
          if (enemy.mesh === hit.object || enemy.mesh.children.includes(hit.object)) {
            // Only damage enemies from opposite team
            if (enemy.team !== playerState.team) {
              const killed = enemy.takeDamage(shot.damage);
              showHitMarker();
              
              if (killed) {
                const enemyTeam = enemy.team;
                enemies.splice(enemies.indexOf(enemy), 1);
                enemy.destroy();
                playerState.kills++;
                teamScores.red++; // Player's team score
                checkKillMilestone(playerName || 'You', playerState.kills);

                // Spawn new enemy for the killed team
                setTimeout(() => spawnEnemy(enemyTeam), 2000);
              }
            }
            break;
          }
        }

        // Check if hit a remote player (other human)
        for (const [playerId, remote] of remotePlayers) {
          if (remote.mesh === hit.object || remote.mesh.children.some(child => child === hit.object || (child.children && child.children.includes(hit.object)))) {
            // Only damage players from opposite team
            if (remote.data.team !== playerState.team) {
              showHitMarker();
              // Send hit to server
              if (network && network.isConnected) {
                network.sendHit(playerId, shot.damage);
              }
            }
            break;
          }
        }

        // Check if hit a wall
        for (const wall of buildSystem.getWalls()) {
          if (wall.mesh === hit.object) {
            buildSystem.damageWall(wall, shot.damage);
            break;
          }
        }

        // Obstacles block shots but don't take damage (trees/rocks)
      }

      // Create visual projectile
      createProjectile(camera.position.clone(), direction.clone(), shot.color, false);
    });
  }

  updateUI();
}

// Player movement
function updatePlayer(deltaTime) {
  const moveSpeed = CONFIG.player.moveSpeed;
  const direction = new THREE.Vector3();

  if (keys['KeyW']) direction.z -= 1;
  if (keys['KeyS']) direction.z += 1;
  if (keys['KeyA']) direction.x -= 1;
  if (keys['KeyD']) direction.x += 1;

  if (direction.length() > 0) {
    direction.normalize();
    direction.applyQuaternion(camera.quaternion);
    direction.y = 0;
    direction.normalize();

    const nextPosition = player.position.clone().add(
      direction.multiplyScalar(moveSpeed * deltaTime)
    );

    // Check boundaries
    nextPosition.x = Math.max(-arenaSize + 2, Math.min(arenaSize - 2, nextPosition.x));
    nextPosition.z = Math.max(-arenaSize + 2, Math.min(arenaSize - 2, nextPosition.z));

    // Check wall collisions
    let blocked = false;
    for (const wall of buildSystem.getWalls()) {
      const distance = Math.sqrt(
        Math.pow(nextPosition.x - wall.position.x, 2) +
        Math.pow(nextPosition.z - wall.position.z, 2)
      );
      if (distance < 2) {
        blocked = true;
        break;
      }
    }

    // Check obstacle collisions (trees and rocks)
    if (!blocked) {
      for (const obstacle of obstacles) {
        const distance = Math.sqrt(
          Math.pow(nextPosition.x - obstacle.position.x, 2) +
          Math.pow(nextPosition.z - obstacle.position.z, 2)
        );
        if (distance < obstacle.radius + 1) {
          blocked = true;
          break;
        }
      }
    }

    if (!blocked) {
      player.position.copy(nextPosition);
    }
  }

  // Send position to server for multiplayer
  if (network && network.isConnected) {
    network.sendPosition(player.position, cameraController.rotationY);
  }
}

// Game loop
let lastTime = performance.now();
let spawnTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  // Only update game if started
  if (!gameStarted) {
    renderer.render(scene, camera);
    return;
  }

  // Update player movement
  updatePlayer(deltaTime);

  // Update camera
  cameraController.update();

  // Smooth interpolation for remote players
  interpolateRemotePlayers(deltaTime);

  // Update build system preview (always show if near placement area)
  const now = Date.now();
  const canPlace = now - playerState.lastWallPlaceTime >= CONFIG.build.buildCooldown;
  buildSystem.updatePreview(player.position, cameraController.rotationY, canPlace);

  // Handle shooting/attacking
  if (mouseDown) {
    const weapon = weaponSystem.getCurrentWeapon();
    if (weapon.automatic || weaponSystem.canShoot()) {
      shoot();
    }
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const result = enemy.update(deltaTime, player.position, buildSystem.getWalls(), enemies, obstacles, playerState.team);

    if (!result) continue;

    const { distance, target } = result;
    const difficulty = CONFIG.difficulty[CONFIG.currentDifficulty];

    // Enemy shooting
    if (target && distance < difficulty.enemyShootRange && enemy.canShoot()) {
      const shot = enemy.shoot(target);
      const shotColor = enemy.team === 'red' ? 0xff6666 : 0x6666ff;
      createProjectile(shot.position, shot.direction, shotColor, true, shot.damage, enemy.team);
    }
  }

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.mesh.position.add(proj.velocity.clone().multiplyScalar(deltaTime));
    proj.lifetime -= deltaTime;

    // Check collision with player
    if (proj.isEnemy && proj.team !== playerState.team) {
      const distToPlayer = proj.mesh.position.distanceTo(player.position);
      if (distToPlayer < 1) {
        playerState.health = Math.max(0, playerState.health - proj.damage);
        updateUI();
        
        scene.remove(proj.mesh);
        projectiles.splice(i, 1);
        
        if (playerState.health <= 0) {
          playerState.deaths++;
          respawnPlayer();
        }
        continue;
      }
    }

    // Check collision with enemies
    if (proj.isEnemy) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        // Projectile hits enemies from opposite team
        if (proj.team !== enemy.team) {
          const distToEnemy = proj.mesh.position.distanceTo(enemy.mesh.position);
          if (distToEnemy < 1) {
            const killed = enemy.takeDamage(proj.damage);
            
            if (killed) {
              const enemyTeam = enemy.team;
              enemies.splice(j, 1);
              enemy.destroy();
              
              // Update team score based on who got killed
              if (enemyTeam === 'red') {
                teamScores.blue++;
              } else {
                teamScores.red++;
              }
              
              // Spawn replacement
              setTimeout(() => spawnEnemy(enemyTeam), 2000);
            }
            
            scene.remove(proj.mesh);
            projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // Remove old projectiles
    if (proj.lifetime <= 0) {
      scene.remove(proj.mesh);
      projectiles.splice(i, 1);
    }
  }

  // Spawn timer - respawn fallen teammates and enemies
  if (gameStarted) {
    spawnTimer += deltaTime;
    const difficulty = CONFIG.difficulty[CONFIG.currentDifficulty];
    
    if (spawnTimer > difficulty.spawnInterval) {
      spawnTimer = 0;
      
      // Try to spawn for both teams if needed
      spawnEnemy('red');
      spawnEnemy('blue');
    }
  }

  updateUI();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Get selected difficulty
function getSelectedDifficulty() {
  // Check which difficulty button was clicked
  return selectedDifficulty || 'medium';
}

// Setup team selection buttons
document.getElementById('join-red').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name) {
    alert('Please enter your name!');
    return;
  }
  const difficulty = getSelectedDifficulty();
  joinGame(name, 'red', difficulty);
});

document.getElementById('join-blue').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name) {
    alert('Please enter your name!');
    return;
  }
  const difficulty = getSelectedDifficulty();
  joinGame(name, 'blue', difficulty);
});

// Setup difficulty button listeners - just set preference
document.getElementById('btn-easy').addEventListener('click', () => {
  selectedDifficulty = 'easy';
  // Visual feedback
  document.querySelectorAll('.difficulty-btn-small').forEach(btn => btn.style.opacity = '0.5');
  document.getElementById('btn-easy').style.opacity = '1';
});

document.getElementById('btn-medium').addEventListener('click', () => {
  selectedDifficulty = 'medium';
  document.querySelectorAll('.difficulty-btn-small').forEach(btn => btn.style.opacity = '0.5');
  document.getElementById('btn-medium').style.opacity = '1';
});

document.getElementById('btn-hard').addEventListener('click', () => {
  selectedDifficulty = 'hard';
  document.querySelectorAll('.difficulty-btn-small').forEach(btn => btn.style.opacity = '0.5');
  document.getElementById('btn-hard').style.opacity = '1';
});

// Set default selection
document.getElementById('btn-medium').click();

// Allow Enter key to join
document.getElementById('player-name').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const name = e.target.value.trim();
    if (name) {
      const difficulty = getSelectedDifficulty();
      joinGame(name, 'red', difficulty);
    }
  }
});

// Check for saved session and auto-login
window.addEventListener('load', () => {
  const savedName = sessionStorage.getItem('playerName');
  const savedTeam = sessionStorage.getItem('playerTeam');
  const savedDifficulty = sessionStorage.getItem('playerDifficulty');
  
  if (savedName && savedTeam && savedDifficulty) {
    // Auto-fill the name input
    document.getElementById('player-name').value = savedName;
    
    // Auto-select the difficulty
    selectedDifficulty = savedDifficulty;
    document.querySelectorAll('.difficulty-btn-small').forEach(btn => btn.style.opacity = '0.5');
    document.getElementById(`btn-${savedDifficulty}`).style.opacity = '1';
  }
});

// Start game
animate();
