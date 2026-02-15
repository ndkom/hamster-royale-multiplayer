# 🎮 Hamsters FFA - Multiplayer Deployment Guide

## 📦 Current File Structure (Ready for Glitch!)

```
hamster-royale-multiplayer/
├── server.js           ← Server code (root level)
├── package.json        ← Dependencies (root level)
├── package-lock.json
└── public/             ← All client files
    ├── index.html
    ├── main.js
    ├── config.js
    ├── Hamster.js
    ├── Enemy.js
    ├── WeaponSystem.js
    ├── BuildSystem.js
    ├── Environment.js
    ├── NetworkManager.js
    └── rosie/
        └── controls/
            ├── rosieControls.js
            └── rosieMobileControls.js
```

## 🚀 Deploy to Glitch (5 minutes, FREE!)

### Step 1: Go to Glitch
1. Open **https://glitch.com** in your browser
2. Sign up or log in (free account)

### Step 2: Create New Project
1. Click **"New Project"** button (top right)
2. Choose **"glitch-hello-node"** (or any Node.js template)
3. Wait for project to load

### Step 3: Clear Default Files
1. In Glitch's file tree (left sidebar):
   - Click on `server.js` → Delete it
   - Click on `public/` folder → Delete everything inside
   - Delete any other default files except `.env`

### Step 4: Upload Your Files
**Option A - Drag & Drop (Easiest):**
1. Click "Assets" in Glitch sidebar, then close it
2. Open your local `hamster-royale-multiplayer` folder
3. Drag `server.js` and `package.json` to Glitch's file area
4. Create `public` folder in Glitch if needed
5. Drag all files from your local `public/` folder into Glitch's `public/`
6. Create `public/rosie/controls/` and upload those files too

**Option B - Import from GitHub:**
1. Push your files to a GitHub repo first
2. In Glitch: Tools → Import/Export → Import from GitHub
3. Paste your repo URL

### Step 5: Verify & Launch
1. Check that Glitch shows the correct file structure
2. Click "Logs" at bottom to see server starting
3. Look for: `🎮 Hamsters FFA Server running on port 3000`
4. Your game is now live!

### Step 6: Get Your URL & Play!
1. Click **"Share"** button (top left)
2. Copy the **"Live site"** URL
3. It looks like: `https://your-project-name.glitch.me`
4. Open in 2 browser tabs to test multiplayer
5. Share with friends!

### Glitch Tips:
- ✅ Free hosting, no credit card
- ✅ Auto-installs dependencies
- ✅ Auto-restarts on file changes
- ✅ Can edit code directly in browser
- ⚠️ Sleeps after 5 min of inactivity (wakes up ~30 sec when visited)

---

## 🐳 Deploy with Docker (Advanced)

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Step 2: Build & Run
```bash
docker build -t hamsters-ffa .
docker run -p 3000:3000 hamsters-ffa
```

### Step 3: Deploy to Any Cloud
- **Render.com**: Connect GitHub repo, auto-deploys
- **Railway.app**: One-click deployment
- **DigitalOcean**: Deploy Docker container
- **AWS/GCP**: Use container services

---

## 🖥️ Deploy to Render.com (Free Tier)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Hamsters FFA multiplayer"
git push origin main
```

### Step 2: Connect to Render
1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Set:
   - **Name**: hamsters-ffa
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### Step 3: Deploy
- Render auto-builds and deploys
- Your URL: `https://hamsters-ffa.onrender.com`

---

## 💻 Run Locally (Testing)

### Step 1: Install Node.js
Download from: https://nodejs.org (LTS version)

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Server
```bash
npm start
```

### Step 4: Open Game
Visit: `http://localhost:3000`

---

## 🔧 Configuration Options

### Change Server Port
In `server.js`, modify:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your port
```

### Update Server URL in Client
In `main.js`:
```javascript
const SERVER_URL = 'https://your-server.com'; // Your deployed URL
```

For local testing:
```javascript
const SERVER_URL = 'http://localhost:3000';
```

---

## 📊 Server Requirements

**Minimum:**
- 256MB RAM
- Node.js 14+
- 1 CPU core

**For 10-20 players:**
- 512MB RAM
- Node.js 18+
- 2 CPU cores

**Free tiers that work:**
- ✅ Glitch (512MB, sleeps after inactivity)
- ✅ Render (512MB, sleeps after 15min)
- ✅ Railway ($5 credit/month, then paid)

---

## 🎮 How Multiplayer Works

1. **Player joins**: Enters name, picks team
2. **Server assigns ID**: Creates player state
3. **Position sync**: Every 50ms, positions broadcast
4. **Actions sync**: Shooting, building walls
5. **Score tracking**: Server keeps authoritative game state
6. **Player leaves**: Server cleans up, notifies others

---

## 🐛 Troubleshooting

**"Cannot connect to server"**
- Check server is running: `npm start`
- Verify SERVER_URL matches your deployed URL
- Check firewall/port settings

**"Players not seeing each other"**
- Check browser console for errors
- Verify WebSocket connection (not blocked)
- Test on different network

**"Game is laggy"**
- Server might be overloaded
- Try reducing `positionUpdateInterval` in NetworkManager.js
- Use a paid hosting tier

---

## 📝 Next Steps After Deployment

1. ✅ Deploy server to Glitch/Render
2. ✅ Get your public URL
3. ✅ Share link with friends
4. ✅ Test with 2-3 players first
5. ✅ Monitor server logs for issues

**Need help?** The server logs will show all connections and errors!

---

## 🎯 Quick Checklist

- [ ] Node.js installed (if running locally)
- [ ] All files in correct folders (public/ for client)
- [ ] server.js and package.json in root
- [ ] Dependencies installed (`npm install`)
- [ ] Server running (`npm start`)
- [ ] Can access game at server URL
- [ ] Multiple players can join
- [ ] Players see each other moving
- [ ] Shooting and building works

🎉 **You're ready to play!**
