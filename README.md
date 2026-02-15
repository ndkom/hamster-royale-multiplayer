# 🐹 Hamsters FFA - Multiplayer Battle Arena

A real-time multiplayer FPS game where hamsters fight in team-based combat!

## 🎮 Features

- ✅ **Real-time Multiplayer** - Play with friends online
- ✅ **Team-Based Combat** - Red vs Blue teams
- ✅ **Host System** - First player picks difficulty for everyone
- ✅ **Multiple Weapons** - Ranged blaster & melee bonk stick
- ✅ **Building System** - Place defensive walls
- ✅ **5 Hamster Skins** - Unique realistic hamster variations
- ✅ **Environmental Cover** - Trees and rocks for tactical gameplay
- ✅ **Team Zones** - Color-coded territories
- ✅ **Difficulty Settings** - Easy, Medium, Hard (host chooses)

## 🚀 Quick Start (2 Options)

### Option 1: Deploy to Glitch (Recommended - Free & Easy)

**Perfect for: Playing with friends immediately**

1. **Create Glitch Account**: Go to [glitch.com](https://glitch.com)

2. **Create New Project**: Click "New Project" → "glitch-hello-node"

3. **Setup Folder Structure**:
   ```
   your-project/
   ├── public/              ← Create this folder
   │   ├── index.html
   │   ├── main.js
   │   ├── config.js
   │   ├── Hamster.js
   │   ├── Enemy.js
   │   ├── WeaponSystem.js
   │   ├── BuildSystem.js
   │   ├── Environment.js
   │   ├── NetworkManager.js
   │   └── rosie/
   │       └── controls/
   │           ├── rosieControls.js
   │           └── rosieMobileControls.js
   ├── server.js            ← Root level
   └── package.json         ← Root level
   ```

4. **Upload Files**:
   - Delete default Glitch files
   - Create `public` folder
   - Move ALL game files into `public/`
   - Keep `server.js` and `package.json` in root

5. **That's It!** 
   - Glitch auto-installs and runs
   - Your URL: `https://your-project.glitch.me`
   - Share with friends!

### Option 2: Run Locally (Testing)

**Perfect for: Development and testing**

```bash
# Install Node.js first: https://nodejs.org

# Install dependencies
npm install

# Start server
npm start

# Open browser
http://localhost:3000
```

## 📁 File Structure Explained

```
Hamsters-FFA/
├── 🌐 CLIENT (public/ folder)
│   ├── index.html          - Main HTML & UI
│   ├── main.js             - Game logic & rendering
│   ├── config.js           - Game configuration
│   ├── Hamster.js          - 3D hamster models
│   ├── Enemy.js            - AI enemies
│   ├── WeaponSystem.js     - Weapon mechanics
│   ├── BuildSystem.js      - Wall building
│   ├── Environment.js      - Trees & rocks
│   ├── NetworkManager.js   - Multiplayer sync
│   └── rosie/              - Controls library
│       └── controls/
│           ├── rosieControls.js
│           └── rosieMobileControls.js
│
├── 🖥️ SERVER (root level)
│   ├── server.js           - Node.js multiplayer server
│   └── package.json        - Dependencies
│
└── 📖 DOCUMENTATION
    ├── README.md           - This file
    └── DEPLOYMENT.md       - Detailed deployment guide
```

## 🎯 How to Play

### Controls
- **WASD** - Move around
- **Mouse** - Look/aim
- **Click** - Shoot/attack
- **Q** - Switch weapon (Blaster ↔ Bonk Stick)
- **E** - Place wall (2 second cooldown)
- **R** - Reload

### Gameplay
1. **First Player (Host)**: Enter name → Pick team → Select difficulty for everyone
2. **Other Players**: Enter name → Pick team → Wait for host to start game
3. Fight enemies, help teammates!
4. If host leaves, next player becomes new host

### Weapons
- **Blaster** (Ranged): 30 ammo, medium damage, long range
- **Bonk Stick** (Melee): Infinite use, high damage, close range

## 🔧 Configuration

### Change Server Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change port here
```

### Adjust Game Settings
Edit `config.js`:
```javascript
arena: {
  size: 200 // Arena size
},
difficulty: {
  easy: { enemyHealth: 40, ... },
  medium: { enemyHealth: 60, ... },
  hard: { enemyHealth: 80, ... }
}
```

### Network Settings
Edit `NetworkManager.js`:
```javascript
this.positionUpdateInterval = 50; // Lower = more updates (smoother but more bandwidth)
```

## 🌐 Hosting Options

### Free Hosting
- **Glitch** ⭐ Recommended
  - Free 512MB RAM
  - Sleeps after 5min inactivity
  - Wakes on visit
  - Perfect for casual play

- **Render**
  - Free 512MB RAM
  - Sleeps after 15min inactivity
  - Good for testing

### Paid Hosting (For serious use)
- **Railway** - $5/month
- **DigitalOcean** - $6/month droplet
- **Heroku** - $7/month
- **AWS/GCP** - Variable pricing

## 🐛 Troubleshooting

### "Cannot connect to server"
```javascript
// Check server is running
npm start

// Verify URL in browser
http://localhost:3000

// Check firewall settings
```

### "Players not syncing"
- Open browser console (F12)
- Look for WebSocket errors
- Check server logs for errors
- Verify both players on same server

### "Game is laggy"
- Check internet connection
- Try paid hosting (more resources)
- Reduce player count
- Lower update frequency

## 📊 Performance

### Glitch Free Tier Can Handle:
- ✅ 5-8 simultaneous players
- ✅ 60 FPS client-side
- ✅ 20 updates/second sync

### For 15+ Players:
- Use paid hosting ($5-10/month)
- Increase server resources
- Consider dedicated server

## 🔐 Security Notes

### Current Setup:
- ✅ Socket.IO built-in security
- ✅ CORS configured
- ⚠️ No authentication (anyone can join)
- ⚠️ No cheat prevention

### For Production:
Consider adding:
- Player authentication
- Rate limiting
- Server-side validation
- Admin controls

## 📝 Development

### Local Development
```bash
# Install
npm install

# Run with auto-restart
npm run dev

# Run normally
npm start
```

### Testing Multiplayer Locally
1. Start server: `npm start`
2. Open `http://localhost:3000` in multiple browser windows
3. Join different teams
4. Test features!

## 🎨 Customization Ideas

### Easy Changes:
- Modify hamster colors in `Hamster.js`
- Change arena size in `config.js`
- Adjust weapon stats in `config.js`
- Add more obstacles in `Environment.js`

### Advanced:
- Add new weapon types
- Create power-ups
- Add voice chat
- Implement matchmaking
- Add game modes (CTF, King of the Hill)

## 📞 Support

### Check These First:
1. Server logs (`npm start` output)
2. Browser console (F12 → Console)
3. Network tab (F12 → Network → WS)
4. DEPLOYMENT.md for detailed guides

### Common Issues:
- Port already in use: Change PORT in server.js
- Module not found: Run `npm install`
- Can't connect: Check SERVER_URL matches your deployment

## 🎉 You're Ready!

1. ✅ Deploy to Glitch
2. ✅ Share link with friends  
3. ✅ Pick teams and play!

**Have fun battling! 🐹⚔️**

---

## 📄 License

MIT License - Free to use and modify!

## 🙏 Credits

Built with:
- Three.js (3D graphics)
- Socket.IO (multiplayer)
- Express (web server)
- Node.js (runtime)

---

**Questions? Check DEPLOYMENT.md for step-by-step guides!**
