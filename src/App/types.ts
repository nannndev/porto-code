

import { LucideIcon, ImageIcon as ImageIconType, ExternalLink as ExternalLinkIcon, LayoutPanelTop } from 'lucide-react'; // Changed LayoutPanelBottom to LayoutPanelTop
import type { FirebaseUser } from '../Utils/firebase'; // Corrected import

export interface Address {
  city: string;
  full: string;
}

export interface EducationEntry {
  school: string;
  major: string;
  period: string;
  gpa?: string; // e.g. "3.5 / 4.0"
}

export interface CertificationEntry {
  issuer: string;   // e.g. "Dicoding Indonesia"
  title: string;    // e.g. "Belajar Membuat Aplikasi Flutter"
  year?: string;    // e.g. "2023"
}

export interface Position {
  role: string;
  company: string;
  period: string;
  description?: string; // Added description
}

export interface WorkExperienceEntry extends Position {}

export interface ProjectDetail {
  id: string;
  title: string;
  description:string;
  technologies: string[];
  year?: number; // Made optional, but AI will provide it
  related_skills?: string[]; // New for AI suggestions
  webLink?: string;
  imageUrls?: string[];
}

export interface PortfolioData {
  name: string;
  nickname: string;
  email: string;
  phone: string;
  address: Address;
  summary?: string;
  education: EducationEntry[];
  current_position: Position;
  work_experience: WorkExperienceEntry[];
  skills: string[];
  certifications?: CertificationEntry[]; // New
  projects: ProjectDetail[];
  linkedIn: string;
  instagram?: string;
  tiktok?: string;
  otherSocial?: {
    name: string;
    url: string;
  };
  avatarUrl?: string;
  role?: string;
  availability?: string; // e.g. "Open to full-time ... roles"
  languages?: string[];  // e.g. ["Indonesian (native)", "English (basic)"]
}


export interface Tab {
  id: string;
  title: string;
  type: 'file' | 'project_detail' | 'web_preview' | 'playground' | 'ai_chat' | 'json_preview' | 'article_detail' | 'cv_preview' | 'settings_editor' | 'github_profile_view' | 'guest_book' | 'spotify_view' | 'extensions' | 'achievements' | 'support';
  fileName?: string; // For file-based tabs and json_preview of files or projects
  articleSlug?: string; // Remains for identifying which article is open
  articleId?: number; // Added to store dev.to article ID
  githubUsername?: string; // For github_profile_view tab
}

export interface SidebarItemConfig {
  id: string;
  label: string;
  icon: LucideIcon; // Icon for the item itself
  fileName?: string; // For file-like items that open a standard file tab
  type?: Tab['type']; // Relevant if it opens a standard file tab
  title?: string; // Display title, can be same as fileName or label
  isFolder?: boolean;
  children?: SidebarItemConfig[];
  actionType?: 'open_tab' | 'run_cv_generator'; // Default to 'open_tab'
  defaultOpen?: boolean; // For folders, initial expanded state
  featureId?: FeatureId; // Associate sidebar item with a feature for status checking
}


export interface Command {
  id: string;
  label: string;
  action: () => void;
  icon?: LucideIcon;
  group?: string;
  description?: string;
  value?: string;
  isSelected?: boolean;
  featureId?: FeatureId; // Optional: Associate command with a feature
}

// Type for TitleBar menu items, allowing for nesting
export interface AppMenuItem {
  label?: string;
  action?: () => void;
  icon?: LucideIcon | undefined; // Allow undefined for conditional icons like Check
  subItems?: AppMenuItem[];
  value?: string;
  isSelected?: boolean;
  separator?: boolean;
  featureId?: FeatureId; // Optional: Associate menu item with a feature
}

// Theme related types
export interface ThemeProperties {
  [key: string]: string;
}

export interface Theme {
  name: string;
  properties: ThemeProperties;
}

export interface FontFamilyOption {
  id: string;
  label: string;
  value: string;
}

export interface FontSizeOption {
  id: string;
  label: string;
  value: string;
  lineHeight?: string;
}

// For Theme Customization
export interface CustomizableCSSVariable {
  variable: string; // e.g., '--app-background'
  label: string;    // e.g., 'Application Background'
  group: string;    // e.g., 'General UI', 'Editor', 'Syntax'
}

export interface CustomColorOverrides {
  [themeName: string]: ThemeProperties; // themeName -> { cssVar: colorValue }
}


export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  error?: boolean;
  recommendedFiles?: string[]; // Added to hold filenames for distinct widgets
  suggestedFollowUps?: string[]; // AI-generated follow-up question chips
  isStreaming?: boolean; // True while streaming is in progress
}

// Context Menu Types
export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  visible: boolean;
  onClose: () => void;
}

