
import { Theme, ThemeProperties, FontFamilyOption, FontSizeOption, CustomizableCSSVariable } from './types';

// VSCode Dark+ (Refined Modern Doff / Matte Slate-Black)
const vscodeDarkPlusProperties: ThemeProperties = {
  // App & General UI
  '--app-background': '#111215',
  '--text-default': '#e2e8f0',
  '--text-muted': '#788296',
  '--text-accent': '#38bdf8',
  '--text-inverse': '#0f1013',
  '--border-color': '#1f2127',
  '--focus-border': '#38bdf8',
  '--link-foreground': '#38bdf8',
  '--link-hover-foreground': '#7dd3fc',

  // Title Bar (Matte Stealth)
  '--titlebar-background': '#111215',
  '--titlebar-foreground': '#cbd5e1',
  '--titlebar-inactive-foreground': '#64748b',
  '--titlebar-border': '#1e2026',
  '--titlebar-button-hover-background': '#1c1e24',
  '--titlebar-icon-blue': '#38bdf8',
  '--titlebar-menu-active-background': '#1c1e24',

  // Menu Bar
  '--menubar-background': '#15161b',
  '--menubar-foreground': '#cbd5e1',
  '--menubar-hover-background': '#1e2128',
  '--menubar-separator-color': '#242731',
  '--menu-dropdown-background': '#141519',
  '--menu-dropdown-border': '#252832',
  '--menu-item-hover-background': '#1e293b',
  '--menu-item-selected-background': '#1e293b',
  '--menu-item-selected-foreground': '#38bdf8',
  '--menu-item-foreground': '#cbd5e1',
  '--menu-item-icon-foreground': '#94a3b8',

  // Activity Bar (Matte Minimalist)
  '--activitybar-background': '#0c0d10',
  '--activitybar-foreground': '#f1f5f9',
  '--activitybar-inactive-foreground': '#64748b',
  '--activitybar-active-border': '#38bdf8',
  '--activitybar-active-background': '#16181f',
  '--activitybar-hover-background': '#13151a',

  // Sidebar (Matte Clean Slate)
  '--sidebar-background': '#0f1013',
  '--sidebar-foreground': '#cbd5e1',
  '--sidebar-border': '#1e2026',
  '--sidebar-section-header-foreground': '#94a3b8',
  '--sidebar-item-hover-background': '#17191f',
  '--sidebar-item-focus-background': '#1e293b',
  '--sidebar-item-focus-foreground': '#f8fafc',

  // Editor Area & Tabs (Matte Velvet Finish)
  '--editor-background': '#141518',
  '--editor-foreground': '#e2e8f0',
  '--editor-line-number-foreground': '#4b5563',
  '--editor-tab-background': '#0f1013',
  '--editor-tab-inactive-background': '#0f1013',
  '--editor-tab-active-background': '#141518',
  '--editor-tab-active-foreground': '#f8fafc',
  '--editor-tab-inactive-foreground': '#788296',
  '--editor-tab-hover-background': '#171920',
  '--editor-tab-border': '#1a1c22',
  '--editor-tab-active-border-top': '#38bdf8',
  '--editor-tab-active-border-bottom': '#38bdf8',
  '--editor-tab-icon-foreground': '#94a3b8',
  '--editor-tab-icon-active-foreground': '#38bdf8',

  // Breadcrumbs
  '--breadcrumbs-background': '#141518',
  '--breadcrumbs-foreground': '#94a3b8',
  '--breadcrumbs-focus-foreground': '#f8fafc',
  '--breadcrumbs-separator-color': '#232630',
  '--breadcrumbs-icon-foreground': '#38bdf8',

  // Status Bar (Matte, No Harsh Bright Blue)
  '--statusbar-background': '#0e0f12',
  '--statusbar-foreground': '#94a3b8',
  '--statusbar-border': '#1c1e24',
  '--statusbar-item-hover-background': 'rgba(255, 255, 255, 0.08)',

  // Modals
  '--modal-backdrop-background': 'rgba(0, 0, 0, 0.72)',
  '--modal-background': '#141519',
  '--modal-foreground': '#e2e8f0',
  '--modal-border': '#252832',
  '--modal-input-background': '#0e0f12',
  '--modal-input-placeholder': '#64748b',
  '--modal-input-border': '#252832',
  '--modal-selected-item-background': '#1e293b',
  '--modal-selected-item-foreground': '#38bdf8',
  '--modal-button-background': '#0284c7',
  '--modal-button-hover-background': '#0369a1',
  '--modal-button-foreground': '#ffffff',

  // Scrollbar
  '--scrollbar-track-background': '#0f1013',
  '--scrollbar-thumb-background': '#22252e',
  '--scrollbar-thumb-hover-background': '#2e323e',

  // Terminal Panel
  '--terminal-background': '#0c0d10',
  '--terminal-foreground': '#cbd5e1',
  '--terminal-border': '#1e2026',
  '--terminal-cursor-color': '#38bdf8',
  '--terminal-toolbar-background': '#0f1013',
  '--terminal-close-button-hover-background': '#1e2128',

  // Bottom Panel Tabs
  '--bottom-panel-tab-background': '#0f1013',
  '--bottom-panel-tab-inactive-background': '#0f1013',
  '--bottom-panel-tab-active-background': '#141518',
  '--bottom-panel-tab-active-foreground': '#f8fafc',
  '--bottom-panel-tab-inactive-foreground': '#788296',
  '--bottom-panel-tab-hover-background': '#171920',
  '--bottom-panel-tab-border': '#1a1c22',
  '--bottom-panel-tab-active-border-bottom': '#38bdf8',
  '--bottom-panel-tab-icon-foreground': '#94a3b8',
  '--bottom-panel-tab-icon-active-foreground': '#38bdf8',

  // Linear Progress Bar
  '--progress-bar-background': 'var(--editor-tab-border)',
  '--progress-bar-indicator': 'var(--focus-border)',

  // Article Tags
  '--tag-active-background': '#38bdf8',
  '--tag-active-text': '#0f172a',

  // Syntax Highlighting (Calm Modern Doff Palette)
  '--syntax-string': '#f59e0b',
  '--syntax-keyword': '#38bdf8',
  '--syntax-comment': '#526077',
  '--syntax-number': '#a78bfa',
  '--syntax-boolean': '#38bdf8',
  '--syntax-property': '#93c5fd',
  '--syntax-operator': '#cbd5e1',
  '--syntax-punctuation': '#94a3b8',
  '--syntax-function': '#34d399',
  '--syntax-base-text': '#e2e8f0',

  // Notification Colors (Soft Dark for Dark Theme)
  '--notification-success-background': 'rgb(21,54,36)',   // Dark Green
  '--notification-success-foreground': 'rgb(134,239,172)', // Light Green
  '--notification-success-border': 'rgb(34,90,56)',     // Medium Green
  '--notification-success-icon': 'rgb(74,222,128)',     // Icon Green
  '--notification-error-background': 'rgb(70,26,29)',     // Dark Red
  '--notification-error-foreground': 'rgb(252,165,165)',   // Light Red
  '--notification-error-border': 'rgb(120,36,42)',     // Medium Red
  '--notification-error-icon': 'rgb(248,113,113)',     // Icon Red
  '--notification-info-background': 'rgb(29,54,82)',      // Dark Blue
  '--notification-info-foreground': 'rgb(147,197,253)',   // Light Blue
  '--notification-info-border': 'rgb(39,74,122)',      // Medium Blue
  '--notification-info-icon': 'rgb(96,165,250)',      // Icon Blue
  '--notification-warning-background': 'rgb(70,51,20)',   // Dark Yellow/Amber
  '--notification-warning-foreground': 'rgb(252,211,77)',  // Light Yellow/Amber
  '--notification-warning-border': 'rgb(110,71,30)',    // Medium Yellow/Amber
  '--notification-warning-icon': 'rgb(251,191,36)',    // Icon Yellow/Amber

  // Terminal Font specific variables
  '--terminal-font-size': '14px',
  '--terminal-line-height': '1.5',
};

