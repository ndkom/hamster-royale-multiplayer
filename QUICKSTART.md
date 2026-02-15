# ⚡ QUICK START - Get Playing in 5 Minutes!

## 🎯 Goal: Deploy and play with friends

### Step 1: Go to Glitch (30 seconds)
1. Open https://glitch.com in your browser
2. Sign in (GitHub/Email/Google)
3. Click **"New Project"** button (top right)
4. Choose **"glitch-hello-node"**

### Step 2: Setup Files (2 minutes)

#### Delete Default Files:
- Click on each file in left sidebar
- Click **•••** menu → Delete
- Delete: `server.js`, `package.json`, `public/` folder

#### Create Folder Structure:
1. Click **"New File"** button
2. Type `public/index.html` and press Enter
   - This creates the `public` folder AND `index.html`
3. Copy-paste your `index.html` content into it

#### Upload All Game Files to `public/`:
Repeat "New File" for each:
- `public/main.js`
- `public/config.js`
- `public/Hamster.js`
- `public/Enemy.js`
- `public/WeaponSystem.js`
- `public/BuildSystem.js`
- `public/Environment.js`
- `public/NetworkManager.js`
- `public/rosie/controls/rosieControls.js`
- `public/rosie/controls/rosieMobileControls.js`

**Pro Tip**: Click file in your editor, Ctrl+A, Ctrl+C, paste in Glitch

#### Upload Server Files to ROOT:
1. Click **"New File"** → type `server.js`
2. Paste server.js content
3. Click **"New File"** → type `package.json`
4. Paste package.json content

### Step 3: It Runs Automatically! (30 seconds)
- Glitch auto-installs dependencies
- Watch bottom of screen: "Installing packages..."
- When done, you'll see: "Your app is listening on port 3000"

### Step 4: Share with Friends! (1 minute)
1. Click **"Show"** button (top) → **"In a New Window"**
2. Copy the URL (something like `https://your-name.glitch.me`)
3. Send to friends!
4. Everyone enters name, picks team, and plays!

---

## 🎮 Now What?

### Playing the Game:
1. Open your Glitch URL
2. Enter name (e.g., "Player1")
3. Click Red or Blue team
4. Pick difficulty
5. See other players join!

### Testing Multiplayer:
- Open 2-3 browser tabs with your game URL
- Join as different players
- Walk around - see each other move!

---

## 🔧 Quick Fixes

### "It's not working!"
1. Click **"Logs"** button (bottom of Glitch)
2. Look for errors (red text)
3. Common fix: Click **"Tools"** → **"Terminal"** → type `refresh`

### "Friends can't join"
- Make sure you're sharing the PUBLIC URL
- NOT the editor URL (should NOT have `/edit` in it)
- Click **"Show" → "In a New Window"** to get correct URL

### "Changes not showing"
- Glitch auto-saves and restarts
- Refresh your browser (F5)
- Check Logs for errors

---

## 📱 For Mobile Testing

Your Glitch URL works on phones too!
- Share link via text/email
- Friends open on phone browser
- Touch controls appear automatically

---

## 💡 Pro Tips

### Make Your Project Private:
- Click project name (top left)
- "Make This Private" (if you have Glitch Pro)

### Keep Server Awake:
- Free Glitch projects sleep after 5min
- They wake up when someone visits (takes ~10 seconds)
- For 24/7: Upgrade to Glitch Pro OR use Render.com

### Edit Code in Glitch:
- Click any file to edit
- Changes save automatically
- Server restarts automatically

### Invite Collaborators:
- Click **"Share"** button
- Add friends' emails
- They can edit code with you!

---

## 🎉 You're Done!

**Your game is LIVE and multiplayer!**

URL Format: `https://[your-project-name].glitch.me`

Share this link → Friends join → Battle! 🐹⚔️

---

## Next Steps (Optional)

- Customize colors in `config.js`
- Change arena size
- Modify hamster appearances
- Add more weapons
- Create new maps

**For detailed customization, see README.md**

---

## 🆘 Still Stuck?

### Quick Checklist:
- ✅ All files in `public/` folder?
- ✅ `server.js` and `package.json` in root?
- ✅ Logs showing "listening on port"?
- ✅ Using PUBLIC url (not `/edit` url)?

### Debug Command:
In Glitch Terminal (Tools → Terminal):
```bash
npm install
refresh
```

**That's it - have fun! 🎮**