// For ActivityBar selection - github is now a tab, not a panel itself.
export type ActivityBarSelection = 
  | 'explorer' 
  | 'ai_chat_tab' 
  | 'search' 
  | 'articles' 
  | 'statistics' 
  | 'github_profile_view' 
  | 'guest_book_activity' 
  | 'source_control'      // New
  | 'extensions'          // New
  | null;


// For Global Search Results
export interface SearchResultItem {
  id:string;
  fileId: string;
  fileDisplayPath: string;
  lineNumber: number;
  lineContent: string;
  fullContent?: string;
  tabType: Tab['type'];
}

// For Articles/Blog from dev.to
export interface DevToUser {
  name: string;
  username: string;
  twitter_username: string | null;
  github_username: string | null;
  user_id: number;
  website_url: string | null;
  profile_image: string;
  profile_image_90: string;
}

export interface ArticleItem {
  type_of: string;
  id: number; // dev.to article ID
  title: string;
  description: string; // Used as summary
  readable_publish_date: string; // Used for display date
  slug: string;
  path: string;
  url: string;
  comments_count: number;
  public_reactions_count: number;
  collection_id: number | null;
  published_timestamp: string; // Main date for sorting/internal use
  positive_reactions_count: number;
  cover_image: string | null; // Used as imageUrl
  social_image: string;
  canonical_url: string;
  created_at: string;
  edited_at: string | null;
  crossposted_at: string | null;
  published_at: string;
  last_comment_at: string;
  reading_time_minutes: number;
  tag_list: string[]; // Used as tags
  tags: string; // Raw tags string
  body_markdown: string; // Used as contentMarkdown
  user: DevToUser;
  category?: string; // New field for categorization
}


// For Statistics Panel
export interface StatisticsData {
  app_loads?: { total?: number };
  tab_views?: { [tabId: string]: { count?: number } };
  action_counts?: {
    cv_downloads?: number;
    ai_project_suggestions?: number;
  };
  guestbook?: { total_entries?: number };
  theme_usage?: { [themeKey: string]: { count?: number } };
}

export interface StatisticsPanelProps {
  isVisible: boolean;
  statisticsData: StatisticsData | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  featureStatus: FeatureStatus;
}


// For reorderable Activity Bar items
export interface ActivityBarItemDefinition {
  id: string; // Unique ID for D&D, e.g., 'explorer-activity'
  label: string;
  iconName: string; // Key to ICONS map in constants.tsx
  viewId: ActivityBarSelection; // The view this item activates
  featureId?: FeatureId; // Associate with a feature for status checking
}

export interface ActivityBarItemConfig extends ActivityBarItemDefinition {
  icon: LucideIcon;
  action: () => void;
  status?: FeatureStatus; // Added for maintenance status
}

// For Notifications
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // in milliseconds, auto-dismiss if provided
  actions?: NotificationAction[];
  icon?: LucideIcon;
  isLoadingProgressBar?: boolean; // Optional: to show linear progress instead of spinner
  progressId?: string; // Optional: to identify and update progress notifications
}

// For content of projects.json
export interface ProjectListingItem {
  id: string;
  title: string;
  imageUrls?: string[];
  technologies?: string[]; // Added to display key tech on cards
}

// Editor Pane Types for Split View
export type EditorPaneId = 'left' | 'right';

export interface EditorPaneState {
  openTabs: Tab[];
  activeTabId: string | null;
  tabHistory: string[];
  currentHistoryIndex: number;
}

// Log Entry Types
export type LogLevel = 'info' | 'action' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string; // e.g., 'User', 'System', 'AI'
  details?: Record<string, any>; // Optional structured details
}

// For BottomPanelTabs
export type BottomPanelTabId = 'terminal' | 'pets' | 'logs' | 'guest_book_debug'; // Added guest_book_debug if needed for dev

// GitHub API Types
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepoOwner {
    login: string;
    avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  language: string | null; // Primary language
  languages_url: string; // URL to fetch detailed languages
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: GitHubRepoOwner;
  license: { name: string } | null;
  forks_count: number;
  open_issues_count: number;
}

export interface GitHubEventPayload {
  // Common payload types. Add more as needed.
  ref?: string; // For CreateEvent (branch/tag creation)
  ref_type?: 'repository' | 'branch' | 'tag';
  action?: string; // For IssuesEvent, PullRequestEvent, etc.
  issue?: { html_url: string; title: string; number: number };
  pull_request?: { html_url: string; title: string; number: number; merged?: boolean };
  comment?: { html_url: string; body: string };
  release?: { html_url: string; tag_name: string; name: string | null; body?: string | null; }; // Added body for release notes
  forkee?: { html_url: string; full_name: string }; // For ForkEvent
  pages?: [{ page_name: string; title: string; action: string; html_url: string }]; // For GollumEvent (wiki)
  commits?: Array<{ sha: string; author: { name: string }; message: string; url: string }>; // For PushEvent
  // Add other payload types as needed
  [key: string]: any; // For other potential payload properties
}


