// Network Manager for multiplayer communication
export class NetworkManager {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.isConnected = false;
    this.remotePlayers = new Map(); // Store other players
    this.lastPositionSent = Date.now();
    this.positionUpdateInterval = 50; // Send position every 50ms
  }

  // Connect to server
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      // In playground environment, skip socket.io entirely
      if (serverUrl.includes('playground-gateway')) {
        console.log('Playground environment detected - running in single-player mode');
        reject(new Error('Playground mode - no server'));
        return;
      }
      
      // Load Socket.IO client
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
      
      script.onload = () => {
        try {
          this.socket = io(serverUrl, {
            timeout: 2000,
            reconnection: false, // Don't auto-reconnect if server not available
            transports: ['websocket', 'polling']
          });
          
          // Set a timeout for connection
          const connectionTimeout = setTimeout(() => {
            console.log('Server connection timeout - running in single-player mode');
            if (this.socket) {
              this.socket.close();
              this.socket = null;
            }
            this.isConnected = false;
            reject(new Error('Connection timeout'));
          }, 2000);
          
          this.socket.on('connect', () => {
            clearTimeout(connectionTimeout);
            console.log('Connected to server - multiplayer mode');
            this.isConnected = true;
            resolve();
          });

          this.socket.on('connect_error', (error) => {
            clearTimeout(connectionTimeout);
            console.log('Server not available - running in single-player mode');
            if (this.socket) {
              this.socket.close();
              this.socket = null;
            }
            this.isConnected = false;
            reject(error);
          });

          this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
          });
        } catch (error) {
          console.log('Failed to initialize socket - running in single-player mode');
          reject(error);
        }
      };
      
      script.onerror = () => {
        console.log('Failed to load Socket.IO - running in single-player mode');
        reject(new Error('Failed to load Socket.IO'));
      };
      
      document.head.appendChild(script);
    });
  }

  // Join game with name and team
  joinGame(name, team, difficulty) {
    return new Promise((resolve) => {
      this.socket.emit('join', { name, team, difficulty });
      
      this.socket.once('init', (data) => {
        this.playerId = data.playerId;
        resolve(data);
      });
    });
  }

  // Host sets difficulty for everyone
  setDifficulty(difficulty) {
    this.socket.emit('setDifficulty', difficulty);
  }

  // Send player position (throttled)
  sendPosition(position, rotation) {
    if (!this.isConnected || !this.socket) return;
    const now = Date.now();
    if (now - this.lastPositionSent >= this.positionUpdateInterval) {
      this.socket.emit('playerMove', {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: rotation
      });
      this.lastPositionSent = now;
    }
  }

  // Send shoot event
  sendShoot(position, direction, weaponType, color) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('shoot', {
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      weaponType: weaponType,
      color: color
    });
  }

  // Send hit notification
  sendHit(targetId, damage) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('playerHit', {
      targetId: targetId,
      damage: damage
    });
  }

  // Send wall placement
  sendWallPlaced(position, rotation) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('wallPlaced', {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: rotation
    });
  }

  // Send wall destroyed
  sendWallDestroyed(position) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('wallDestroyed', {
      position: { x: position.x, y: position.y, z: position.z }
    });
  }

  // Send chat message
  sendChatMessage(message) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('chatMessage', message);
  }

  // Listen for events
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }
}