// VSCode Light+ (Based on default VSCode light theme)
const vscodeLightPlusProperties: ThemeProperties = {
  // App & General UI
  '--app-background': '#ffffff',
  '--text-default': '#24292E',
  '--text-muted': '#586069',
  '--text-accent': '#0366D6',
  '--text-inverse': '#FFFFFF',
  '--border-color': '#E1E4E8',
  '--focus-border': '#0366D6',
  '--link-foreground': '#0366D6',
  '--link-hover-foreground': '#0052CC',


  // Title Bar
  '--titlebar-background': '#DDDDDD',
  '--titlebar-foreground': '#333333',
  '--titlebar-inactive-foreground': '#666666',
  '--titlebar-border': '#CCCCCC',
  '--titlebar-button-hover-background': '#CACACA',
  '--titlebar-icon-blue': '#005FB8',
  '--titlebar-menu-active-background': '#CACACA',

  // Menu Bar
  '--menubar-background': '#DDDDDD',
  '--menubar-foreground': '#333333',
  '--menubar-hover-background': '#CACACA',
  '--menubar-separator-color': '#CCCCCC',
  '--menu-dropdown-background': '#F3F3F3',
  '--menu-dropdown-border': '#D1D1D1',
  '--menu-item-hover-background': '#0060C0',
  '--menu-item-hover-foreground': '#FFFFFF', // Text color for item on hover
  '--menu-item-selected-background': '#0052CC',
  '--menu-item-selected-foreground': '#FFFFFF',
  '--menu-item-foreground': '#1F1F1F',
  '--menu-item-icon-foreground': '#424242',


  // Activity Bar
  '--activitybar-background': '#F8F8F8',
  '--activitybar-foreground': '#24292E',
  '--activitybar-inactive-foreground': '#586069',
  '--activitybar-active-border': '#0366D6',
  '--activitybar-active-background': '#E7E7E7',
  '--activitybar-hover-background': '#EDEDED',

  // Sidebar (Explorer)
  '--sidebar-background': '#F3F3F3',
  '--sidebar-foreground': '#24292E',
  '--sidebar-border': '#E1E4E8',
  '--sidebar-section-header-foreground': '#333333',
  '--sidebar-item-hover-background': '#E8E8E8',
  '--sidebar-item-focus-background': '#CDE4F6',
  '--sidebar-item-focus-foreground': '#005FB8',

  // Editor Area & Tabs
  '--editor-background': '#FFFFFF',
  '--editor-foreground': '#24292E',
  '--editor-line-number-foreground': '#AAAAAA',
  '--editor-tab-background': '#ECECEC',
  '--editor-tab-inactive-background': '#ECECEC',
  '--editor-tab-active-background': '#FFFFFF',
  '--editor-tab-active-foreground': '#000000',
  '--editor-tab-inactive-foreground': '#586069',
  '--editor-tab-hover-background': '#DADADA',
  '--editor-tab-border': '#D1D1D1',
  '--editor-tab-active-border-top': '#0366D6', // Kept for themes that might use top border
  '--editor-tab-active-border-bottom': 'var(--focus-border)', // New for bottom active tab indicator
  '--editor-tab-icon-foreground': '#424242',
  '--editor-tab-icon-active-foreground': '#0366D6',


  // Breadcrumbs
  '--breadcrumbs-background': '#FFFFFF',
  '--breadcrumbs-foreground': '#586069',
  '--breadcrumbs-focus-foreground': '#24292E',
  '--breadcrumbs-separator-color': '#D1D1D1',
  '--breadcrumbs-icon-foreground': '#0366D6',


  // Status Bar
  '--statusbar-background': '#007ACC',
  '--statusbar-foreground': '#FFFFFF',
  '--statusbar-border': 'transparent',
  '--statusbar-item-hover-background': 'rgba(0, 0, 0, 0.08)',

  // Modals
  '--modal-backdrop-background': 'rgba(24, 29, 33, 0.6)',
  '--modal-background': '#FDFDFD',
  '--modal-foreground': '#24292E',
  '--modal-border': '#D1D1D1',
  '--modal-input-background': '#FFFFFF',
  '--modal-input-placeholder': '#6A737D',
  '--modal-input-border': '#D1D1D1',
  '--modal-selected-item-background': '#0060C0',
  '--modal-selected-item-foreground': '#FFFFFF',
  '--modal-button-background': '#0366D6',
  '--modal-button-hover-background': '#0056BA',
  '--modal-button-foreground': '#FFFFFF',


  // Scrollbar
  '--scrollbar-track-background': '#F3F3F3',
  '--scrollbar-thumb-background': '#C1C1C1',
  '--scrollbar-thumb-hover-background': '#A8A8A8',

  // Terminal Panel (content area)
  '--terminal-background': '#F0F0F0',
  '--terminal-foreground': '#333333',
  '--terminal-border': '#CCCCCC',
  '--terminal-cursor-color': '#333333',
  '--terminal-toolbar-background': '#E0E0E0',
  '--terminal-close-button-hover-background': '#D0D0D0',

  // Bottom Panel Tabs (New)
  '--bottom-panel-tab-background': '#F3F3F3',
  '--bottom-panel-tab-inactive-background': '#F3F3F3',
  '--bottom-panel-tab-active-background': '#FFFFFF',
  '--bottom-panel-tab-active-foreground': '#333333',
  '--bottom-panel-tab-inactive-foreground': '#666666',
  '--bottom-panel-tab-hover-background': '#E8E8E8',
  '--bottom-panel-tab-border': '#D1D1D1',
  '--bottom-panel-tab-active-border-bottom': '#0366D6',
  '--bottom-panel-tab-icon-foreground': '#555555',
  '--bottom-panel-tab-icon-active-foreground': '#0366D6',

  // Linear Progress Bar
  '--progress-bar-background': 'var(--editor-tab-border)',
  '--progress-bar-indicator': 'var(--focus-border)',

  // Article Tags (Active State)
  '--tag-active-background': 'var(--text-accent)',
  '--tag-active-text': 'var(--text-inverse)',

  // Syntax Highlighting
  '--syntax-string': '#032F62',
  '--syntax-keyword': '#D73A49',
  '--syntax-comment': '#6A737D',
  '--syntax-number': '#005CC5',
  '--syntax-boolean': '#D73A49',
  '--syntax-property': '#E36209',
  '--syntax-operator': '#24292E',
  '--syntax-punctuation': '#24292E',
  '--syntax-function': '#6F42C1',
  '--syntax-base-text': '#24292E',

  // Notification Colors (Adjusted for Light Theme - can be softer if needed)
  '--notification-success-background': 'rgb(220,252,231)', // green-100
  '--notification-success-foreground': 'rgb(21,128,61)',   // green-700
  '--notification-success-border': 'rgb(134,239,172)',     // green-300
  '--notification-success-icon': 'rgb(34,197,94)',         // green-500
  '--notification-error-background': 'rgb(254,226,226)',   // red-100
  '--notification-error-foreground': 'rgb(153,27,27)',     // red-700
  '--notification-error-border': 'rgb(252,165,165)',       // red-300
  '--notification-error-icon': 'rgb(239,68,68)',           // red-500
  '--notification-info-background': 'rgb(219,234,254)',    // blue-100
  '--notification-info-foreground': 'rgb(30,64,175)',      // blue-700
  '--notification-info-border': 'rgb(147,197,253)',        // blue-300
  '--notification-info-icon': 'rgb(59,130,246)',           // blue-500
  '--notification-warning-background': 'rgb(254,249,195)', // yellow-100
  '--notification-warning-foreground': 'rgb(133,77,14)',   // yellow-700
  '--notification-warning-border': 'rgb(252,211,77)',      // yellow-300
  '--notification-warning-icon': 'rgb(234,179,8)',         // yellow-500
  // Terminal Font specific variables
  '--terminal-font-size': '14px', // Default, will be overridden by JS
  '--terminal-line-height': '1.5', // Default, will be overridden by JS
};