export interface GitHubEventActor {
  id: number;
  login: string;
  display_login?: string;
  gravatar_id: string;
  url: string;
  avatar_url: string;
}

export interface GitHubEvent {
  id: string;
  type: string; // e.g., "PushEvent", "CreateEvent", "IssuesEvent"
  actor: GitHubEventActor;
  repo: {
    id: number;
    name: string; // "owner/repo"
    url: string;
  };
  payload: GitHubEventPayload;
  public: boolean;
  created_at: string;
  org?: GitHubEventActor; // Optional, if event is in an organization
}

// Mock data for illustrative GitHub stats
export interface MockGitHubStats {
    totalContributionsLastYear: number;
    commitStreak: number;
    topLanguages: { name: string; percentage: number; color: string }[];
    // For the mock contribution graph (52 weeks, 7 days)
    contributionGraphData: number[][]; // Array of weeks, each week is an array of 7 day activity levels (0-4)
}
export interface GitHubProfileViewProps {
  username: string | undefined;
  mockStats: MockGitHubStats;
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void;
  featureStatus: FeatureStatus;
}


// Guest Book Types
export type AIValidationStatus = 'validated_ok' | 'validated_flagged' | 'validation_skipped' | 'validation_error' | 'pending';
export type ReactionsMap = { [emoji: string]: string[] }; // emoji string -> array of user IDs

export interface GuestBookEntry {
  id: string; // Firestore document ID
  userId: string;
  authProvider: 'google' | 'github';
  nickname: string; // User's display name
  avatarUrl?: string;
  githubLogin?: string; // GitHub username, if applicable
  message: string;
  timestamp: Date; // Converted from Firestore Timestamp client-side
  aiValidationStatus: AIValidationStatus;
  reactions: ReactionsMap;
  isNew?: boolean; // Client-side only, for spawn animation
}

export interface GuestBookViewProps {
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void;
  currentUser: FirebaseUser | null; // Add currentUser
  userGuestBookNickname: string | null; // Add custom nickname
  userGitHubUsername: string | null; // Add custom GitHub username
  featureStatus: FeatureStatus;
}

export interface GuestBookFormProps {
  currentUser: FirebaseUser | null;
  effectiveNickname: string; // New prop for displaying current posting name
  onSignIn: (provider: 'google' | 'github') => void;
  onSignOut: () => void;
  onSubmitMessage: (message: string) => Promise<void>;
  isSubmitting: boolean;
}

// For SettingsEditor
export interface SettingsEditorProps {
  isSoundMuted: boolean;
  handleToggleSoundMute: () => void;
  themes: Theme[];
  currentThemeName: string;
  onThemeChange: (themeName: string) => void;
  fontFamilies: FontFamilyOption[];
  currentFontFamilyId: string;
  onFontFamilyChange: (fontId: string) => void;
  editorFontSizes: FontSizeOption[];
  currentEditorFontSizeId: string;
  onEditorFontSizeChange: (sizeId: string) => void;
  terminalFontSizes: FontSizeOption[];
  currentTerminalFontSizeId: string;
  onTerminalFontSizeChange: (sizeId: string) => void;
  isDevModeEnabled: boolean; 
  onToggleDevMode: () => void; 
  currentUser: FirebaseUser | null;
  userGuestBookNickname: string | null;
  onUserGuestBookNicknameChange: (name: string) => void;
  userGitHubUsername: string | null;
  onUserGitHubUsernameChange: (username: string) => void;
  onSaveUserPreferences: () => void; 
  addNotificationAndLog: (message: string, type: NotificationType, duration?: number, actions?: NotificationAction[], icon?: LucideIcon) => void;
  onClearLocalStorage: () => void;
  featureStatus: FeatureStatus;
  // Theme Customization Props
  customColorOverrides: ThemeProperties; // Changed from CustomColorOverrides
  currentThemeBaseProperties: ThemeProperties;
  onApplyCustomColorOverride: (variableName: string, colorValue: string) => void;
  onSaveCustomThemeOverrides: () => void;
  onResetCustomThemeOverrides: () => void;
  onResetSingleColorOverride: (variableName: string) => void;
}

