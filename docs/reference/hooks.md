# Reference: Custom React Hooks

All custom hooks live in `src/Hooks/`. Each hook encapsulates a specific domain of side-effects or stateful logic and is used exclusively in `App.tsx` (the root orchestrator).

---

## `useGeminiChat`

**File:** `src/Hooks/useGeminiChat.ts`

Manages the AI assistant conversation with Google Gemini. Initializes a chat session on mount, sends user messages, and streams the AI response.

### Signature

```ts
function useGeminiChat(
  portfolioData: PortfolioData,
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void
): {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  error: string | null;
  apiKeyAvailable: boolean;
  handleSendMessage: () => Promise<void>;
}
```

### Behavior

- Calls the `/api/gemini` server function (see `api/gemini.ts`), which holds `GEMINI_API_KEY` server-side. If the server reports the key is not configured, `apiKeyAvailable` is `false` and the chat UI renders a disabled state.
- Injects `portfolioData` as system context so the AI answers questions about the portfolio owner.
- Streams responses token-by-token and appends them to the last AI message in real-time.
- On error, sets `error` state and adds an error log entry.

---

## `useThemeManager`

**File:** `src/Hooks/useThemeManager.ts`

Manages theme selection, font family, font sizes, and per-theme custom color overrides.

### Signature

```ts
function useThemeManager(
  defaultThemeName: string,
  defaultFontFamilyId: string,
  defaultFontSizeId: string,
  terminalFontSizeId: string,
  terminalFontSizeOptions: FontSizeOption[],
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void
): {
  currentThemeName: string;
  currentFontFamilyId: string;
  currentFontSizeId: string;
  handleThemeChange: (themeName: string) => void;
  handleFontFamilyChange: (fontId: string) => void;
  handleFontSizeChange: (sizeId: string) => void;
  customColorOverrides: ThemeProperties;
  currentThemeBaseProperties: ThemeProperties;
  applyCustomColorOverride: (variableName: string, colorValue: string) => void;
  saveCustomThemeOverrides: () => void;
  resetCustomThemeOverrides: () => void;
  resetSingleColorOverride: (variableName: string) => void;
}
```

### Behavior

- Applies theme CSS custom properties directly to `document.documentElement.style`.
- Persists current theme, font family, and font size to `localStorage`.
- Custom color overrides are stored in `localStorage` as JSON under a per-theme key, layered on top of the base theme.
- Theme change increments a `theme_usage/{themeName}/count` statistic in Firebase.

---

## `useDevToArticles`

**File:** `src/Hooks/useDevToArticles.ts`

Fetches articles from the [dev.to](https://dev.to) public API for the given username.

### Signature

```ts
function useDevToArticles(
  username: string,
  addAppLog: (level: LogLevel, message: string, source?: string) => void
): {
  articles: ArticleItem[];
  isLoading: boolean;
  error: string | null;
  fetchArticles: () => void;
}
```

### Behavior

- Fetches `https://dev.to/api/articles?username={username}` on mount.
- Returns full `ArticleItem[]` including `body_markdown` for rendering article content.
- Exposes `fetchArticles()` for manual retry on error.
- Errors are logged via `addAppLog`.

---

## `useNotifications`

**File:** `src/Hooks/useNotifications.ts`

Manages the in-app notification toast queue.

### Signature

```ts
function useNotifications(): {
  notifications: NotificationItem[];
  addNotification: (
    message: string,
    type: NotificationType,
    duration?: number,
    actions?: NotificationAction[],
    icon?: LucideIcon,
    isLoadingProgressBar?: boolean,
    progressId?: string
  ) => string;   // Returns the generated notification ID
  removeNotification: (id: string) => void;
}
```

### Behavior

- Auto-dismisses notifications after `duration` milliseconds if provided; `0` or `undefined` means sticky.
- Supports a `progressId` for updating an existing notification in-place (used for the initial load sequence).
- Used through the `addNotificationAndLog` wrapper in `App.tsx` to simultaneously add a notification and a log entry.

---

## `useFullscreen`

**File:** `src/Hooks/useFullscreen.ts`

Wraps the browser Fullscreen API.

### Signature

```ts
function useFullscreen(): {
  isFullscreen: boolean;
  handleToggleFullscreen: () => void;
}
```

### Behavior

- Listens to `fullscreenchange` events to keep `isFullscreen` in sync.
- Calls `document.documentElement.requestFullscreen()` or `document.exitFullscreen()`.

---

## `useGlobalEventHandlers`

**File:** `src/Hooks/useGlobalEventHandlers.ts`

Registers all global keyboard shortcuts via a single `keydown` event listener.

### Signature

```ts
function useGlobalEventHandlers(options: {
  onCommandPaletteOpen: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onNavigateBack: (paneId: EditorPaneId) => void;
  onNavigateForward: (paneId: EditorPaneId) => void;
  focusedEditorPaneId: EditorPaneId;
}): void
```

### Keyboard Shortcuts Registered

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Open Command Palette |
| `Ctrl+B` / `Cmd+B` | Toggle Explorer Sidebar |
| `` Ctrl+` `` / `` Cmd+` `` | Toggle Bottom Panel (Terminal) |
| `Alt+←` | Navigate tab history back |
| `Alt+→` | Navigate tab history forward |

---

## `useTabHistory`

**File:** `src/Hooks/useTabHistory.ts`

A minimal utility hook (currently thin). Tab history logic has been absorbed into `App.tsx` directly. This file is kept for potential future extraction.

---

## Notes on Hook Usage

All hooks are instantiated once at the top of `App.tsx`. No hook is used in child components — this is a deliberate pattern to keep the entire application state localized to the root component, making data flow predictable and avoiding prop-drilling complexity at the hook level.