const githubDarkDefaultProperties: ThemeProperties = {
  // App & General UI
  '--app-background': '#0d1117',
  '--text-default': '#c9d1d9',
  '--text-muted': '#8b949e',
  '--text-accent': '#58a6ff',
  '--text-inverse': '#0d1117',
  '--border-color': '#30363d',
  '--focus-border': '#58a6ff',
  '--link-foreground': '#58a6ff',
  '--link-hover-foreground': '#80baff',

  // Title Bar
  '--titlebar-background': '#161b22',
  '--titlebar-foreground': '#c9d1d9',
  '--titlebar-inactive-foreground': '#8b949e',
  '--titlebar-border': '#30363d',
  '--titlebar-button-hover-background': '#21262d',
  '--titlebar-icon-blue': '#58a6ff',
  '--titlebar-menu-active-background': '#21262d',

  // Menu Bar
  '--menubar-background': '#161b22',
  '--menubar-foreground': '#c9d1d9',
  '--menubar-hover-background': '#21262d',
  '--menubar-separator-color': '#30363d',
  '--menu-dropdown-background': '#161b22',
  '--menu-dropdown-border': '#30363d',
  '--menu-item-hover-background': '#21262d',
  '--menu-item-selected-background': '#58a6ff',
  '--menu-item-selected-foreground': '#0d1117',
  '--menu-item-foreground': '#c9d1d9',
  '--menu-item-icon-foreground': '#8b949e',

  // Activity Bar
  '--activitybar-background': '#0d1117',
  '--activitybar-foreground': '#c9d1d9',
  '--activitybar-inactive-foreground': '#8b949e',
  '--activitybar-active-border': '#f78166', // GitHub orange accent
  '--activitybar-active-background': '#21262d',
  '--activitybar-hover-background': '#21262d',

  // Sidebar
  '--sidebar-background': '#0d1117',
  '--sidebar-foreground': '#c9d1d9',
  '--sidebar-border': '#30363d',
  '--sidebar-section-header-foreground': '#8b949e',
  '--sidebar-item-hover-background': '#21262d',
  '--sidebar-item-focus-background': '#58a6ff',
  '--sidebar-item-focus-foreground': '#0d1117',

  // Editor Area & Tabs
  '--editor-background': '#0d1117',
  '--editor-foreground': '#c9d1d9',
  '--editor-line-number-foreground': '#484f58',
  '--editor-tab-background': '#0d1117',
  '--editor-tab-inactive-background': '#0d1117',
  '--editor-tab-active-background': '#161b22',
  '--editor-tab-active-foreground': '#c9d1d9',
  '--editor-tab-inactive-foreground': '#8b949e',
  '--editor-tab-hover-background': '#21262d',
  '--editor-tab-border': '#30363d',
  '--editor-tab-active-border-top': '#f78166', // Orange accent for active tab top border (kept for themes that might use it)
  '--editor-tab-active-border-bottom': '#f78166', // Orange accent
  '--editor-tab-icon-foreground': '#8b949e',
  '--editor-tab-icon-active-foreground': '#58a6ff',

  // Breadcrumbs
  '--breadcrumbs-background': '#0d1117',
  '--breadcrumbs-foreground': '#8b949e',
  '--breadcrumbs-focus-foreground': '#c9d1d9',
  '--breadcrumbs-separator-color': '#30363d',
  '--breadcrumbs-icon-foreground': '#58a6ff',

  // Status Bar
  '--statusbar-background': '#161b22',
  '--statusbar-foreground': '#c9d1d9',
  '--statusbar-border': '#30363d',
  '--statusbar-item-hover-background': '#21262d',

  // Modals
  '--modal-backdrop-background': 'rgba(0, 0, 0, 0.4)',
  '--modal-background': '#161b22',
  '--modal-foreground': '#c9d1d9',
  '--modal-border': '#30363d',
  '--modal-input-background': '#0d1117',
  '--modal-input-placeholder': '#484f58',
  '--modal-input-border': '#30363d',
  '--modal-selected-item-background': '#21262d',
  '--modal-selected-item-foreground': '#58a6ff',
  '--modal-button-background': '#238636', // GitHub green
  '--modal-button-hover-background': '#2ea043', // Lighter GitHub green
  '--modal-button-foreground': '#ffffff',

  // Scrollbar
  '--scrollbar-track-background': '#0d1117',
  '--scrollbar-thumb-background': '#21262d',
  '--scrollbar-thumb-hover-background': '#30363d',

  // Terminal Panel
  '--terminal-background': '#0d1117',
  '--terminal-foreground': '#c9d1d9',
  '--terminal-border': '#30363d',
  '--terminal-cursor-color': '#58a6ff',
  '--terminal-toolbar-background': '#161b22',
  '--terminal-close-button-hover-background': '#21262d',

  // Bottom Panel Tabs
  '--bottom-panel-tab-background': '#0d1117',
  '--bottom-panel-tab-inactive-background': '#0d1117',
  '--bottom-panel-tab-active-background': '#161b22',
  '--bottom-panel-tab-active-foreground': '#c9d1d9',
  '--bottom-panel-tab-inactive-foreground': '#8b949e',
  '--bottom-panel-tab-hover-background': '#21262d',
  '--bottom-panel-tab-border': '#30363d',
  '--bottom-panel-tab-active-border-bottom': '#f78166', // Orange accent
  '--bottom-panel-tab-icon-foreground': '#8b949e',
  '--bottom-panel-tab-icon-active-foreground': '#58a6ff',

  // Linear Progress Bar
  '--progress-bar-background': '#30363d',
  '--progress-bar-indicator': '#58a6ff',

  // Article Tags (Active State)
  '--tag-active-background': '#58a6ff',
  '--tag-active-text': '#0d1117',

  // Syntax Highlighting (GitHub Inspired)
  '--syntax-string': '#a5d6ff',
  '--syntax-keyword': '#ff7b72',
  '--syntax-comment': '#8b949e',
  '--syntax-number': '#79c0ff',
  '--syntax-boolean': '#79c0ff',
  '--syntax-property': '#c9d1d9', // JSON keys, etc.
  '--syntax-operator': '#ff7b72',
  '--syntax-punctuation': '#c9d1d9',
  '--syntax-function': '#d2a8ff',
  '--syntax-base-text': '#c9d1d9',

  // Notification Colors (Reusing VSCode Dark+ notifications for consistency in dark themes)
  '--notification-success-background': 'rgb(21,54,36)',
  '--notification-success-foreground': 'rgb(134,239,172)',
  '--notification-success-border': 'rgb(34,90,56)',
  '--notification-success-icon': 'rgb(74,222,128)',
  '--notification-error-background': 'rgb(70,26,29)',
  '--notification-error-foreground': 'rgb(252,165,165)',
  '--notification-error-border': 'rgb(120,36,42)',
  '--notification-error-icon': 'rgb(248,113,113)',
  '--notification-info-background': 'rgb(29,54,82)',
  '--notification-info-foreground': 'rgb(147,197,253)',
  '--notification-info-border': 'rgb(39,74,122)',
  '--notification-info-icon': 'rgb(96,165,250)',
  '--notification-warning-background': 'rgb(70,51,20)',
  '--notification-warning-foreground': 'rgb(252,211,77)',
  '--notification-warning-border': 'rgb(110,71,30)',
  '--notification-warning-icon': 'rgb(251,191,36)',

  // Terminal Font specific variables
  '--terminal-font-size': '14px',
  '--terminal-line-height': '1.5',
};