// Terminal Command Types
export interface TerminalCommandContext {
  // Data
  sidebarItems: SidebarItemConfig[];
  portfolioData: PortfolioData;
  themes: Theme[];
  currentThemeName: string;
  featuresStatus: FeaturesStatusState; // Added for command availability
  // Actions
  openTab: (itemOrConfig: SidebarItemConfig | { id?: string, fileName?: string, type?: Tab['type'], title?: string, articleSlug?: string, articleId?: number }, isRunAction?: boolean, targetPaneId?: EditorPaneId) => void;
  changeTheme: (themeName: string) => void;
  appendToOutput: (text: string | string[]) => void;
  clearOutput: () => void;
  runScript: (scriptName: string, durationMs?: number, customSteps?: string[]) => void;
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void;
  addNotification: (message: string, type: NotificationType, duration?: number, actions?: NotificationAction[], icon?: LucideIcon) => void; // For notifying about maintenance
}

export interface CommandDefinition {
  handler: (args: string[], context: TerminalCommandContext) => string | string[] | void;
  description: string;
  usage?: string; // e.g., "cat <filename>"
  featureId?: FeatureId; // Optional: Associate command with a feature
}


// Adding specific Lucide icons if they are not already part of the general LucideIcon type
export type { ImageIconType as ImageIcon, ExternalLinkIcon, LayoutPanelTop }; // Changed LayoutPanelBottom to LayoutPanelTop
// Re-export FirebaseUser for convenience if used in multiple UI components
// However, it's often cleaner for components to import directly from utils/firebase
// export type { FirebaseUser } from '../utils/firebase';

// Feature Status Types
export type FeatureId = 
  | 'explorer' 
  | 'searchPanel' 
  | 'aiChat' 
  | 'articlesPanel' 
  | 'guestBook' 
  | 'statisticsPanel' 
  | 'githubProfileView' 
  | 'terminal' 
  | 'petsPanel' 
  | 'logsPanel' 
  | 'settingsEditor'
  | 'cvGenerator'
  | 'projectSuggestions' // Added new AI project suggestion feature
  | 'projectsView' 
  | 'featureStatusAdminPanel'
  // New features (1 2 3)
  | 'sourceControl'
  | 'extensions'
  | 'achievements';

export type FeatureStatus = 'active' | 'maintenance' | 'disabled';
export type FeaturesStatusState = Record<FeatureId, FeatureStatus>;


// Panel-specific prop types with featureStatus
export interface ArticlesPanelProps {
  isVisible: boolean;
  articles: ArticleItem[];
  isLoading: boolean; 
  error: string | null; 
  onClose: () => void;
  onSelectArticle: (article: ArticleItem) => void;
  activeArticleSlug: string | null;
  onRetryFetch?: () => void; 
  featureStatus: FeatureStatus;
}

export interface PetsPanelProps {
  onClose: () => void; 
  featureStatus: FeatureStatus;
}

export interface TerminalPanelProps {
  output: string[];
  onClose: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onCommandSubmit: () => void;
  featureStatus: FeatureStatus;
}

export interface LogsPanelProps {
  logs: LogEntry[];
  onClose: () => void;
  featureStatus: FeatureStatus;
}

export interface SearchPanelProps {
  isVisible: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  results: SearchResultItem[];
  onResultClick: (result: SearchResultItem) => void;
  onClose: () => void; 
  featureStatus: FeatureStatus;
}

export interface AIChatInterfaceProps {
  portfolioData: PortfolioData;
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void;
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  error: string | null;
  apiKeyAvailable: boolean;
  onSendMessage: () => Promise<void>;
  handleOpenTab: (itemOrConfig: { id?: string, fileName?: string, type?: Tab['type'], title?: string, articleSlug?: string, githubUsername?: string }, isRunAction?: boolean, targetPaneId?: EditorPaneId) => void;
  currentPaneIdForChat: EditorPaneId; 
  featureStatus: FeatureStatus;
}

// Props for TabContent component
export interface TabContentProps {
  tab: Tab;
  content: any;
  portfolioData: PortfolioData;
  onOpenProjectTab: (projectId: string, projectTitle: string) => void;
  currentThemeName: string;
  onContextMenuRequest: (x: number, y: number, tabId: string, isCVContext?: boolean) => void;
  aiGeneratedProjects: ProjectDetail[];
  onSuggestNewAIProject: (userKeywords?: string) => void;
  isAISuggestingProject: boolean;
  paneId: EditorPaneId;
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void;
  featureStatusForProjectsView?: FeatureStatus; // Added for projects.json maintenance
  allArticles?: ArticleItem[]; // For article detail related view
  onOpenArticle?: (article: ArticleItem) => void; // For article details back/related navigation
  onCloseTab?: (tabId: string) => void; // For article details back navigation
  addNotificationAndLog?: (message: string, type: NotificationType, duration?: number, actions?: NotificationAction[], icon?: LucideIcon) => void; // For sharing toast/notif
}

// Props for FeatureStatusAdminPanel
export interface FeatureStatusAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatuses: FeaturesStatusState;
  onSaveChangesToFirebase: (newStatuses: FeaturesStatusState) => Promise<void>;
  allFeatureIds: Record<FeatureId, string>;
}
