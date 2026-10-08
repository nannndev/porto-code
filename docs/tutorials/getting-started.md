# Getting Started with Porto Code

**Porto Code** is a VS Code-inspired interactive portfolio web application. This tutorial walks you through setting up the project on your local machine for the first time — from zero to a running local dev server.

**Time required:** ~10 minutes  
**Prerequisites:** Node.js ≥ 18 or Bun installed, Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/naneps/porto-code.git
cd porto-code
```

---

## 2. Install Dependencies

The project uses **Bun** as the package manager (a `bun.lockb` lock file is included). You can also use npm.

```bash
# Using Bun (recommended — matches the lock file)
bun install

# Or using npm
npm install
```

---

## 3. Configure Environment Variables

Porto Code integrates with two external services that require API keys: **Firebase** (Realtime Database + Auth) and **Google Gemini AI** (AI Chat). Without them the app will still run, but those features will be unavailable.

Create a `.env` file in the project root:

```env
# Google Gemini AI — https://aistudio.google.com/
# Server-only (no VITE_ prefix): used by the /api/gemini function, never sent to the browser.
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase — https://console.firebase.google.com/
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note:** The app gracefully degrades without these keys. You will see a maintenance placeholder for the AI Chat and Guest Book features, but all portfolio content and navigation remain fully functional.

---

## 4. Start the Development Server

```bash
# Using Bun
bun run dev

# Using npm
npm run dev
```

Vite starts a local dev server. Open your browser at:

```
http://localhost:5173
```

You should see the Porto Code interface with the VS Code-like layout.

---

## 5. Verify the Setup

Once the app loads, confirm these features work:

| Check | Expected Result |
|---|---|
| Page loads without blank screen | ✅ VS Code-like layout is visible |
| File Explorer (left sidebar) | Click `Explorer` icon — `about.json`, `projects.json`, etc. appear |
| Active tab opens a file | Click `about.json` — JSON content displays in the editor area |
| Command Palette opens | Press `Ctrl+Shift+P` — a search popup appears |
| Terminal responds | Open Bottom Panel → type `help` → list of commands appears |

---

## 6. Build for Production

When you are ready to deploy:

```bash
bun run build
# or
npm run build
```

The production bundle is output to the `dist/` directory. You can preview it locally with:

```bash
bun run preview
# or
npm run preview
```

---

## Next Steps

- **Customize the portfolio data** → [Customizing Your Portfolio](./customizing-portfolio.md)
- **Understand the project structure** → [Architecture Overview](../explanation/architecture.md)
- **Add a new feature** → [How-to: Add a New Feature Panel](../how-to/add-feature-panel.md)