// A web interpretation of Liquid Glass: translucent chrome over an aurora-lit
// desktop, while editor content stays calm and high-contrast.
const liquidGlassProperties: ThemeProperties = {
  ...githubDarkDefaultProperties,
  '--app-background': '#050814',
  '--text-default': '#f8fafc',
  '--text-muted': '#94a3b8',
  '--text-accent': '#38bdf8',
  '--text-inverse': '#050b14',
  '--border-color': 'rgba(255, 255, 255, 0.12)',
  '--focus-border': '#38bdf8',
  '--link-foreground': '#38bdf8',
  '--link-hover-foreground': '#7dd3fc',
  '--titlebar-background': 'rgba(10, 15, 32, 0.65)',
  '--titlebar-foreground': '#f8fafc',
  '--titlebar-inactive-foreground': '#94a3b8',
  '--titlebar-border': 'rgba(255, 255, 255, 0.10)',
  '--titlebar-button-hover-background': 'rgba(255, 255, 255, 0.12)',
  '--titlebar-icon-blue': '#38bdf8',
  '--titlebar-menu-active-background': 'rgba(255, 255, 255, 0.14)',
  '--menubar-background': 'rgba(255, 255, 255, 0.05)',
  '--menubar-foreground': '#f1f5f9',
  '--menubar-hover-background': 'rgba(255, 255, 255, 0.10)',
  '--menubar-separator-color': 'rgba(255, 255, 255, 0.12)',
  '--menu-dropdown-background': 'rgba(10, 15, 32, 0.88)',
  '--menu-dropdown-border': 'rgba(255, 255, 255, 0.16)',
  '--menu-item-hover-background': 'rgba(56, 189, 248, 0.16)',
  '--menu-item-selected-background': 'rgba(56, 189, 248, 0.24)',
  '--menu-item-selected-foreground': '#ffffff',
  '--menu-item-foreground': '#f1f5f9',
  '--menu-item-icon-foreground': '#94a3b8',
  '--activitybar-background': 'rgba(7, 11, 24, 0.70)',
  '--activitybar-foreground': '#f8fafc',
  '--activitybar-inactive-foreground': '#788296',
  '--activitybar-active-border': '#38bdf8',
  '--activitybar-active-background': 'rgba(56, 189, 248, 0.16)',
  '--activitybar-hover-background': 'rgba(255, 255, 255, 0.09)',
  '--sidebar-background': 'rgba(9, 14, 30, 0.60)',
  '--sidebar-foreground': '#e2e8f0',
  '--sidebar-border': 'rgba(255, 255, 255, 0.10)',
  '--sidebar-section-header-foreground': '#94a3b8',
  '--sidebar-item-hover-background': 'rgba(255, 255, 255, 0.08)',
  '--sidebar-item-focus-background': 'rgba(56, 189, 248, 0.18)',
  '--sidebar-item-focus-foreground': '#ffffff',
  '--editor-background': 'rgba(6, 10, 22, 0.58)',
  '--editor-foreground': '#f1f5f9',
  '--editor-line-number-foreground': '#4b5563',
  '--editor-tab-background': 'rgba(10, 14, 28, 0.50)',
  '--editor-tab-inactive-background': 'rgba(7, 10, 22, 0.42)',
  '--editor-tab-active-background': 'rgba(56, 189, 248, 0.12)',
  '--editor-tab-active-foreground': '#ffffff',
  '--editor-tab-inactive-foreground': '#94a3b8',
  '--editor-tab-hover-background': 'rgba(255, 255, 255, 0.08)',
  '--editor-tab-border': 'rgba(255, 255, 255, 0.08)',
  '--editor-tab-active-border-top': '#38bdf8',
  '--editor-tab-active-border-bottom': '#38bdf8',
  '--editor-tab-icon-foreground': '#94a3b8',
  '--editor-tab-icon-active-foreground': '#38bdf8',
  '--breadcrumbs-background': 'rgba(8, 12, 26, 0.45)',
  '--breadcrumbs-foreground': '#94a3b8',
  '--breadcrumbs-focus-foreground': '#f8fafc',
  '--breadcrumbs-separator-color': 'rgba(255, 255, 255, 0.10)',
  '--breadcrumbs-icon-foreground': '#38bdf8',
  '--statusbar-background': 'rgba(8, 12, 26, 0.72)',
  '--statusbar-foreground': '#cbd5e1',
  '--statusbar-border': 'rgba(255, 255, 255, 0.10)',
  '--statusbar-item-hover-background': 'rgba(255, 255, 255, 0.10)',
  '--modal-backdrop-background': 'rgba(2, 4, 12, 0.65)',
  '--modal-background': 'rgba(11, 16, 36, 0.85)',
  '--modal-foreground': '#f8fafc',
  '--modal-border': 'rgba(255, 255, 255, 0.18)',
  '--modal-input-background': 'rgba(4, 7, 18, 0.55)',
  '--modal-input-placeholder': '#64748b',
  '--modal-input-border': 'rgba(255, 255, 255, 0.16)',
  '--modal-selected-item-background': 'rgba(56, 189, 248, 0.18)',
  '--modal-selected-item-foreground': '#ffffff',
  '--modal-button-background': '#0284c7',
  '--modal-button-hover-background': '#0369a1',
  '--modal-button-foreground': '#ffffff',
  '--scrollbar-track-background': 'transparent',
  '--scrollbar-thumb-background': 'rgba(255, 255, 255, 0.18)',
  '--scrollbar-thumb-hover-background': 'rgba(255, 255, 255, 0.32)',
  '--terminal-background': 'rgba(5, 8, 18, 0.70)',
  '--terminal-foreground': '#e2e8f0',
  '--terminal-border': 'rgba(255, 255, 255, 0.10)',
  '--terminal-cursor-color': '#38bdf8',
  '--terminal-toolbar-background': 'rgba(9, 13, 28, 0.68)',
  '--terminal-close-button-hover-background': 'rgba(255, 255, 255, 0.10)',
};


