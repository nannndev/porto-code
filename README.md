# Porto Code

> An interactive, VS Code-inspired portfolio application built with **React 19 + TypeScript + Vite**.

Porto Code presents a developer's portfolio through a familiar IDE interface — complete with a file explorer, editor tabs, an AI assistant, a live terminal, GitHub profile viewer, guest book, and more.

## ✨ Features

- 🗂️ **File Explorer** — Browse portfolio data as JSON files (`about.json`, `projects.json`, etc.)
- 🤖 **AI Assistant** — Chat with Gemini AI, pre-seeded with portfolio context
- 📰 **Articles** — Live feed from dev.to
- 🐙 **GitHub Profile** — GitHub activity viewer with contribution graph
- ✍️ **Guest Book** — Firebase-backed, authenticated guestbook with emoji reactions
- 📊 **Statistics** — Real-time usage stats from Firebase
- ⚙️ **Settings** — Theme switcher (10+ themes), font controls, custom color overrides
- ⌨️ **Terminal** — Interactive command-line with `help`, `cat`, `theme`, `neofetch`, and more
- 📄 **CV Generator** — Download a PDF CV generated in-browser via pdf-lib
- 🔧 **Feature Status System** — Live maintenance flags controlled from Firebase (no redeploy)

## 🚀 Quick Start

```bash
git clone https://github.com/nannndev/porto-code.git
cd porto-code
bun install   # or npm install
cp .env.example .env   # then fill in GEMINI_API_KEY
bun run dev   # or npm run dev
```

Open `http://localhost:5173`.

## 📖 Documentation

Full documentation is in the [`docs/`](./docs/) folder, structured using the [Diátaxis framework](https://diataxis.fr/):

| Type | Document |
|---|---|
| 📚 Tutorial | [Getting Started](./docs/tutorials/getting-started.md) |
| 📚 Tutorial | [Customizing Your Portfolio](./docs/tutorials/customizing-portfolio.md) |
| 🛠️ How-to | [Add a New Feature Panel](./docs/how-to/add-feature-panel.md) |
| 🛠️ How-to | [Manage Feature Status via Firebase](./docs/how-to/manage-feature-status.md) |
| 💡 Explanation | [Architecture Overview](./docs/explanation/architecture.md) |
| 💡 Explanation | [Feature System](./docs/explanation/feature-system.md) |
| 📋 Reference | [TypeScript Types](./docs/reference/types.md) |
| 📋 Reference | [Custom React Hooks](./docs/reference/hooks.md) |
| 📋 Reference | [Utility Modules](./docs/reference/utilities.md) |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.7 |
| Build Tool | Vite 6 |
| Styling | TailwindCSS (CDN) + CSS Custom Properties |
| Backend | Firebase Auth + Realtime Database |
| AI | Google Gemini (`@google/genai`) |
| PDF | pdf-lib |
| Icons | Lucide React |

## 🏗️ Project Structure

```
src/
├── App/          # Root component, all state, constants, types, themes
├── features/     # Isolated feature modules (AIChat, GuestBook, GitHub…)
├── Layout/       # VS Code shell chrome (ActivityBar, TitleBar, StatusBar…)
├── UI/           # Reusable generic UI components
├── Hooks/        # Custom React hooks
├── Utils/        # Pure utility functions
└── Assets/       # Static TS asset files
```

## 📝 License

MIT — feel free to fork and customize for your own portfolio.

---

Built with ❤️ by **Nandang Eka Prasetya** · [GitHub](https://github.com/naneps) · [LinkedIn](https://www.linkedin.com/in/nandang-eka-prasetya)