export const PREDEFINED_THEMES: Theme[] = [
  { name: 'Liquid Glass', properties: liquidGlassProperties },
  { name: 'VSCode Dark+', properties: vscodeDarkPlusProperties },
  { name: 'VSCode Light+', properties: vscodeLightPlusProperties },
  { name: 'GitHub Dark Default', properties: githubDarkDefaultProperties },
];

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  { id: 'fira-code', label: 'Fira Code', value: '"Fira Code", "JetBrains Mono", Consolas, "Courier New", monospace' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', value: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace' },
  { id: 'consolas', label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
  { id: 'courier-new', label: 'Courier New', value: '"Courier New", monospace' },
  { id: 'monospace', label: 'System Monospace', value: 'monospace' },
];

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { id: 'small', label: 'Small (12px)', value: '12px', lineHeight: '1.4' },
  { id: 'medium', label: 'Medium (14px)', value: '14px', lineHeight: '1.5' },
  { id: 'large', label: 'Large (16px)', value: '16px', lineHeight: '1.5' },
  { id: 'xlarge', label: 'X-Large (18px)', value: '18px', lineHeight: '1.6' },
];

// New options for Terminal Font Size
export const TERMINAL_FONT_SIZE_OPTIONS: FontSizeOption[] = [
    { id: 'term-xsmall', label: 'X-Small (10px)', value: '10px', lineHeight: '1.3' },
    { id: 'term-small', label: 'Small (12px)', value: '12px', lineHeight: '1.4' },
    { id: 'term-medium', label: 'Medium (14px)', value: '14px', lineHeight: '1.5' },
    { id: 'term-large', label: 'Large (16px)', value: '16px', lineHeight: '1.5' },
];

export const DEFAULT_THEME_NAME = PREDEFINED_THEMES[0].name;
export const DEFAULT_FONT_FAMILY_ID = FONT_FAMILY_OPTIONS[0].id;
export const DEFAULT_FONT_SIZE_ID = FONT_SIZE_OPTIONS[1].id; // Medium (14px) for editor
export const DEFAULT_TERMINAL_FONT_SIZE_ID = TERMINAL_FONT_SIZE_OPTIONS[2].id; // Medium (14px) for terminal


export function generateCSSVariables(properties: ThemeProperties): string {
  return Object.entries(properties)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

export const CUSTOMIZABLE_CSS_VARIABLES: CustomizableCSSVariable[] = [
  { variable: '--app-background', label: 'Application Background', group: 'General UI' },
  { variable: '--text-default', label: 'Default Text Color', group: 'General UI' },
  { variable: '--text-accent', label: 'Primary Accent Color', group: 'General UI' },
  { variable: '--focus-border', label: 'Focus/Active Border Color', group: 'General UI' },
  { variable: '--link-foreground', label: 'Link Color', group: 'General UI' },
  { variable: '--border-color', label: 'Default Border Color', group: 'General UI' },
  
  { variable: '--titlebar-background', label: 'Title Bar Background', group: 'Components' },
  { variable: '--activitybar-background', label: 'Activity Bar Background', group: 'Components' },
  { variable: '--sidebar-background', label: 'Sidebar Background', group: 'Components' },
  { variable: '--editor-background', label: 'Editor Background', group: 'Components' },
  { variable: '--editor-tab-active-background', label: 'Active Editor Tab Background', group: 'Components' },
  { variable: '--terminal-background', label: 'Terminal Background', group: 'Components' },
  { variable: '--statusbar-background', label: 'Status Bar Background', group: 'Components' },
  { variable: '--modal-background', label: 'Modal Background', group: 'Components' },
  { variable: '--modal-button-background', label: 'Modal Button Background', group: 'Components' },

  { variable: '--syntax-keyword', label: 'Syntax: Keyword', group: 'Syntax Highlighting' },
  { variable: '--syntax-string', label: 'Syntax: String', group: 'Syntax Highlighting' },
  { variable: '--syntax-comment', label: 'Syntax: Comment', group: 'Syntax Highlighting' },
  { variable: '--syntax-number', label: 'Syntax: Number', group: 'Syntax Highlighting' },
  { variable: '--syntax-function', label: 'Syntax: Function', group: 'Syntax Highlighting' },
];
