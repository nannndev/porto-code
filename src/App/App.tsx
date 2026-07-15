

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FeatureStatusAdminPanel from '../features/Admin/FeatureStatusAdminPanel'; // Added import
import ArticlesPanel from '../features/articles/articlesPanel';
import CommandPalette from '../features/Commands/CommandPalette';
import TabContent from '../features/Editor/TabContent';
import WelcomeView from '../features/Editor/WelcomeView';
import LogsPanel from '../features/logs/logsPanel';
import AboutModal from '../features/Modals/AboutModal';
import PasskeyPromptModal from '../features/Modals/PasskeyPromptModal';
import ProfilePopup from '../features/Modals/ProfilePopup';
import NotificationContainer from '../features/Notifications/NotificationContainer';
import PetsPanel from '../features/Pets/PetsPanel';
import SearchPanel from '../features/Search/SearchPanel';
import StatisticsPanel from '../features/Statistics/StatisticsPanel';
import TerminalPanel from '../features/Terminal/TerminalPanel';
import SourceControlPanel from '../features/SourceControl/SourceControlPanel';
import SupportView from '../features/Modals/SupportView';
import ActivityBar from '../Layout/ActivityBar/ActivityBar';
import BottomPanelTabs from '../Layout/BottomPanelTabs/BottomPanelTabs';
import Breadcrumbs from '../Layout/Breadcrumbs/Breadcrumbs';
import EditorTabs from '../Layout/EditorTabs/EditorTabs';
import { Sidebar } from '../Layout/Sidebar/Sidebar';
import StatusBar from '../Layout/StatusBar/StatusBar';
import { TitleBar } from '../Layout/TitleBar/TitleBar';
import ContextMenu from '../UI/ContextMenu/ContextMenu';
import MaintenanceView from '../UI/MaintenanceView';
import { ALL_FEATURE_IDS, APP_VERSION, DEFAULT_ACTIVITY_BAR_ITEMS, DEFAULT_FEATURE_STATUSES, SIDEBAR_ITEMS as DEFAULT_SIDEBAR_ITEMS, generateFileContent, generateProjectDetailContent, ICONS, MAX_LOG_ENTRIES, MOCK_GITHUB_STATS, PORTFOLIO_DATA } from './constants'; // Added STATISTICS_FIREBASE_PATH
import { DEFAULT_FONT_FAMILY_ID, DEFAULT_FONT_SIZE_ID, DEFAULT_TERMINAL_FONT_SIZE_ID, DEFAULT_THEME_NAME, FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, PREDEFINED_THEMES, TERMINAL_FONT_SIZE_OPTIONS } from './themes';
import { ActivityBarItemConfig, ActivityBarItemDefinition, ActivityBarSelection, AIChatInterfaceProps, ArticleItem, BottomPanelTabId, ContextMenuItem, EditorPaneId, EditorPaneState, FeatureId, FeaturesStatusState, LogEntry, LogLevel, NotificationType, ProjectDetail, SearchResultItem, SettingsEditorProps, SidebarItemConfig, StatisticsData, Tab, TabContentProps, TerminalCommandContext } from './types'; // Added StatisticsData, StatisticsPanelProps


import { useDevToArticles } from '../Hooks/useDevToArticles';
import { useFullscreen } from '../Hooks/useFullscreen';
import { useGeminiChat } from '../Hooks/useGeminiChat';
import { useGlobalEventHandlers } from '../Hooks/useGlobalEventHandlers';
import { useNotifications } from '../Hooks/useNotifications';
import { useThemeManager } from '../Hooks/useThemeManager';
import { fetchAIProjectSuggestion } from '../Utils/aiUtils';
import { getMuteStatus, playSound, toggleMute } from '../Utils/audioUtils';
import { generateCommands } from '../Utils/commandUtils';
import { createCV_PDF } from '../Utils/cvGenerator';
import { auth, database, set as firebaseSet, FirebaseUser, onAuthStateChanged, onValue, ref } from '../Utils/firebase'; // Added firebaseSet
import { fetchStatistics, incrementStatistic } from '../Utils/statisticsUtils'; // Added statistics utils
import { processCommand } from '../Utils/terminalCommands';
import SpotifyView from '../features/Spotify/SpotifyView';
import NowPlayingWidget from '../features/Spotify/NowPlayingWidget';
import { handleSpotifyCallback, isSpotifyAuthenticated } from '../Utils/spotifyUtils';



const DEFAULT_LEFT_PANEL_WIDTH = 256;
const MIN_LEFT_PANEL_WIDTH = 150;
const MAX_LEFT_PANEL_WIDTH = 600;

const DEFAULT_BOTTOM_PANEL_HEIGHT = 200;
const MIN_BOTTOM_PANEL_HEIGHT = 75;
const MAX_BOTTOM_PANEL_HEIGHT = 600;

const DEFAULT_EDITOR_SPLIT_PERCENTAGE = 50;

const DEV_TO_USERNAME = "ben"; 
const ARTICLES_LOADING_NOTIFICATION_ID = 'articles-loading-notification';


const initialPaneState: EditorPaneState = {
  openTabs: [],
  activeTabId: null,
  tabHistory: [],
  currentHistoryIndex: -1,
};

const App: React.FC = () => {
  const [currentTerminalFontSizeId, setCurrentTerminalFontSizeId] = useState<string>(() => localStorage.getItem('portfolio-terminal-font-size') || DEFAULT_TERMINAL_FONT_SIZE_ID);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const notificationsHook = useNotifications();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isInitialProfileLoading, setIsInitialProfileLoading] = useState(true); 


  // New state for user preferences
  const [userGuestBookNickname, setUserGuestBookNickname] = useState<string | null>(() => localStorage.getItem('portfolio-guestbook-nickname'));
  const [userGitHubUsername, setUserGitHubUsername] = useState<string | null>(() => localStorage.getItem('portfolio-guestbook-github-username'));

  const initialEffectHasRun = useRef(false); 
  const initialLoadNotificationIdRef = useRef<string | null>(null); 

  // Feature Status State
  const [featuresStatus, setFeaturesStatus] = useState<FeaturesStatusState>(DEFAULT_FEATURE_STATUSES);
  const [isFetchingFeatureStatus, setIsFetchingFeatureStatus] = useState(true);
  const [isFeatureStatusAdminPanelOpen, setIsFeatureStatusAdminPanelOpen] = useState(false); // New state

  // Statistics State
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(true);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);


  const addAppLog = useCallback((level: LogLevel, message: string, source?: string, details?: Record<string, any>) => {
    setLogs(prevLogs => {
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        message,
        source: source || 'System',
        details,
      };
      const updatedLogs = [...prevLogs, newLog]; 
      if (updatedLogs.length > MAX_LOG_ENTRIES) {
        return updatedLogs.slice(-MAX_LOG_ENTRIES); 
      }
      return updatedLogs;
    });
  }, []);

  const { 
    articles: devToArticles, 
    isLoading: articlesLoading, 
    error: articlesError,
    fetchArticles: triggerFetchDevToArticles 
  } = useDevToArticles(DEV_TO_USERNAME, addAppLog);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Handle Spotify OAuth callback (PKCE flow redirects back with ?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleSpotifyCallback(code).then((success) => {
        if (success) {
          addAppLog('info', 'Spotify authentication successful.', 'Spotify');
          // Open the Spotify tab automatically after login
          handleOpenTab({ id: 'spotify_view', type: 'spotify_view', title: '🎵 Spotify' });
        } else {
          addAppLog('error', 'Spotify authentication failed.', 'Spotify');
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch feature statuses from Firebase Realtime Database
  useEffect(() => {
    setIsFetchingFeatureStatus(true);
    addAppLog('info', 'Attempting to fetch feature statuses from Firebase Realtime Database...', 'FeatureStatus');
    
    const featureStatusesRef = ref(database, 'feature_statuses');
    const unsubscribe = onValue(featureStatusesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedStatuses: Partial<FeaturesStatusState> = {};
        let allKnownKeysValid = true;
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(ALL_FEATURE_IDS, key) && 
              (data[key] === 'active' || data[key] === 'maintenance' || data[key] === 'disabled')) {
            fetchedStatuses[key as FeatureId] = data[key];
          } else {
            allKnownKeysValid = false;
            addAppLog('warning', `Invalid feature ID or status found in Firebase: ${key}=${data[key]}`, 'FeatureStatus');
          }
        }
        if (allKnownKeysValid && Object.keys(fetchedStatuses).length > 0) {
            const newStatuses = { ...DEFAULT_FEATURE_STATUSES, ...fetchedStatuses };
            setFeaturesStatus(newStatuses);
            addAppLog('info', 'Feature statuses fetched and applied from Firebase.', 'FeatureStatus', { statuses: newStatuses });
        } else if (Object.keys(fetchedStatuses).length === 0 && !allKnownKeysValid) {
             addAppLog('warning', 'No valid feature statuses found in Firebase. Using defaults.', 'FeatureStatus');
             setFeaturesStatus(DEFAULT_FEATURE_STATUSES);
        } else if (Object.keys(fetchedStatuses).length > 0 && !allKnownKeysValid) {
            const newStatuses = { ...DEFAULT_FEATURE_STATUSES, ...fetchedStatuses }; // Use valid ones, defaults for others
            setFeaturesStatus(newStatuses);
            addAppLog('warning', 'Some invalid feature statuses found in Firebase. Applied valid ones and defaults.', 'FeatureStatus', { statuses: newStatuses });
        } else {
             addAppLog('warning', 'Feature statuses path exists in Firebase but is empty or contains no valid data. Using defaults.', 'FeatureStatus');
             setFeaturesStatus(DEFAULT_FEATURE_STATUSES);
        }

      } else {
        addAppLog('warning', 'No feature statuses found in Firebase Realtime Database. Using default statuses.', 'FeatureStatus');
        setFeaturesStatus(DEFAULT_FEATURE_STATUSES);
      }
      setIsFetchingFeatureStatus(false);
    }, (error) => {
      console.error("Error fetching feature statuses from Firebase:", error);
      addAppLog('error', 'Error fetching feature statuses from Firebase. Using default statuses.', 'FeatureStatus', { error });
      setFeaturesStatus(DEFAULT_FEATURE_STATUSES);
      setIsFetchingFeatureStatus(false);
    });

    return () => unsubscribe(); 
  }, [addAppLog]);

  // Initial app load statistics and fetch
  useEffect(() => {
    incrementStatistic('app_loads/total');
    const loadStats = async () => {
      setIsLoadingStatistics(true);
      setStatisticsError(null);
      const data = await fetchStatistics();
      if (data) {
        setStatisticsData(data);
        addAppLog('info', 'Statistics data fetched.', 'Statistics');
      } else {
        setStatisticsError('Failed to load statistics data.');
        addAppLog('error', 'Failed to fetch statistics data.', 'Statistics');
      }
      setIsLoadingStatistics(false);
    };
    loadStats();
  }, [addAppLog]);


  const handleUserGuestBookNicknameChange = (name: string) => {
    setUserGuestBookNickname(name);
    localStorage.setItem('portfolio-guestbook-nickname', name);
  };

  const handleUserGitHubUsernameChange = (username: string) => {
    setUserGitHubUsername(username);
    localStorage.setItem('portfolio-guestbook-github-username', username);
  };

  const handleSaveUserPreferences = () => {
    addNotificationAndLog("Guest Book preferences saved!", 'success', 3000);
  };


  
  const {
    messages: chatMessages,
    setMessages: setChatMessages, 
    input: chatInput,
    setInput: setChatInput,
    isLoading: chatIsLoading,
    error: chatError,
    apiKeyAvailable: chatApiKeyAvailable,
    handleSendMessage: handleChatSendMessage,
  } = useGeminiChat(PORTFOLIO_DATA, addAppLog);


  const {
    currentThemeName,
    currentFontFamilyId,
    currentFontSizeId: currentEditorFontSizeId,
    handleThemeChange: rawHandleThemeChange,
    handleFontFamilyChange: rawHandleFontFamilyChange,
    handleFontSizeChange: rawHandleEditorFontSizeChange,
    customColorOverrides, // Theme customization prop
    currentThemeBaseProperties, // Theme customization prop
    applyCustomColorOverride, // Theme customization function
    saveCustomThemeOverrides, // Theme customization function
    resetCustomThemeOverrides, // Theme customization function
    resetSingleColorOverride, // Theme customization function
  } = useThemeManager(
    DEFAULT_THEME_NAME,
    DEFAULT_FONT_FAMILY_ID,
    DEFAULT_FONT_SIZE_ID,
    currentTerminalFontSizeId,
    TERMINAL_FONT_SIZE_OPTIONS,
    addAppLog // Pass addAppLog for theme change statistics
  );

  const [editorPanes, setEditorPanes] = useState<Record<EditorPaneId, EditorPaneState>>(() => {
    const saved = localStorage.getItem('portfolio-editorPanes');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsePane = (p: Partial<EditorPaneState> | undefined): EditorPaneState => ({
            ...initialPaneState,
            ...(p || {}),
            openTabs: p?.openTabs || initialPaneState.openTabs,
            activeTabId: p?.activeTabId || initialPaneState.activeTabId,
            tabHistory: p?.tabHistory || initialPaneState.tabHistory,
            currentHistoryIndex: p?.currentHistoryIndex ?? initialPaneState.currentHistoryIndex,
        });
        return {
          left: parsePane(parsed.left),
          right: parsePane(parsed.right),
        };
      }
    } catch (e) { console.error("Failed to parse saved editorPanes state:", e); addAppLog('error', 'Failed to parse saved editor panes state from localStorage.', 'System', { error: e });}
    return { left: { ...initialPaneState }, right: { ...initialPaneState } };
  });

  const [focusedEditorPaneId, setFocusedEditorPaneId] = useState<EditorPaneId>(() => (localStorage.getItem('portfolio-focusedEditorPaneId') as EditorPaneId) || 'left');
  const [isRightEditorPaneVisible, setIsRightEditorPaneVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isRightEditorPaneVisible') === 'true' || false);
  const [editorSplitPercentage, setEditorSplitPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('portfolio-editorSplitPercentage');
    return saved ? parseInt(saved, 10) : DEFAULT_EDITOR_SPLIT_PERCENTAGE;
  });

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isSidebarVisible') === 'true' || false);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isSearchPanelVisible') === 'true' || false);
  const [isArticlesPanelVisible, setIsArticlesPanelVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isArticlesPanelVisible') === 'true' || false);
  const [isStatisticsPanelVisible, setIsStatisticsPanelVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isStatisticsPanelVisible') === 'true' || false);
  const [isSourceControlVisible, setIsSourceControlVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isSourceControlVisible') === 'true' || false);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => { const saved = localStorage.getItem('portfolio-leftPanelWidth'); return saved ? parseInt(saved, 10) : DEFAULT_LEFT_PANEL_WIDTH; });
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(() => { const saved = localStorage.getItem('portfolio-bottomPanelHeight'); return saved ? parseInt(saved, 10) : DEFAULT_BOTTOM_PANEL_HEIGHT; });
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [activityBarSelection, setActivityBarSelection] = useState<ActivityBarSelection>(null);
  const [orderedSidebarItems, setOrderedSidebarItems] = useState<SidebarItemConfig[]>(() => { const savedOrderRaw = localStorage.getItem('portfolio-sidebarItemOrder'); if (savedOrderRaw) { try { return [...DEFAULT_SIDEBAR_ITEMS]; } catch (e) { addAppLog('error', 'Failed to parse sidebar item order from localStorage.', 'System', { error: e }); return [...DEFAULT_SIDEBAR_ITEMS]; } } return [...DEFAULT_SIDEBAR_ITEMS]; });
  const [orderedActivityBarItemDefinitions, setOrderedActivityBarItemDefinitions] = useState<ActivityBarItemDefinition[]>(() => { const savedOrder = localStorage.getItem('portfolio-activityBarOrder'); if (savedOrder) { try { const ids: string[] = JSON.parse(savedOrder); const itemsFromStorage: ActivityBarItemDefinition[] = []; const defaultItemsMap = new Map(DEFAULT_ACTIVITY_BAR_ITEMS.map(item => [item.id, item])); ids.forEach(id => { if (defaultItemsMap.has(id)) { itemsFromStorage.push(defaultItemsMap.get(id)!); defaultItemsMap.delete(id); } }); defaultItemsMap.forEach(newItem => itemsFromStorage.push(newItem)); return itemsFromStorage; } catch (e) { addAppLog('error', 'Failed to parse activity bar order from localStorage.', 'System', { error: e }); return [...DEFAULT_ACTIVITY_BAR_ITEMS]; } } return [...DEFAULT_ACTIVITY_BAR_ITEMS]; });

  const { isFullscreen, handleToggleFullscreen: rawHandleToggleFullscreen } = useFullscreen();
  const { addNotification: rawAddNotification, removeNotification: rawRemoveNotification } = notificationsHook;

  const addNotificationAndLog = useCallback((
    message: string, 
    type: NotificationType, 
    duration?: number, 
    actions?: { label: string; onClick: () => void; }[], 
    icon?: any,
    isLoadingProgressBar?: boolean, 
    progressId?: string 
  ) => {
      rawAddNotification(message, type, duration, actions, icon, isLoadingProgressBar, progressId);
      let logLevel: LogLevel = 'info';
      if (type === 'error') logLevel = 'error';
      else if (type === 'warning') logLevel = 'warning';
      else if (type === 'success') logLevel = 'info'; 
      addAppLog(logLevel, `Notification shown: "${message}"`, 'SystemUI', { notificationType: type, duration, actions: actions?.map(a => a.label) });
  }, [rawAddNotification, addAppLog]);


  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPasskeyPromptOpen, setIsPasskeyPromptOpen] = useState(false); 
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false); 
  const [profilePopupAnchorEl, setProfilePopupAnchorEl] = useState<HTMLElement | null>(null); 

  const [editorContextMenuState, setEditorContextMenuState] = useState<{ x: number; y: number; items: ContextMenuItem[]; visible: boolean; tabId?: string, paneId?: EditorPaneId }>({ x: 0, y: 0, items: [], visible: false });
  const [sidebarContextMenuState, setSidebarContextMenuState] = useState<{ x: number; y: number; items: ContextMenuItem[]; visible: boolean; itemId?: string }>({ x: 0, y: 0, items: [], visible: false });
  const [isPreviewTabLoading, setIsPreviewTabLoading] = useState(false);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  const [isBottomPanelVisible, setIsBottomPanelVisible] = useState<boolean>(() => localStorage.getItem('portfolio-isBottomPanelVisible') === 'true' || false);
  const [activeBottomPanelId, setActiveBottomPanelId] = useState<BottomPanelTabId>(() => (localStorage.getItem('portfolio-activeBottomPanelId') as BottomPanelTabId | null) || 'terminal');
  
  // Terminal State
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInputValue, setTerminalInputValue] = useState('');
  const terminalAnimationIntervalRef = useRef<number | null>(null);


  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(getMuteStatus());
  const [aiGeneratedProjects, setAiGeneratedProjects] = useState<ProjectDetail[]>([]);
  const [isAISuggestingProject, setIsAISuggestingProject] = useState(false);
  const appLoadTimeRef = useRef<Date>(new Date());
  const isLeftPanelResizing = useRef(false);
  const isBottomPanelResizing = useRef(false);
  const isEditorResizing = useRef(false);
  
  const leftPanelContainerRef = useRef<HTMLDivElement>(null); 
  const leftResizerRef = useRef<HTMLDivElement>(null); 

  const bottomResizerRef = useRef<HTMLDivElement>(null);
  const editorResizerRef = useRef<HTMLDivElement>(null);
  const [isDevModeEnabled, setIsDevModeEnabled] = useState<boolean>(() => localStorage.getItem('portfolio-isDevModeEnabled') === 'true' || false);


  useEffect(() => { localStorage.setItem('portfolio-editorPanes', JSON.stringify(editorPanes)); }, [editorPanes]);
  useEffect(() => { localStorage.setItem('portfolio-focusedEditorPaneId', focusedEditorPaneId); }, [focusedEditorPaneId]);
  useEffect(() => { localStorage.setItem('portfolio-isRightEditorPaneVisible', String(isRightEditorPaneVisible)); }, [isRightEditorPaneVisible]);
  useEffect(() => { localStorage.setItem('portfolio-editorSplitPercentage', String(editorSplitPercentage)); }, [editorSplitPercentage]);
  useEffect(() => { localStorage.setItem('portfolio-isDevModeEnabled', String(isDevModeEnabled)); }, [isDevModeEnabled]);


  useEffect(() => { localStorage.setItem('portfolio-isSidebarVisible', String(isSidebarVisible)); }, [isSidebarVisible]);
  useEffect(() => { localStorage.setItem('portfolio-isSearchPanelVisible', String(isSearchPanelVisible)); }, [isSearchPanelVisible]);
  useEffect(() => { localStorage.setItem('portfolio-isArticlesPanelVisible', String(isArticlesPanelVisible)); }, [isArticlesPanelVisible]);
  useEffect(() => { localStorage.setItem('portfolio-isStatisticsPanelVisible', String(isStatisticsPanelVisible)); }, [isStatisticsPanelVisible]);
  useEffect(() => { localStorage.setItem('portfolio-isSourceControlVisible', String(isSourceControlVisible)); }, [isSourceControlVisible]);
  useEffect(() => { localStorage.setItem('portfolio-leftPanelWidth', String(leftPanelWidth)); }, [leftPanelWidth]);
  useEffect(() => { localStorage.setItem('portfolio-bottomPanelHeight', String(bottomPanelHeight)); }, [bottomPanelHeight]);
  useEffect(() => { localStorage.setItem('portfolio-isBottomPanelVisible', String(isBottomPanelVisible)); }, [isBottomPanelVisible]);
  useEffect(() => { localStorage.setItem('portfolio-activeBottomPanelId', activeBottomPanelId); }, [activeBottomPanelId]);
  useEffect(() => { localStorage.setItem('portfolio-activityBarOrder', JSON.stringify(orderedActivityBarItemDefinitions.map(item => item.id)));}, [orderedActivityBarItemDefinitions]);
  useEffect(() => { localStorage.setItem('portfolio-terminal-font-size', currentTerminalFontSizeId); }, [currentTerminalFontSizeId]);

  const updateTabHistoryOnActivation = useCallback((paneId: EditorPaneId, newActiveTabId: string | null) => {
    setEditorPanes(prevPanes => {
      const pane = prevPanes[paneId];
      if (newActiveTabId === null) return prevPanes;

      const newHistoryBase = pane.tabHistory.slice(0, pane.currentHistoryIndex + 1);
      if (newHistoryBase[newHistoryBase.length - 1] !== newActiveTabId) {
        newHistoryBase.push(newActiveTabId);
      }
      return {
        ...prevPanes,
        [paneId]: {
          ...pane,
          tabHistory: newHistoryBase,
          currentHistoryIndex: newHistoryBase.length - 1,
        },
      };
    });
  }, []);

  const cleanTabHistoryOnClose = useCallback((paneId: EditorPaneId, closedTabId: string, newActiveTabIdForPane: string | null) => {
    setEditorPanes(prevPanes => {
      const pane = prevPanes[paneId];
      const filteredHistory = pane.tabHistory.filter(id => id !== closedTabId);
      let newIndex = -1;
      if (newActiveTabIdForPane) {
        newIndex = filteredHistory.indexOf(newActiveTabIdForPane);
        if (newIndex === -1 && filteredHistory.length > 0) newIndex = filteredHistory.length - 1;
      } else if (filteredHistory.length > 0) {
        newIndex = filteredHistory.length - 1;
      }
      return {
        ...prevPanes,
        [paneId]: { ...pane, tabHistory: filteredHistory, currentHistoryIndex: newIndex },
      };
    });
  }, []);

  const navigateTabHistoryBack = useCallback((paneId: EditorPaneId) => {
    setEditorPanes(prevPanes => {
      const pane = prevPanes[paneId];
      if (pane.currentHistoryIndex > 0) {
        const newIndex = pane.currentHistoryIndex - 1;
        addAppLog('action', `Navigated back in tab history in ${paneId} pane. New active tab: ${pane.tabHistory[newIndex]}.`, 'User');
        return {
          ...prevPanes,
          [paneId]: { ...pane, activeTabId: pane.tabHistory[newIndex], currentHistoryIndex: newIndex },
        };
      }
      return prevPanes;
    });
    playSound('ui-click');
  }, [addAppLog]);

  const navigateTabHistoryForward = useCallback((paneId: EditorPaneId) => {
    setEditorPanes(prevPanes => {
      const pane = prevPanes[paneId];
      if (pane.currentHistoryIndex < pane.tabHistory.length - 1) {
        const newIndex = pane.currentHistoryIndex + 1;
        addAppLog('action', `Navigated forward in tab history in ${paneId} pane. New active tab: ${pane.tabHistory[newIndex]}.`, 'User');
        return {
          ...prevPanes,
          [paneId]: { ...pane, activeTabId: pane.tabHistory[newIndex], currentHistoryIndex: newIndex },
        };
      }
      return prevPanes;
    });
    playSound('ui-click');
  }, [addAppLog]);

  const setActiveTabIdForPane = useCallback((paneId: EditorPaneId, tabId: string | null) => {
    setEditorPanes(prevPanes => ({
      ...prevPanes,
      [paneId]: { ...prevPanes[paneId], activeTabId: tabId }
    }));
    if (tabId) {
        addAppLog('action', `Selected tab: ${tabId} in ${paneId} pane.`, 'User');
        updateTabHistoryOnActivation(paneId, tabId);
    }
  }, [updateTabHistoryOnActivation, addAppLog]);

  const handleLeftPanelDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isLeftPanelResizing.current || !leftPanelContainerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const mainLeft = leftPanelContainerRef.current.getBoundingClientRect().left;
    const newWidth = clientX - mainLeft;
    setLeftPanelWidth(Math.max(MIN_LEFT_PANEL_WIDTH, Math.min(newWidth, MAX_LEFT_PANEL_WIDTH)));
  }, []);

  const handleLeftPanelResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => { isLeftPanelResizing.current = true; document.body.style.cursor = 'col-resize'; document.addEventListener('mousemove', handleLeftPanelDragging); document.addEventListener('mouseup', handleLeftPanelResizeEnd); document.addEventListener('touchmove', handleLeftPanelDragging as any); document.addEventListener('touchend', handleLeftPanelResizeEnd as any);}, [handleLeftPanelDragging]);
  const handleLeftPanelResizeEnd = useCallback(() => { isLeftPanelResizing.current = false; document.body.style.cursor = 'default'; document.removeEventListener('mousemove', handleLeftPanelDragging); document.removeEventListener('mouseup', handleLeftPanelResizeEnd); document.removeEventListener('touchmove', handleLeftPanelDragging as any); document.removeEventListener('touchend', handleLeftPanelResizeEnd as any); addAppLog('debug', `Resized left panel to ${leftPanelWidth}px.`, 'User') }, [addAppLog, leftPanelWidth, handleLeftPanelDragging]);
  
  const handleBottomPanelResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => { isBottomPanelResizing.current = true; document.body.style.cursor = 'row-resize'; document.addEventListener('mousemove', handleBottomPanelDragging); document.addEventListener('mouseup', handleBottomPanelResizeEnd); document.addEventListener('touchmove', handleBottomPanelDragging as any); document.addEventListener('touchend', handleBottomPanelResizeEnd as any); }, []);
  const handleBottomPanelDragging = useCallback((e: MouseEvent | TouchEvent) => { if (!isBottomPanelResizing.current) return; const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY; const newHeight = window.innerHeight - clientY - (bottomResizerRef.current?.parentElement?.querySelector('footer')?.offsetHeight || 0); setBottomPanelHeight(Math.max(MIN_BOTTOM_PANEL_HEIGHT, Math.min(newHeight, MAX_BOTTOM_PANEL_HEIGHT))); }, []);
  const handleBottomPanelResizeEnd = useCallback(() => { isBottomPanelResizing.current = false; document.body.style.cursor = 'default'; document.removeEventListener('mousemove', handleBottomPanelDragging); document.removeEventListener('mouseup', handleBottomPanelResizeEnd); document.removeEventListener('touchmove', handleBottomPanelDragging as any); document.removeEventListener('touchend', handleBottomPanelResizeEnd as any); addAppLog('debug', `Resized bottom panel to ${bottomPanelHeight}px.`, 'User')}, [addAppLog, bottomPanelHeight]);

  const handleEditorResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isEditorResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleEditorDragging);
    document.addEventListener('mouseup', handleEditorResizeEnd);
    document.addEventListener('touchmove', handleEditorDragging as any);
    document.addEventListener('touchend', handleEditorResizeEnd as any);
  }, []);

  const handleEditorDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isEditorResizing.current || !editorResizerRef.current?.parentElement) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const parentRect = editorResizerRef.current.parentElement.getBoundingClientRect();
    const newLeftWidth = clientX - parentRect.left;
    const newPercentage = (newLeftWidth / parentRect.width) * 100;
    setEditorSplitPercentage(Math.max(10, Math.min(newPercentage, 90)));
  }, []);

  const handleEditorResizeEnd = useCallback(() => {
    isEditorResizing.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleEditorDragging);
    document.removeEventListener('mouseup', handleEditorResizeEnd);
    document.removeEventListener('touchmove', handleEditorDragging as any);
    document.removeEventListener('touchend', handleEditorResizeEnd as any);
    addAppLog('debug', `Resized editor split to ${editorSplitPercentage.toFixed(1)}%.`, 'User');
  }, [addAppLog, editorSplitPercentage]);

  const handleToggleSoundMute = useCallback(() => { const newMuteStatus = toggleMute(); setIsSoundMuted(newMuteStatus); addAppLog('action', `Sound effects ${newMuteStatus ? 'muted' : 'unmuted'}.`, 'User'); }, [addAppLog]);

  const currentActiveTabForFocusedPane = useMemo(() => editorPanes[focusedEditorPaneId].openTabs.find(tab => tab.id === editorPanes[focusedEditorPaneId].activeTabId), [editorPanes, focusedEditorPaneId]);

  useEffect(() => {
    document.title = currentActiveTabForFocusedPane ? `${currentActiveTabForFocusedPane.title} - ${PORTFOLIO_DATA.name} | PORTO CODE` : `PORTO CODE - ${PORTFOLIO_DATA.name}`;
  }, [currentActiveTabForFocusedPane, PORTFOLIO_DATA.name]);

  useEffect(() => {
    const currentTab = currentActiveTabForFocusedPane;
    if (currentTab?.type === 'article_detail') setActivityBarSelection('articles');
    else if (currentTab?.type === 'ai_chat') setActivityBarSelection('ai_chat_tab');
    else if (currentTab?.type === 'github_profile_view') setActivityBarSelection('github_profile_view');
    else if (currentTab?.type === 'guest_book') setActivityBarSelection('guest_book_activity');
    else if (isStatisticsPanelVisible) setActivityBarSelection('statistics');
    else if (isSourceControlVisible) setActivityBarSelection('source_control');
    else if (isArticlesPanelVisible) setActivityBarSelection('articles');
    else if (isSearchPanelVisible) setActivityBarSelection('search');
    else if (isSidebarVisible) setActivityBarSelection('explorer');
    else setActivityBarSelection(null);
  }, [currentActiveTabForFocusedPane, isSidebarVisible, isSearchPanelVisible, isArticlesPanelVisible, isStatisticsPanelVisible, isSourceControlVisible]);

  const appendToTerminalOutput = useCallback((text: string | string[]) => {
    const linesToAdd = Array.isArray(text) ? text : [text];
    setTerminalOutput(prev => {
        const newOutput = [...prev, ...linesToAdd];
        return newOutput.length > 200 ? newOutput.slice(newOutput.length - 200) : newOutput;
    });
  }, []);
  const clearTerminalOutput = useCallback(() => setTerminalOutput([]), []);
  
  useEffect(() => {
    if (!initialEffectHasRun.current) {
      const randomUserId = Math.floor(Math.random() * 9000) + 1000;
      
      addAppLog('info', 'Application one-time initialization started.', 'SystemInit', { version: APP_VERSION });
      appendToTerminalOutput("Initializing PORTO CODE environment...");

      if (!initialLoadNotificationIdRef.current) {
        initialLoadNotificationIdRef.current = `initial-load-${crypto.randomUUID()}`;
      }
      const currentInitialNotifId = initialLoadNotificationIdRef.current;

      rawAddNotification(
        "Fetching profile data...",
        'info',
        0, 
        undefined,
        ICONS.Info,
        true, 
        currentInitialNotifId
      );
      addAppLog('info', `Notification Pushed: Fetching profile data... (ID: ${currentInitialNotifId})`, 'SystemUI');

      setTimeout(() => {
        if (currentInitialNotifId) {
          rawRemoveNotification(currentInitialNotifId);
        }
        rawAddNotification(
          "Profile data loaded successfully!",
          'success',
          3000, 
          undefined,
          ICONS.CheckCircle2 
        );
        addAppLog('info', 'Notification Pushed: Profile data loaded successfully!', 'SystemUI');
        
        setIsInitialProfileLoading(false); 
        
        appendToTerminalOutput(`🐾 New session started. Virtual companion 'CodeCat_${randomUserId}' assigned.`);
        appendToTerminalOutput(`Welcome, User #${randomUserId}! Type 'help' for commands.`);
        addAppLog('info', `New session for User #${randomUserId}. Companion: CodeCat_${randomUserId}.`, 'SystemSession');
      }, 2500);

      initialEffectHasRun.current = true;
    }
  }, [addAppLog, appendToTerminalOutput, rawAddNotification, rawRemoveNotification, setIsInitialProfileLoading, APP_VERSION, ICONS.Info, ICONS.CheckCircle2]);


  const simulateTerminalRun = useCallback((commandName: string, durationMs: number = 2000, customSteps?: string[]) => { if (terminalAnimationIntervalRef.current) clearInterval(terminalAnimationIntervalRef.current); playSound('terminal-run'); setIsBottomPanelVisible(true); setActiveBottomPanelId('terminal'); appendToTerminalOutput(`> Running ${commandName}...`); addAppLog('action', `Terminal command started: ${commandName}.`, 'System'); if (customSteps && customSteps.length > 0) { let stepIndex = 0; const stepDuration = durationMs / customSteps.length; terminalAnimationIntervalRef.current = window.setInterval(() => { if (stepIndex < customSteps.length) { appendToTerminalOutput(customSteps[stepIndex]); stepIndex++; } if (stepIndex >= customSteps.length) { if (terminalAnimationIntervalRef.current) clearInterval(terminalAnimationIntervalRef.current); terminalAnimationIntervalRef.current = null; appendToTerminalOutput(`${commandName} finished successfully.`); playSound('terminal-complete'); addAppLog('info', `Terminal command finished: ${commandName}.`, 'System'); } }, stepDuration); } else { let dots = 0; const maxDots = 3; const animationSteps = durationMs / 500; let currentStep = 0; terminalAnimationIntervalRef.current = window.setInterval(() => { dots = (dots + 1) % (maxDots + 1); appendToTerminalOutput(`Processing${'.'.repeat(dots)}`); currentStep++; if (currentStep >= animationSteps) { if (terminalAnimationIntervalRef.current) clearInterval(terminalAnimationIntervalRef.current); terminalAnimationIntervalRef.current = null; appendToTerminalOutput(`${commandName} finished successfully.`); playSound('terminal-complete'); addAppLog('info', `Terminal command finished: ${commandName}.`, 'System'); } }, 500); } }, [appendToTerminalOutput, addAppLog]);

  const handleOpenTab = useCallback((itemOrConfig: SidebarItemConfig | { id?: string, fileName?: string, type?: Tab['type'], title?: string, articleSlug?: string, articleId?: number, githubUsername?: string }, isRunAction: boolean = false, targetPaneId: EditorPaneId = focusedEditorPaneId) => {
    if ('isFolder' in itemOrConfig && itemOrConfig.isFolder) return;

    let idToOpen: string, tabTitle: string, tabType: Tab['type'], tabFileName: string | undefined, tabArticleSlug: string | undefined, tabArticleId: number | undefined, tabGitHubUsername: string | undefined;
    let featureIdForTab: FeatureId | undefined;
    
    if ('icon' in itemOrConfig && 'label' in itemOrConfig) { 
      const config = itemOrConfig as SidebarItemConfig;
      idToOpen = config.id; tabTitle = config.title || config.fileName || config.label; tabType = config.type || 'file'; tabFileName = config.fileName;
      featureIdForTab = config.featureId;
    } else { 
      const config = itemOrConfig as { id?: string, fileName?: string, type?: Tab['type'], title?: string, articleSlug?: string, articleId?: number, githubUsername?: string };
      idToOpen = config.id || config.fileName || (config.type === 'article_detail' && config.articleId ? `article_${config.articleId}` : (config.type === 'github_profile_view' && config.githubUsername ? `github_profile_${config.githubUsername}` : (config.type === 'ai_chat' ? 'ai_chat_tab' : (config.type === 'guest_book' ? 'guest_book_tab' : (config.type === 'settings_editor' ? 'settings_editor_tab' : `unknown-tab-${Date.now()}` ) ) ) ) );
      tabTitle = config.title || config.fileName || (config.type === 'article_detail' ? 'Article' : (config.type === 'github_profile_view' && config.githubUsername ? `${config.githubUsername} - GitHub` : (config.type === 'ai_chat' ? 'AI Assistant' : (config.type === 'guest_book' ? 'Guest Book' : (config.type === 'settings_editor' ? 'Settings' : "Untitled") ) ) ) );
      tabType = config.type || 'file';
      tabFileName = config.fileName;
      tabArticleSlug = config.articleSlug;
      tabArticleId = config.articleId;
      tabGitHubUsername = config.githubUsername;
      if (tabType === 'ai_chat') featureIdForTab = 'aiChat';
      else if (tabType === 'github_profile_view') featureIdForTab = 'githubProfileView';
      else if (tabType === 'guest_book') featureIdForTab = 'guestBook';
      else if (tabType === 'settings_editor') featureIdForTab = 'settingsEditor';
      else if (tabFileName === 'projects.json') featureIdForTab = 'projectsView';
      else if (tabFileName && tabFileName.startsWith('article_')) featureIdForTab = 'articlesPanel'; 
    }

    let featureIsActive = true;
    let featureNameForMaintenance = "This feature";

    if (featureIdForTab && featuresStatus[featureIdForTab] && featuresStatus[featureIdForTab] !== 'active') {
        featureIsActive = false;
        featureNameForMaintenance = ALL_FEATURE_IDS[featureIdForTab];
    } else if (tabType === 'cv_preview' && featuresStatus.cvGenerator !== 'active') {
        featureIsActive = false;
        featureNameForMaintenance = ALL_FEATURE_IDS.cvGenerator;
    }

    // Statistics: Increment tab view count
    if (tabFileName && ['about.json', 'projects.json', 'skills.json', 'contact.json'].includes(tabFileName)) {
        const sanitizedTabId = tabFileName.replace(/\./g, '_'); // Sanitize for Firebase key
        incrementStatistic(`tab_views/${sanitizedTabId}/count`);
    } else if (tabType === 'ai_chat') {
        incrementStatistic('tab_views/ai_chat/count');
    } else if (tabType === 'guest_book') {
        incrementStatistic('tab_views/guest_book/count');
    }


    if (!featureIsActive) {
        addAppLog('info', `Opening tab for feature in maintenance: "${tabTitle}" (Type: ${tabType}).`, 'System', { featureName: featureNameForMaintenance });
    } else {
        addAppLog('action', `Opening tab: "${tabTitle}" (Type: ${tabType}, ID: ${idToOpen}) in ${targetPaneId} pane. Run action: ${isRunAction}.`, 'User', { fileName: tabFileName, articleSlug: tabArticleSlug, articleId: tabArticleId, githubUsername: tabGitHubUsername });
    }

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    if (isRunAction && tabType === 'json_preview') {
      simulateTerminalRun(tabTitle);
      setIsPreviewTabLoading(true);
      loadingTimeoutRef.current = window.setTimeout(() => setIsPreviewTabLoading(false), 1200);
    } else if (tabType !== 'cv_preview' && tabType !== 'settings_editor' && tabType !== 'github_profile_view' && tabType !== 'guest_book') {
      playSound('tab-open');
    }

    setEditorPanes(prevPanes => {
      const pane = prevPanes[targetPaneId];
      const existingTab = pane.openTabs.find(tab => tab.id === idToOpen);
      let newPaneState = { ...pane };

      if (existingTab) {
        newPaneState.activeTabId = existingTab.id;
        if(tabType !== 'cv_preview' && tabType !== 'settings_editor' && tabType !== 'github_profile_view' && tabType !== 'guest_book') playSound('tab-select');
      } else {
        const newTab: Tab = { id: idToOpen, title: tabTitle, type: tabType, fileName: tabFileName, articleSlug: tabArticleSlug, articleId: tabArticleId, githubUsername: tabGitHubUsername };
        newPaneState.openTabs = [...pane.openTabs, newTab];
        newPaneState.activeTabId = newTab.id;
      }

      if (newPaneState.activeTabId) {
        const newHistoryBase = newPaneState.tabHistory.slice(0, newPaneState.currentHistoryIndex + 1);
        if (newHistoryBase[newHistoryBase.length - 1] !== newPaneState.activeTabId) {
            newHistoryBase.push(newPaneState.activeTabId);
        }
        newPaneState.tabHistory = newHistoryBase;
        newPaneState.currentHistoryIndex = newHistoryBase.length - 1;
      }
      return { ...prevPanes, [targetPaneId]: newPaneState };
    });
    if (!isRightEditorPaneVisible && targetPaneId === 'right') {
      setIsRightEditorPaneVisible(true); 
    }
    setFocusedEditorPaneId(targetPaneId);

    if (tabType === 'article_detail' || tabType === 'ai_chat' || tabType === 'settings_editor' || tabType === 'github_profile_view' || tabType === 'guest_book') {
      setIsSearchPanelVisible(false); setIsSidebarVisible(false); setIsStatisticsPanelVisible(false); 
      if (tabType === 'ai_chat' || tabType === 'settings_editor' || tabType === 'github_profile_view' || tabType === 'guest_book') setIsArticlesPanelVisible(false);
    } else if (!isRunAction && tabType !== 'cv_preview') {
      setIsSearchPanelVisible(false); setIsArticlesPanelVisible(false); setIsStatisticsPanelVisible(false);
    }
  }, [focusedEditorPaneId, simulateTerminalRun, isRightEditorPaneVisible, addAppLog, featuresStatus]);

  const handleRunCVGenerator = useCallback(async () => {
    if (featuresStatus.cvGenerator !== 'active') {
      addNotificationAndLog(`The CV Generator (${ALL_FEATURE_IDS.cvGenerator}) is currently under maintenance. Please try again later.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'CV Generator action blocked due to maintenance mode.', 'System', { featureId: 'cvGenerator' });
      return;
    }
    addAppLog('action', 'CV generation process started.', 'User'); setIsGeneratingCV(true); const cvSteps = [ "Starting CV generation...", "Fetching portfolio data...", "Initializing PDF document with pdf-lib...", "Formatting header and contact information...", "Adding summary section...", "Processing work experience entries...", "Detailing education background...", "Listing key skills...", "Compiling PDF structure...", "Finalizing PDF document...", ]; simulateTerminalRun("generate_cv.ts", 5000, cvSteps); let pdfBytes: Uint8Array | null = null; try { pdfBytes = await createCV_PDF(PORTFOLIO_DATA); appendToTerminalOutput("PDF bytes generated successfully."); } catch (error) { console.error("Error generating CV PDF:", error); appendToTerminalOutput(`Error during PDF generation: ${error instanceof Error ? error.message : String(error)}`); addNotificationAndLog("Failed to generate CV PDF.", 'error', 7000, undefined, ICONS.FileText); addAppLog('error', 'CV PDF generation failed.', 'System', { error }); playSound('error'); setIsGeneratingCV(false); return; } setTimeout(() => { setIsGeneratingCV(false); const cvTabId = 'cv_nandang_eka_prasetya.pdf'; const cvTabTitle = 'Nandang_Eka_Prasetya_CV.pdf'; if (pdfBytes) { const blob = new Blob([pdfBytes], { type: 'application/pdf' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = cvTabTitle; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); appendToTerminalOutput(`${cvTabTitle} download initiated.`); addNotificationAndLog( `CV downloaded: ${cvTabTitle}`, 'success', 7000, [{ label: 'Open Preview', onClick: () => handleOpenTab({ id: cvTabId, title: cvTabTitle, type: 'cv_preview' }) }], ICONS.cv_preview_icon ); addAppLog('info', `CV downloaded: ${cvTabTitle}.`, 'System'); incrementStatistic('action_counts/cv_downloads'); } else { addNotificationAndLog("CV PDF generation failed. Preview unavailable.", 'error', 7000, undefined, ICONS.FileText); addAppLog('error', 'CV PDF generation failed, preview unavailable.', 'System'); } handleOpenTab({ id: cvTabId, title: cvTabTitle, type: 'cv_preview', fileName: cvTabId, }, false, focusedEditorPaneId); playSound('notification'); }, 5100); }, [simulateTerminalRun, handleOpenTab, addNotificationAndLog, appendToTerminalOutput, focusedEditorPaneId, addAppLog, featuresStatus]);
  const handleSidebarAction = useCallback((actionType: SidebarItemConfig['actionType'], item: SidebarItemConfig) => {
    if (item.featureId && featuresStatus[item.featureId] !== 'active') {
      addNotificationAndLog(`The ${ALL_FEATURE_IDS[item.featureId]} feature is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', `Sidebar action for '${item.label}' blocked due to maintenance of feature '${item.featureId}'.`, 'System');
      if (item.type) { 
        handleOpenTab(item, false, focusedEditorPaneId);
      }
      return;
    }

    if (item.actionType === 'open_tab' || !item.actionType) {
      handleOpenTab(item, false, focusedEditorPaneId);
    } else if (item.actionType === 'run_cv_generator') {
      handleRunCVGenerator(); 
    } else {
      console.warn("Unhandled sidebar action type:", actionType); addAppLog('warning', `Unhandled sidebar action: ${actionType} for item ${item.label}.`, 'System');
    }
  }, [handleOpenTab, focusedEditorPaneId, addAppLog, featuresStatus, handleRunCVGenerator, addNotificationAndLog]);

  const handleOpenProjectTab = useCallback((projectId: string, projectTitle: string) => { handleOpenTab({ id: projectId, fileName: projectId, type: 'project_detail', title: projectTitle }, false, focusedEditorPaneId); }, [handleOpenTab, focusedEditorPaneId]);

  const handleOpenPreviewTab = useCallback((originalFileTabId: string, isRunContext: boolean = false, targetPaneId: EditorPaneId = focusedEditorPaneId) => {
    const paneToSearch = editorPanes[targetPaneId];
    let originalItemSource: Tab | SidebarItemConfig | undefined = paneToSearch.openTabs.find(t => t.id === originalFileTabId);
    if (!originalItemSource) { const findInSidebar = (items: SidebarItemConfig[]): SidebarItemConfig | undefined => { for (const item of items) { if (item.id === originalFileTabId && !item.isFolder) return item; if (item.isFolder && item.children) { const found = findInSidebar(item.children); if (found) return found; } } return undefined; }; originalItemSource = findInSidebar(orderedSidebarItems); }
    if (!originalItemSource || !originalItemSource.fileName) { console.warn("Could not find original file to preview:", originalFileTabId); addAppLog('warning', `Could not find original file to preview: ${originalFileTabId}.`, 'System'); playSound('error'); return; }
    const previewTabId = `${originalItemSource.id}_preview`; const previewTabTitle = `Preview: ${originalItemSource.title || originalItemSource.fileName}`;
    handleOpenTab({ id: previewTabId, fileName: originalItemSource.fileName, type: 'json_preview', title: previewTabTitle, }, isRunContext, targetPaneId);
  }, [editorPanes, handleOpenTab, orderedSidebarItems, focusedEditorPaneId, addAppLog]);

  const handleOpenArticleTab = useCallback((article: ArticleItem) => { 
    if (featuresStatus.articlesPanel !== 'active') {
        addNotificationAndLog(`The Articles feature is currently under maintenance. Please try again later.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
        handleOpenTab({ id: `article_${article.id}`, type: 'article_detail', title: article.title, articleSlug: article.slug, articleId: article.id }, false, focusedEditorPaneId);
        return;
    }
    handleOpenTab({ 
      id: `article_${article.id}`,
      type: 'article_detail', 
      title: article.title, 
      articleSlug: article.slug,
      articleId: article.id
    }, false, focusedEditorPaneId); 
  }, [handleOpenTab, focusedEditorPaneId, featuresStatus, addNotificationAndLog]);
  const handleOpenSettingsEditor = useCallback(() => {
    if (featuresStatus.settingsEditor !== 'active') {
        addNotificationAndLog(`The Settings Editor (${ALL_FEATURE_IDS.settingsEditor}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
        handleOpenTab({ id: 'settings_editor_tab', title: 'Settings', type: 'settings_editor', }, false, focusedEditorPaneId);
        return;
    }
    const settingsTabId = 'settings_editor_tab'; const settingsTabTitle = 'Settings'; handleOpenTab({ id: settingsTabId, title: settingsTabTitle, type: 'settings_editor', }, false, focusedEditorPaneId); addAppLog('action', 'Opened Settings editor.', 'User'); }, [handleOpenTab, focusedEditorPaneId, addAppLog, featuresStatus, addNotificationAndLog]);
  const handleOpenGuestBookTab = useCallback(() => {
    if (featuresStatus.guestBook !== 'active') {
        addNotificationAndLog(`The Guest Book (${ALL_FEATURE_IDS.guestBook}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
        handleOpenTab({ id: 'guest_book_tab', title: 'Guest Book', type: 'guest_book' }, false, focusedEditorPaneId);
        return;
    }
    handleOpenTab({ id: 'guest_book_tab', title: 'Guest Book', type: 'guest_book' }, false, focusedEditorPaneId); addAppLog('action', 'Opened Guest Book.', 'User'); }, [handleOpenTab, focusedEditorPaneId, addAppLog, featuresStatus, addNotificationAndLog]);
  
  const handleOpenGitHubProfileTab = useCallback(() => {
    if (featuresStatus.githubProfileView !== 'active') {
        addNotificationAndLog(`The GitHub Profile Viewer (${ALL_FEATURE_IDS.githubProfileView}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
         const githubUrl = PORTFOLIO_DATA.otherSocial?.url;
        let username = 'github_user'; 
        if (PORTFOLIO_DATA.otherSocial?.name === 'GitHub' && githubUrl) {
            const parts = githubUrl.split('/');
            const potentialUsername = parts.pop() || parts.pop(); 
            if (potentialUsername) username = potentialUsername;
        }
        const tabId = `github_profile_${username}`;
        const tabTitle = `${username} - GitHub`;
        handleOpenTab({ id: tabId, title: tabTitle, type: 'github_profile_view', githubUsername: username }, false, focusedEditorPaneId);
        return;
    }
    const githubUrl = PORTFOLIO_DATA.otherSocial?.url;
    let username = 'github_user'; 
    if (PORTFOLIO_DATA.otherSocial?.name === 'GitHub' && githubUrl) {
        const parts = githubUrl.split('/');
        const potentialUsername = parts.pop() || parts.pop(); 
        if (potentialUsername) username = potentialUsername;
    }
    const tabId = `github_profile_${username}`;
    const tabTitle = `${username} - GitHub`;
    handleOpenTab({ id: tabId, title: tabTitle, type: 'github_profile_view', githubUsername: username }, false, focusedEditorPaneId);
    addAppLog('action', `Opened GitHub Profile tab for ${username}.`, 'User');
  }, [handleOpenTab, focusedEditorPaneId, addAppLog, featuresStatus, addNotificationAndLog]);

  const handleOpenSpotifyTab = useCallback(() => {
    handleOpenTab({ id: 'spotify_view', type: 'spotify_view', title: '🎵 Spotify' }, false, focusedEditorPaneId);
    addAppLog('action', 'Opened Spotify Integration tab.', 'User');
  }, [handleOpenTab, focusedEditorPaneId, addAppLog]);

  const handleSelectTab = useCallback((paneId: EditorPaneId, tabId: string) => {
    playSound('tab-select');
    setActiveTabIdForPane(paneId, tabId);
    setFocusedEditorPaneId(paneId);
  }, [setActiveTabIdForPane]);

  const handleCloseTab = useCallback((paneId: EditorPaneId, tabIdToClose: string) => {
    playSound('tab-close');
    addAppLog('action', `Closed tab: ${tabIdToClose} in ${paneId} pane.`, 'User');
    let newActiveTabIdForPane: string | null = null;
    const pane = editorPanes[paneId];
    const closedTabIndex = pane.openTabs.findIndex(tab => tab.id === tabIdToClose);

    if (tabIdToClose === pane.activeTabId) {
      const historyWithoutClosed = pane.tabHistory.filter(id => id !== tabIdToClose);
      let newIndex = pane.currentHistoryIndex;
      if (pane.tabHistory.indexOf(tabIdToClose) <= newIndex) {
        newIndex--;
      }
      newIndex = Math.max(-1, newIndex); 

      if (newIndex >= 0 && newIndex < historyWithoutClosed.length && pane.openTabs.some(t => t.id === historyWithoutClosed[newIndex] && t.id !== tabIdToClose)) {
        newActiveTabIdForPane = historyWithoutClosed[newIndex];
      } else if (closedTabIndex > 0 && pane.openTabs.length > 1) {
        newActiveTabIdForPane = pane.openTabs[closedTabIndex - 1].id;
      } else if (pane.openTabs.length > 1 && closedTabIndex < pane.openTabs.length - 1 ) {
        newActiveTabIdForPane = pane.openTabs[closedTabIndex + 1].id;
      } else if (pane.openTabs.length > 1) { 
        newActiveTabIdForPane = pane.openTabs.find(t => t.id !== tabIdToClose)?.id || null;
      }
    } else {
      newActiveTabIdForPane = pane.activeTabId;
    }

    const newOpenTabsForPane = pane.openTabs.filter(tab => tab.id !== tabIdToClose);
    if (newOpenTabsForPane.length > 0 && !newOpenTabsForPane.some(t => t.id === newActiveTabIdForPane)) {
        newActiveTabIdForPane = newOpenTabsForPane[0].id;
    } else if (newOpenTabsForPane.length === 0) {
        newActiveTabIdForPane = null;
    }

    setEditorPanes(prevPanes => ({
      ...prevPanes,
      [paneId]: { ...prevPanes[paneId], openTabs: newOpenTabsForPane, activeTabId: newActiveTabIdForPane }
    }));
    cleanTabHistoryOnClose(paneId, tabIdToClose, newActiveTabIdForPane);
    if (newActiveTabIdForPane) updateTabHistoryOnActivation(paneId, newActiveTabIdForPane);

  }, [editorPanes, cleanTabHistoryOnClose, updateTabHistoryOnActivation, addAppLog]);

  const handleReorderOpenTabs = useCallback((paneId: EditorPaneId, draggedTabId: string, targetTabId: string | null) => {
    setEditorPanes(prevPanes => {
      const pane = prevPanes[paneId];
      const draggedTabIndex = pane.openTabs.findIndex(tab => tab.id === draggedTabId);
      if (draggedTabIndex === -1) return prevPanes;

      const newTabs = [...pane.openTabs];
      const [draggedTab] = newTabs.splice(draggedTabIndex, 1);

      if (targetTabId === null) { newTabs.push(draggedTab); }
      else { const targetTabIndex = newTabs.findIndex(tab => tab.id === targetTabId); if (targetTabIndex === -1) return prevPanes; newTabs.splice(targetTabIndex, 0, draggedTab); }
      playSound('ui-click');
      addAppLog('debug', `Reordered tab ${draggedTabId} to be near ${targetTabId || 'end'} in ${paneId} pane.`, 'User');
      return { ...prevPanes, [paneId]: { ...pane, openTabs: newTabs } };
    });
  }, [addAppLog]);

  const toggleSidebarVisibility = useCallback(() => { const newVisibility = !isSidebarVisible; setIsSidebarVisible(newVisibility); playSound('panel-toggle'); addAppLog('action', `Explorer sidebar ${newVisibility ? 'shown' : 'hidden'}.`, 'User'); if (newVisibility) { setActivityBarSelection('explorer'); setIsSearchPanelVisible(false); setIsArticlesPanelVisible(false); setIsStatisticsPanelVisible(false); } else if (activityBarSelection === 'explorer') { setActivityBarSelection(null); } }, [isSidebarVisible, activityBarSelection, addAppLog]);
  const handleOpenAIChatTab = useCallback(() => {
    if (featuresStatus.aiChat !== 'active') {
      addNotificationAndLog(`The AI Assistant (${ALL_FEATURE_IDS.aiChat}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      handleOpenTab({ id: 'ai_chat_tab', title: 'AI Assistant', type: 'ai_chat' }, false, focusedEditorPaneId); // Still open tab to show maintenance
      return;
    }
    handleOpenTab({ id: 'ai_chat_tab', title: 'AI Assistant', type: 'ai_chat' }, false, focusedEditorPaneId);
  }, [handleOpenTab, focusedEditorPaneId, featuresStatus, addNotificationAndLog]);
  const openCommandPalette = useCallback(() => { setIsCommandPaletteOpen(true); playSound('modal-toggle'); addAppLog('action', 'Opened Command Palette.', 'User'); }, [addAppLog]);
  const closeCommandPalette = useCallback(() => { setIsCommandPaletteOpen(false); }, []);
  const openAboutModal = useCallback(() => { setIsAboutModalOpen(true); playSound('modal-toggle'); addAppLog('action', 'Opened About modal.', 'User'); }, [addAppLog]);
  const closeAboutModal = useCallback(() => { setIsAboutModalOpen(false); playSound('ui-click'); }, []);

  const handleEditorContextMenuRequest = useCallback((x: number, y: number, tabId: string, paneId: EditorPaneId, isCVGeneratorContext?: boolean) => {
    const targetTab = editorPanes[paneId].openTabs.find(tab => tab.id === tabId);
    if (!targetTab) return;
    let items: ContextMenuItem[] = [];
    if (isCVGeneratorContext && targetTab.fileName === 'generate_cv.ts') {
      const cvGenStatus = featuresStatus.cvGenerator;
      items.push({
        label: cvGenStatus !== 'active' ? 'Run CV Generator (Maintenance)' : 'Run CV Generator Script',
        action: () => {
          if (cvGenStatus !== 'active') {
            addNotificationAndLog(`The CV Generator (${ALL_FEATURE_IDS.cvGenerator}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
          } else {
            handleRunCVGenerator(); playSound('command-execute');
          }
        },
        icon: ICONS.PlayIcon,
        disabled: cvGenStatus !== 'active',
      });
    } else if (targetTab.type !== 'settings_editor' && targetTab.type !== 'github_profile_view' && targetTab.type !== 'guest_book') { 
      items.push({ label: `Close ${targetTab.title}`, action: () => handleCloseTab(paneId, tabId) });
      items.push({ label: 'Close Others', action: () => { setEditorPanes(prev => ({ ...prev, [paneId]: { ...prev[paneId], openTabs: [targetTab], activeTabId: targetTab.id, tabHistory: [targetTab.id], currentHistoryIndex: 0 }})); addAppLog('action', `Closed other tabs, kept ${targetTab.title} in ${paneId} pane.`, 'User'); playSound('ui-click'); }});
      items.push({ label: 'Close All', action: () => { setEditorPanes(prev => ({ ...prev, [paneId]: { ...initialPaneState }})); addAppLog('action', `Closed all tabs in ${paneId} pane.`, 'User'); playSound('ui-click'); }});
      const eligibleForPreview = ['about.json', 'experience.json', 'skills.json', 'contact.json', 'projects.json'].includes(targetTab.fileName || '');
      if (targetTab.type === 'file' && eligibleForPreview && !targetTab.id.endsWith('_preview')) { items.push({ label: `Open Preview for ${targetTab.title}`, action: () => handleOpenPreviewTab(tabId, false, paneId) }); }
      if (targetTab.type === 'project_detail' && !targetTab.id.startsWith('ai_project_') && !targetTab.id.endsWith('_preview')) { items.push({ label: `Open Preview for ${targetTab.title}`, action: () => handleOpenPreviewTab(tabId, false, paneId) }); }
    }
    if (items.length > 0) { setEditorContextMenuState({ x, y, items, visible: true, tabId, paneId }); playSound('ui-click'); addAppLog('debug', `Opened context menu for tab ${targetTab.title}.`, 'User'); }
  }, [editorPanes, handleCloseTab, handleOpenPreviewTab, handleRunCVGenerator, addAppLog, featuresStatus, addNotificationAndLog]);

  const closeEditorContextMenu = useCallback(() => setEditorContextMenuState(prev => ({ ...prev, visible: false })), []);
  const handleSidebarItemContextMenuRequest = useCallback((event: React.MouseEvent, item: SidebarItemConfig) => {
    const items: ContextMenuItem[] = [];
    if (item.id === 'generate_cv.ts') {
      const cvGenStatus = featuresStatus.cvGenerator;
      items.push({
        label: cvGenStatus !== 'active' ? 'Run CV Generator (Maintenance)' : 'Run CV Generator Script',
        action: () => {
          if (cvGenStatus !== 'active') {
            addNotificationAndLog(`The CV Generator (${ALL_FEATURE_IDS.cvGenerator}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
          } else {
            handleRunCVGenerator(); playSound('command-execute');
          }
        },
        icon: ICONS.PlayIcon,
        disabled: cvGenStatus !== 'active',
      });
    }
    if (items.length > 0) {
      setSidebarContextMenuState({ x: event.pageX, y: event.pageY, items, visible: true, itemId: item.id });
      playSound('ui-click');
      addAppLog('debug', `Opened context menu for sidebar item ${item.label}.`, 'User');
    }
  }, [handleRunCVGenerator, addAppLog, featuresStatus, addNotificationAndLog]);
  const closeSidebarContextMenu = useCallback(() => setSidebarContextMenuState(prev => ({ ...prev, visible: false })), []);
  const toggleTerminalPanel = useCallback(() => {
    if (featuresStatus.terminal !== 'active') {
      addNotificationAndLog(`The Terminal (${ALL_FEATURE_IDS.terminal}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'Terminal toggle blocked due to maintenance mode.', 'System');
      setIsBottomPanelVisible(true); setActiveBottomPanelId('terminal'); // Still show panel to display maintenance message
      return;
    }
    playSound('panel-toggle'); if (isBottomPanelVisible && activeBottomPanelId === 'terminal') { setIsBottomPanelVisible(false); addAppLog('action', `Terminal panel hidden.`, 'User'); } else { setIsBottomPanelVisible(true); setActiveBottomPanelId('terminal'); addAppLog('action', `Terminal panel shown.`, 'User'); }
  }, [isBottomPanelVisible, activeBottomPanelId, addAppLog, featuresStatus, addNotificationAndLog]);

  const togglePetsPanel = useCallback(() => {
    if (featuresStatus.petsPanel !== 'active') {
      addNotificationAndLog(`The Pets Panel (${ALL_FEATURE_IDS.petsPanel}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'Pets Panel toggle blocked due to maintenance mode.', 'System');
      setIsBottomPanelVisible(true); setActiveBottomPanelId('pets'); // Still show panel
      return;
    }
    playSound('panel-toggle'); if (isBottomPanelVisible && activeBottomPanelId === 'pets') { setIsBottomPanelVisible(false); addAppLog('action', `Pets panel hidden.`, 'User'); } else { setIsBottomPanelVisible(true); setActiveBottomPanelId('pets'); addAppLog('action', `Pets panel shown.`, 'User'); }
  }, [isBottomPanelVisible, activeBottomPanelId, addAppLog, featuresStatus, addNotificationAndLog]);

  const toggleLogsPanel = useCallback(() => {
    if (featuresStatus.logsPanel !== 'active') {
      addNotificationAndLog(`The Logs Panel (${ALL_FEATURE_IDS.logsPanel}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'Logs Panel toggle blocked due to maintenance mode.', 'System');
      setIsBottomPanelVisible(true); setActiveBottomPanelId('logs'); // Still show panel
      return;
    }
    playSound('panel-toggle'); if (isBottomPanelVisible && activeBottomPanelId === 'logs') { setIsBottomPanelVisible(false); addAppLog('action', `Logs panel hidden.`, 'User'); } else { setIsBottomPanelVisible(true); setActiveBottomPanelId('logs'); addAppLog('action', `Logs panel shown.`, 'User'); }
  }, [isBottomPanelVisible, activeBottomPanelId, addAppLog, featuresStatus, addNotificationAndLog]);

  const handleSelectBottomPanelTab = useCallback((panelId: BottomPanelTabId) => {
    const featureMap: Partial<Record<BottomPanelTabId, FeatureId>> = {
      terminal: 'terminal',
      pets: 'petsPanel',
      logs: 'logsPanel',
    };
    const targetFeatureId = featureMap[panelId];
    if (targetFeatureId && featuresStatus[targetFeatureId] !== 'active') {
      addNotificationAndLog(`The ${ALL_FEATURE_IDS[targetFeatureId]} is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      // Allow selecting tab to view maintenance message
    }
    playSound('ui-click'); setActiveBottomPanelId(panelId); if (!isBottomPanelVisible) { setIsBottomPanelVisible(true); } addAppLog('action', `Selected bottom panel tab: ${panelId}.`, 'User');
  }, [isBottomPanelVisible, addAppLog, featuresStatus, addNotificationAndLog]);
  const handleCloseBottomPanel = useCallback(() => { setIsBottomPanelVisible(false); playSound('panel-toggle'); addAppLog('action', 'Bottom panel closed.', 'User'); }, [addAppLog]);
  
  const handleToggleBottomPanelStatusBar = useCallback(() => {
    playSound('panel-toggle');
    setIsBottomPanelVisible(prev => {
        const newVisibility = !prev;
        if (newVisibility && !activeBottomPanelId) {
            setActiveBottomPanelId('terminal');
        }
        addAppLog('action', `Bottom panel ${newVisibility ? 'shown' : 'hidden'} via status bar.`, 'User');
        return newVisibility;
    });
  }, [activeBottomPanelId, addAppLog]);

  const handleSuggestNewAIProject = useCallback(async (userKeywords?: string) => {
    if (featuresStatus.projectSuggestions !== 'active') {
      addNotificationAndLog(`The AI Project Suggestions feature (${ALL_FEATURE_IDS.projectSuggestions}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'AI Project Suggestion blocked due to maintenance mode.', 'System');
      return;
    }
    if (isAISuggestingProject) return;
    setIsAISuggestingProject(true);
    appendToTerminalOutput(`> Fetching AI project suggestion ${userKeywords ? `with keywords: "${userKeywords}"` : ''}...`);
    addAppLog('action', `AI project suggestion started ${userKeywords ? `with keywords: "${userKeywords}"` : ''}.`, 'System');
    playSound('terminal-run');
    const suggestion = await fetchAIProjectSuggestion(PORTFOLIO_DATA.skills, addAppLog, userKeywords);
    setIsAISuggestingProject(false);
    if (suggestion) {
      const newAIProjectId = `ai_project_${Date.now()}_${suggestion.title.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]+/g, '')}`;
      const newAIProject: ProjectDetail = { ...suggestion, id: newAIProjectId };
      setAiGeneratedProjects(prev => [...prev, newAIProject]);
      appendToTerminalOutput(`AI Suggested Project: "${newAIProject.title}"`);
      appendToTerminalOutput(`Opening details for ${newAIProject.title}...`);
      playSound('terminal-complete');
      handleOpenTab({ id: newAIProject.id, fileName: newAIProject.id, type: 'project_detail', title: `✨ ${newAIProject.title} (AI)`, }, false, focusedEditorPaneId);
      addAppLog('info', `AI suggested project: "${newAIProject.title}".`, 'System', { project: newAIProject, userKeywords });
      incrementStatistic('action_counts/ai_project_suggestions');
    } else {
      appendToTerminalOutput("Failed to get AI project suggestion. Please check logs or try again.");
      playSound('error');
      addAppLog('error', `Failed to get AI project suggestion.`, 'System', {userKeywords});
    }
  }, [isAISuggestingProject, appendToTerminalOutput, PORTFOLIO_DATA.skills, handleOpenTab, focusedEditorPaneId, addAppLog, featuresStatus, addNotificationAndLog]);


  const handlePasskeySubmit = useCallback((passkey: string | null) => {
    setIsPasskeyPromptOpen(false); 
    if (passkey === "10102002") {
      setIsDevModeEnabled(true);
      addNotificationAndLog("Developer Mode Enabled.", 'success', 3000);
      addAppLog('action', 'Developer Mode enabled.', 'User');
      playSound('setting-change');
    } else if (passkey === null) { 
      addNotificationAndLog("Developer Mode enabling was cancelled.", 'info', 4000);
      addAppLog('info', 'Developer Mode enabling cancelled.', 'User');
      playSound('ui-click');
    } else if (passkey === "") {
      addNotificationAndLog("Passkey cannot be empty. Developer Mode remains disabled.", 'warning', 5000);
      addAppLog('warning', 'Developer Mode enabling failed: Empty passkey.', 'User');
      playSound('error');
    } else { 
      addNotificationAndLog("Incorrect passkey. Developer Mode remains disabled.", 'error', 5000);
      addAppLog('warning', 'Developer Mode enabling failed: Incorrect passkey.', 'User');
      playSound('error');
    }
  }, [addNotificationAndLog, addAppLog]);

  const handleToggleDevMode = useCallback(() => {
    if (isDevModeEnabled) {
      setIsDevModeEnabled(false);
      addNotificationAndLog("Developer Mode Disabled.", 'info', 3000);
      addAppLog('action', 'Developer Mode disabled.', 'User');
      playSound('setting-change');
    } else {
      setIsPasskeyPromptOpen(true); 
      playSound('modal-toggle');
    }
  }, [isDevModeEnabled, addNotificationAndLog, addAppLog]);

  const handleToggleProfilePopup = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const currentAnchor = event ? event.currentTarget : null;
    setIsProfilePopupOpen(prevIsOpen => {
      const newIsOpen = !prevIsOpen;
      if (newIsOpen) {
        setProfilePopupAnchorEl(currentAnchor);
      } else {
        setProfilePopupAnchorEl(null);
      }
      addAppLog('action', `Profile popup ${newIsOpen ? 'opened' : 'closed'}.`, 'User');
      return newIsOpen;
    });
    playSound('ui-click');
  };

  const terminalCommandContext: TerminalCommandContext = useMemo(() => ({
    sidebarItems: orderedSidebarItems,
    portfolioData: PORTFOLIO_DATA,
    themes: PREDEFINED_THEMES,
    currentThemeName: currentThemeName,
    featuresStatus,
    openTab: handleOpenTab,
    changeTheme: rawHandleThemeChange,
    appendToOutput: appendToTerminalOutput,
    clearOutput: clearTerminalOutput,
    runScript: simulateTerminalRun,
    addAppLog,
    addNotification: addNotificationAndLog,
  }), [orderedSidebarItems, PORTFOLIO_DATA, PREDEFINED_THEMES, currentThemeName, featuresStatus, handleOpenTab, rawHandleThemeChange, appendToTerminalOutput, clearTerminalOutput, simulateTerminalRun, addAppLog, addNotificationAndLog]);

  const handleTerminalCommand = useCallback(() => {
    if (!terminalInputValue.trim()) return;
    const commandToProcess = terminalInputValue;
    setTerminalInputValue(''); 
    
    appendToTerminalOutput(`> ${commandToProcess}`);
    addAppLog('action', `Terminal command entered: "${commandToProcess}"`, 'Terminal');

    const output = processCommand(commandToProcess, terminalCommandContext);
    if (output) {
        appendToTerminalOutput(output);
    }
  }, [terminalInputValue, appendToTerminalOutput, terminalCommandContext, addAppLog]);

  const handleFocusTerminal = useCallback(() => {
    if (featuresStatus.terminal !== 'active') {
      addNotificationAndLog(`The Terminal (${ALL_FEATURE_IDS.terminal}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      setIsBottomPanelVisible(true); setActiveBottomPanelId('terminal'); // Still show to display maintenance
      return;
    }
    setIsBottomPanelVisible(true);
    setActiveBottomPanelId('terminal');
    playSound('panel-toggle');
    addAppLog('action', 'Terminal focused via Welcome View.', 'User');
  }, [addAppLog, featuresStatus, addNotificationAndLog]);


  useGlobalEventHandlers({ 
    toggleSidebarVisibility, 
    openCommandPalette, 
    isCommandPaletteOpen, 
    closeCommandPalette, 
    isAboutModalOpen, 
    closeAboutModal, 
    contextMenuVisible: editorContextMenuState.visible || sidebarContextMenuState.visible, 
    setContextMenuVisible: (visible) => { if (!visible) { closeEditorContextMenu(); closeSidebarContextMenu();}}, 
    toggleTerminalVisibility: handleToggleBottomPanelStatusBar, // Updated to use generic bottom panel toggle
    togglePetsPanelVisibility: togglePetsPanel, // Kept specific for other shortcuts/actions if any
    isDevModeEnabled 
  });

  const handleToggleSearchPanel = useCallback(() => {
    if (featuresStatus.searchPanel !== 'active') {
      addNotificationAndLog(`The Search Panel (${ALL_FEATURE_IDS.searchPanel}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'Search Panel toggle blocked due to maintenance mode.', 'System');
      // If you want to still show the panel with a maintenance message, set visibility and selection
      // setIsSearchPanelVisible(true); setActivityBarSelection('search');
      return;
    }
    const newVisibility = !isSearchPanelVisible; setIsSearchPanelVisible(newVisibility); playSound('panel-toggle'); addAppLog('action', `Search panel ${newVisibility ? 'shown' : 'hidden'}.`, 'User'); if (newVisibility) { setActivityBarSelection('search'); setIsSidebarVisible(false); setIsArticlesPanelVisible(false); setIsStatisticsPanelVisible(false); } else if (activityBarSelection === 'search') { setActivityBarSelection(null); }
  }, [isSearchPanelVisible, activityBarSelection, addAppLog, featuresStatus, addNotificationAndLog]);
  
  const handleToggleArticlesPanel = useCallback(async () => {
    if (featuresStatus.articlesPanel !== 'active') {
        addNotificationAndLog(`The Articles Panel (${ALL_FEATURE_IDS.articlesPanel}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
        addAppLog('warning', 'Articles Panel toggle blocked due to maintenance mode.', 'System');
        setIsArticlesPanelVisible(true); setActivityBarSelection('articles'); // Show panel for maintenance message
        return;
    }
    const newVisibility = !isArticlesPanelVisible;
    setIsArticlesPanelVisible(newVisibility);
    playSound('panel-toggle');
    addAppLog('action', `Articles panel ${newVisibility ? 'shown' : 'hidden'}.`, 'User');

    if (newVisibility) {
      setActivityBarSelection('articles');
      setIsSidebarVisible(false);
      setIsSearchPanelVisible(false);
      setIsStatisticsPanelVisible(false);

      if (devToArticles.length === 0 && !articlesError) {
        addNotificationAndLog(
          "Loading latest articles...", 'info', 0, undefined, 
          ICONS.Info, true, ARTICLES_LOADING_NOTIFICATION_ID
        );
        const fetchSuccessful = await triggerFetchDevToArticles();
        rawRemoveNotification(ARTICLES_LOADING_NOTIFICATION_ID);
        if (fetchSuccessful) {
          addNotificationAndLog("Articles loaded successfully!", 'success', 3000, undefined, ICONS.CheckCircle2);
        }
        // Error notification handled by useEffect on articlesError
      }
    } else if (activityBarSelection === 'articles') {
      setActivityBarSelection(null);
    }
  }, [isArticlesPanelVisible, activityBarSelection, addAppLog, devToArticles.length, articlesError, triggerFetchDevToArticles, rawRemoveNotification, addNotificationAndLog, featuresStatus]);

  useEffect(() => {
    if (articlesError && isArticlesPanelVisible) { // Only show error notification if panel is visible or was just trying to open
      rawRemoveNotification(ARTICLES_LOADING_NOTIFICATION_ID); // Ensure loading is removed
      addNotificationAndLog(
        `Failed to load articles: ${articlesError}`,
        'error',
        7000,
        [{ label: 'Retry', onClick: handleRetryFetchArticles }],
        ICONS.AlertTriangle
      );
    }
  }, [articlesError, isArticlesPanelVisible, addNotificationAndLog, rawRemoveNotification]); // Removed handleRetryFetchArticles from deps

  const handleRetryFetchArticles = useCallback(async (isUserInitiatedRetry = true) => {
    if (isUserInitiatedRetry) { // To distinguish from automatic retries if any
        addNotificationAndLog(
            "Retrying to fetch articles...", 'info', 0, undefined, 
            ICONS.Info, true, ARTICLES_LOADING_NOTIFICATION_ID
        );
    }
    const fetchSuccessful = await triggerFetchDevToArticles(true); // Pass retry flag
    rawRemoveNotification(ARTICLES_LOADING_NOTIFICATION_ID);
    if (fetchSuccessful) {
       addNotificationAndLog("Articles loaded successfully!", 'success', 3000, undefined, ICONS.CheckCircle2);
    }
     // Error handled by useEffect on articlesError
  }, [triggerFetchDevToArticles, addNotificationAndLog, rawRemoveNotification]);


  const handleToggleSourceControl = useCallback(() => {
    if (featuresStatus.sourceControl !== 'active') {
      addNotificationAndLog(`The Source Control feature is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      return;
    }
    const newVisibility = !isSourceControlVisible;
    setIsSourceControlVisible(newVisibility);
    playSound('panel-toggle');
    addAppLog('action', `Source Control panel ${newVisibility ? 'shown' : 'hidden'}.`, 'User');
    if (newVisibility) {
      setActivityBarSelection('source_control');
      setIsSidebarVisible(false);
      setIsSearchPanelVisible(false);
      setIsArticlesPanelVisible(false);
      setIsStatisticsPanelVisible(false);
    } else if (activityBarSelection === 'source_control') {
      setActivityBarSelection(null);
    }
  }, [isSourceControlVisible, activityBarSelection, addAppLog, featuresStatus, addNotificationAndLog]);

  const handleToggleStatisticsPanel = useCallback(() => {
    if (featuresStatus.statisticsPanel !== 'active') {
      addNotificationAndLog(`The Statistics Panel (${ALL_FEATURE_IDS.statisticsPanel}) is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
      addAppLog('warning', 'Statistics Panel toggle blocked due to maintenance mode.', 'System');
      // setIsStatisticsPanelVisible(true); setActivityBarSelection('statistics'); // Show panel for maintenance message
      return;
    }
    const newVisibility = !isStatisticsPanelVisible; 
    setIsStatisticsPanelVisible(newVisibility); 
    playSound('panel-toggle'); 
    addAppLog('action', `Statistics panel ${newVisibility ? 'shown' : 'hidden'}.`, 'User'); 
    if (newVisibility) { 
      setActivityBarSelection('statistics'); 
      setIsSidebarVisible(false); 
      setIsSearchPanelVisible(false); 
      setIsArticlesPanelVisible(false); 
      // Fetch fresh statistics data when panel is opened
      const loadStats = async () => {
        setIsLoadingStatistics(true);
        setStatisticsError(null);
        const data = await fetchStatistics();
        if (data) {
          setStatisticsData(data);
          addAppLog('info', 'Statistics data refreshed.', 'Statistics');
        } else {
          setStatisticsError('Failed to refresh statistics data.');
          addAppLog('error', 'Failed to refresh statistics data.', 'Statistics');
        }
        setIsLoadingStatistics(false);
      };
      loadStats();
    } else if (activityBarSelection === 'statistics') { 
      setActivityBarSelection(null); 
    }
  }, [isStatisticsPanelVisible, activityBarSelection, addAppLog, featuresStatus, addNotificationAndLog]);

  // Deep Link Support - Apply hash route to workspace state
  const applyHash = useCallback((hash: string) => {
    if (!hash) return;
    
    // Check current active tab to avoid redundant activation
    const currentActiveTab = editorPanes[focusedEditorPaneId].openTabs.find(
      tab => tab.id === editorPanes[focusedEditorPaneId].activeTabId
    );

    // Explorer files
    const allFiles = ['about.json', 'experience.json', 'skills.json', 'projects.json', 'contact.json', 'generate_cv.ts', 'guide.md', 'support.md'];
    if (allFiles.includes(hash)) {
      if (currentActiveTab && currentActiveTab.id === hash) return;
      let title = hash;
      if (hash === 'guide.md') title = 'Portfolio Guide';
      if (hash === 'support.md') title = 'Support the Creator';
      
      handleOpenTab({
        id: hash,
        fileName: hash,
        type: 'file',
        title: title
      }, false, focusedEditorPaneId);
      return;
    }
    
    // File preview
    if (hash.endsWith('_preview')) {
      const originalFileId = hash.replace('_preview', '');
      if (allFiles.includes(originalFileId)) {
        if (currentActiveTab && currentActiveTab.id === hash) return;
        handleOpenPreviewTab(originalFileId, false, focusedEditorPaneId);
        return;
      }
    }

    // Specific views
    if (hash === 'ai_chat') {
      if (currentActiveTab && currentActiveTab.type === 'ai_chat') return;
      handleOpenAIChatTab();
      return;
    }
    if (hash === 'github') {
      if (currentActiveTab && currentActiveTab.type === 'github_profile_view') return;
      handleOpenGitHubProfileTab();
      return;
    }
    if (hash === 'guest_book') {
      if (currentActiveTab && currentActiveTab.type === 'guest_book') return;
      handleOpenGuestBookTab();
      return;
    }
    if (hash === 'settings') {
      if (currentActiveTab && currentActiveTab.type === 'settings_editor') return;
      handleOpenSettingsEditor();
      return;
    }
    if (hash === 'cv_preview') {
      if (currentActiveTab && currentActiveTab.type === 'cv_preview') return;
      handleOpenTab({ id: 'cv_nandang_eka_prasetya.pdf', title: 'Nandang_Eka_Prasetya_CV.pdf', type: 'cv_preview', fileName: 'cv_nandang_eka_prasetya.pdf' }, false, focusedEditorPaneId);
      return;
    }
    if (hash === 'spotify') {
      if (currentActiveTab && currentActiveTab.type === 'spotify_view') return;
      handleOpenSpotifyTab();
      return;
    }
    
    // Project details
    if (hash.startsWith('project_') || hash.startsWith('ai_project_')) {
      if (currentActiveTab && currentActiveTab.id === hash) return;
      const proj = PORTFOLIO_DATA.projects.find(p => p.id === hash);
      const title = proj ? proj.title : 'Project Detail';
      handleOpenTab({ id: hash, fileName: hash, type: 'project_detail', title: title }, false, focusedEditorPaneId);
      return;
    }

    // Article details
    if (hash.startsWith('article_')) {
      if (currentActiveTab && currentActiveTab.id === hash) return;
      const articleIdStr = hash.replace('article_', '');
      const articleId = parseInt(articleIdStr, 10);
      
      const article = devToArticles.find(a => a.id === articleId);
      if (article) {
        handleOpenArticleTab(article);
      } else {
        handleOpenTab({
          id: hash,
          type: 'article_detail',
          title: 'Article',
          articleId: articleId
        }, false, focusedEditorPaneId);
      }
      return;
    }

    // Sidebar panels
    if (hash === 'search') {
      if (isSearchPanelVisible && activityBarSelection === 'search') return;
      setIsSearchPanelVisible(true);
      setActivityBarSelection('search');
      setIsSidebarVisible(false);
      setIsArticlesPanelVisible(false);
      setIsStatisticsPanelVisible(false);
      return;
    }
    if (hash === 'articles') {
      if (isArticlesPanelVisible && activityBarSelection === 'articles') return;
      setIsArticlesPanelVisible(true);
      setActivityBarSelection('articles');
      setIsSidebarVisible(false);
      setIsSearchPanelVisible(false);
      setIsStatisticsPanelVisible(false);
      return;
    }
    if (hash === 'statistics') {
      if (isStatisticsPanelVisible && activityBarSelection === 'statistics') return;
      setIsStatisticsPanelVisible(true);
      setActivityBarSelection('statistics');
      setIsSidebarVisible(false);
      setIsSearchPanelVisible(false);
      setIsArticlesPanelVisible(false);
      return;
    }
    if (hash === 'explorer') {
      if (isSidebarVisible && activityBarSelection === 'explorer') return;
      setIsSidebarVisible(true);
      setActivityBarSelection('explorer');
      setIsSearchPanelVisible(false);
      setIsArticlesPanelVisible(false);
      setIsStatisticsPanelVisible(false);
      return;
    }
  }, [
    editorPanes,
    focusedEditorPaneId,
    handleOpenTab,
    handleOpenPreviewTab,
    handleOpenAIChatTab,
    handleOpenGitHubProfileTab,
    handleOpenGuestBookTab,
    handleOpenSettingsEditor,
    handleOpenArticleTab,
    handleOpenSpotifyTab,
    isSearchPanelVisible,
    isArticlesPanelVisible,
    isStatisticsPanelVisible,
    isSidebarVisible,
    activityBarSelection,
    devToArticles
  ]);

  // Ref flag to prevent our own hash writes from re-triggering applyHash
  const isUpdatingHashRef = useRef(false);

  // Keep latest applyHash in a ref so the event listener below never needs
  // to be re-registered when navigation changes applyHash's identity.
  const applyHashRef = useRef(applyHash);
  useEffect(() => {
    applyHashRef.current = applyHash;
  }); // intentionally no deps — runs every render to keep ref fresh

  // Register the hashchange listener ONCE on mount only (empty dep array).
  // This is critical — if we put applyHash in the dep array, every tab click
  // re-registers the listener, re-reads the current hash, and schedules a
  // 500 ms applyHash(currentHash) timer, which reverses navigation.
  useEffect(() => {
    const handleHashChange = () => {
      if (isUpdatingHashRef.current) return;
      const hashText = window.location.hash.replace(/^#\/?/, '');
      if (hashText) applyHashRef.current(hashText);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Process initial URL hash only once on first mount
    const initialHash = window.location.hash.replace(/^#\/?/, '');
    const initTimer = initialHash
      ? setTimeout(() => applyHashRef.current(initialHash), 500)
      : undefined;

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (initTimer) clearTimeout(initTimer);
    };
  }, []); // ← empty: register once, never re-register on navigation

  // Synchronize internal active views/tabs state changes back to URL hash
  // Uses replaceState to avoid triggering hashchange events (prevents feedback loop)
  useEffect(() => {
    const currentTab = currentActiveTabForFocusedPane;
    let hash = '';
    
    if (currentTab) {
      if (currentTab.type === 'file') {
        hash = currentTab.id;
      } else if (currentTab.type === 'article_detail') {
        hash = `article_${currentTab.articleId}`;
      } else if (currentTab.type === 'ai_chat') {
        hash = 'ai_chat';
      } else if (currentTab.type === 'github_profile_view') {
        hash = 'github';
      } else if (currentTab.type === 'guest_book') {
        hash = 'guest_book';
      } else if (currentTab.type === 'settings_editor') {
        hash = 'settings';
      } else if (currentTab.type === 'cv_preview') {
        hash = 'cv_preview';
      } else if (currentTab.type === 'spotify_view') {
        hash = 'spotify';
      } else if (currentTab.type === 'json_preview') {
        hash = `${currentTab.id.replace('_preview', '')}_preview`;
      } else if (currentTab.type === 'project_detail') {
        hash = currentTab.id;
      }
    } else {
      if (isSearchPanelVisible) {
        hash = 'search';
      } else if (isArticlesPanelVisible) {
        hash = 'articles';
      } else if (isStatisticsPanelVisible) {
        hash = 'statistics';
      } else if (isSidebarVisible) {
        hash = 'explorer';
      }
    }

    const currentHash = window.location.hash.replace(/^#\/?/, '');
    if (hash) {
      if (currentHash !== hash) {
        // Use replaceState instead of window.location.hash to avoid firing hashchange
        isUpdatingHashRef.current = true;
        window.history.replaceState(null, '', `#/${hash}`);
        // Reset flag after browser event queue clears
        setTimeout(() => { isUpdatingHashRef.current = false; }, 0);
      }
    } else if (currentHash) {
      isUpdatingHashRef.current = true;
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setTimeout(() => { isUpdatingHashRef.current = false; }, 0);
    }
  }, [currentActiveTabForFocusedPane, isSidebarVisible, isSearchPanelVisible, isArticlesPanelVisible, isStatisticsPanelVisible]);

  // Dynamic tab title resolver for articles when asynchronous fetching completes
  useEffect(() => {
    if (devToArticles.length === 0) return;
    setEditorPanes(prevPanes => {
      let changed = false;
      const updatedPanes = { ...prevPanes };
      
      const updatePaneTabs = (paneId: EditorPaneId) => {
        const pane = prevPanes[paneId];
        const newTabs = pane.openTabs.map(tab => {
          if (tab.type === 'article_detail' && tab.articleId && tab.title === 'Article') {
            const article = devToArticles.find(a => a.id === tab.articleId);
            if (article) {
              changed = true;
              return { ...tab, title: article.title };
            }
          }
          return tab;
        });
        if (changed) {
          updatedPanes[paneId] = { ...pane, openTabs: newTabs };
        }
      };
      
      updatePaneTabs('left');
      updatePaneTabs('right');
      
      return changed ? updatedPanes : prevPanes;
    });
  }, [devToArticles]);

  const handleReorderSidebarItems = useCallback((draggedItemId: string, targetItemId: string, parentId?: string) => { setOrderedSidebarItems(prevItems => { const reorder = (items: SidebarItemConfig[], currentParentId?: string): SidebarItemConfig[] => { if (currentParentId === parentId) { const newItems = [...items]; const draggedIndex = newItems.findIndex(item => item.id === draggedItemId); const targetIndex = newItems.findIndex(item => item.id === targetItemId); if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) { const [dragged] = newItems.splice(draggedIndex, 1); newItems.splice(targetIndex, 0, dragged); playSound('ui-click'); addAppLog('debug', `Reordered sidebar item ${draggedItemId} to be near ${targetItemId}.`, 'User'); return newItems; } return items; } return items.map(item => { if (item.isFolder && item.children) { return { ...item, children: reorder(item.children, item.id) }; } return item; }); }; return reorder(prevItems, undefined); }); }, [addAppLog]);
  const handleReorderActivityBarItems = useCallback((draggedItemId: string, targetItemId: string) => { setOrderedActivityBarItemDefinitions(prevItems => { const draggedItemIndex = prevItems.findIndex(item => item.id === draggedItemId); const targetItemIndex = prevItems.findIndex(item => item.id === targetItemId); if (draggedItemIndex === -1 || targetItemIndex === -1 || draggedItemIndex === targetItemIndex) { return prevItems; } const newItems = [...prevItems]; const [draggedItem] = newItems.splice(draggedItemIndex, 1); newItems.splice(targetItemIndex, 0, draggedItem); playSound('ui-click'); addAppLog('debug', `Reordered activity bar item ${draggedItemId} to be near ${targetItemId}.`, 'User'); return newItems; }); }, [addAppLog]);

  const activityBarItems: ActivityBarItemConfig[] = useMemo(() => {
    return orderedActivityBarItemDefinitions.map(def => {
      let actionToCall: () => void;
      const featureStatusForThisItem = def.featureId ? featuresStatus[def.featureId] : 'active';
      const featureName = def.featureId ? ALL_FEATURE_IDS[def.featureId] : def.label;

      if (featureStatusForThisItem !== 'active') {
        actionToCall = () => {
          addNotificationAndLog(`The ${featureName} feature is currently under maintenance.`, 'warning', 5000, undefined, ICONS.HardHatIcon);
          addAppLog('warning', `Activity Bar action for '${def.label}' blocked due to maintenance of feature '${def.featureId}'.`, 'System');
        };
      } else {
        switch (def.viewId) {
          case 'explorer': actionToCall = toggleSidebarVisibility; break;
          case 'search': actionToCall = handleToggleSearchPanel; break;
          case 'source_control': actionToCall = handleToggleSourceControl; break;
          case 'articles': actionToCall = handleToggleArticlesPanel; break;
          case 'extensions': actionToCall = () => handleOpenTab({ id: 'extensions_marketplace', type: 'extensions', title: 'Extensions' }); break;
          case 'statistics': actionToCall = handleToggleStatisticsPanel; break;
          case 'github_profile_view': actionToCall = handleOpenGitHubProfileTab; break;
          case 'ai_chat_tab':actionToCall = handleOpenAIChatTab; break;
          case 'guest_book_activity': actionToCall = handleOpenGuestBookTab; break;
          default: actionToCall = () => {console.warn("Unknown activity bar item:", def.viewId); addAppLog('warning', `Unknown activity bar item action: ${def.viewId}`, 'System');}
        }
      }
      return { ...def, icon: ICONS[def.iconName] || ICONS.default, action: actionToCall, status: featureStatusForThisItem, featureId: def.featureId };
    });
  }, [ orderedActivityBarItemDefinitions, toggleSidebarVisibility, handleToggleSearchPanel, handleToggleArticlesPanel, handleToggleStatisticsPanel, handleOpenGitHubProfileTab, handleOpenAIChatTab, handleOpenGuestBookTab, handleToggleSourceControl, addAppLog, featuresStatus, addNotificationAndLog ]);
  const handleThemeChange = useCallback((themeName: string) => { rawHandleThemeChange(themeName); playSound('setting-change'); addAppLog('action', `Theme changed to: ${themeName}.`, 'User'); }, [rawHandleThemeChange, addAppLog]);
  const handleEditorFontFamilyChange = useCallback((fontId: string) => { rawHandleFontFamilyChange(fontId); playSound('setting-change'); const fontLabel = FONT_FAMILY_OPTIONS.find(f=>f.id === fontId)?.label || fontId; addAppLog('action', `Editor font family changed to: ${fontLabel}.`, 'User'); }, [rawHandleFontFamilyChange, addAppLog]);
  const handleEditorFontSizeChange = useCallback((sizeId: string) => { rawHandleEditorFontSizeChange(sizeId); playSound('setting-change'); const sizeLabel = FONT_SIZE_OPTIONS.find(s=>s.id === sizeId)?.label || sizeId; addAppLog('action', `Editor font size changed to: ${sizeLabel}.`, 'User'); }, [rawHandleEditorFontSizeChange, addAppLog]);
  const handleTerminalFontSizeChange = useCallback((sizeId: string) => { setCurrentTerminalFontSizeId(sizeId); playSound('setting-change'); const sizeLabel = TERMINAL_FONT_SIZE_OPTIONS.find(s=>s.id === sizeId)?.label || sizeId; addAppLog('action', `Terminal font size changed to: ${sizeLabel}.`, 'User'); }, [addAppLog]);
  const handleToggleFullscreen = useCallback(() => { rawHandleToggleFullscreen(); playSound('ui-click'); addAppLog('action', `Fullscreen mode ${isFullscreen ? 'exited' : 'entered'}.`, 'User'); }, [rawHandleToggleFullscreen, isFullscreen, addAppLog]);

  const handleToggleRightEditorPane = useCallback(() => {
    setIsRightEditorPaneVisible(prev => {
      const newVisibility = !prev;
      addAppLog('action', `Right editor pane ${newVisibility ? 'shown' : 'hidden'}.`, 'User');
      if (!newVisibility && focusedEditorPaneId === 'right') {
        setFocusedEditorPaneId('left');
      } else if (newVisibility && editorPanes.right.openTabs.length === 0 && editorPanes.left.activeTabId && editorPanes.left.openTabs.length > 1) {
        const tabToMove = editorPanes.left.openTabs.find(t => t.id !== editorPanes.left.activeTabId) || editorPanes.left.openTabs[0];
        if (tabToMove) {
            setEditorPanes(prevPanes => ({
                ...prevPanes,
                left: { ...prevPanes.left, openTabs: prevPanes.left.openTabs.filter(t => t.id !== tabToMove.id), activeTabId: prevPanes.left.activeTabId === tabToMove.id ? (prevPanes.left.openTabs.filter(t => t.id !== tabToMove.id)[0]?.id || null) : prevPanes.left.activeTabId },
                right: { ...prevPanes.right, openTabs: [tabToMove], activeTabId: tabToMove.id }
            }));
            setFocusedEditorPaneId('right');
            addAppLog('info', `Moved tab ${tabToMove.title} to right pane automatically.`, 'System');
        }
      }
      return newVisibility;
    });
    playSound('panel-toggle');
  }, [focusedEditorPaneId, editorPanes, addAppLog]);

  const handleFocusEditorPane = useCallback((paneId: EditorPaneId) => {
    if (paneId === 'right' && !isRightEditorPaneVisible) {
        setIsRightEditorPaneVisible(true); 
        addAppLog('info', `Right editor pane shown due to focus.`, 'System');
    }
    setFocusedEditorPaneId(paneId);
    playSound('ui-click');
    addAppLog('action', `Focused ${paneId} editor pane.`, 'User');
  }, [isRightEditorPaneVisible, addAppLog]);

  const handleMoveEditorToOtherPane = useCallback(() => {
    const sourcePaneId = focusedEditorPaneId;
    const targetPaneId: EditorPaneId = sourcePaneId === 'left' ? 'right' : 'left';
    const sourcePane = editorPanes[sourcePaneId];
    const activeTabInSource = sourcePane.openTabs.find(t => t.id === sourcePane.activeTabId);

    if (!activeTabInSource) return;
    addAppLog('action', `Moving tab "${activeTabInSource.title}" from ${sourcePaneId} to ${targetPaneId} pane.`, 'User');

    if (targetPaneId === 'right' && !isRightEditorPaneVisible) {
        setIsRightEditorPaneVisible(true);
        addAppLog('info', `Right editor pane shown for tab move.`, 'System');
    }

    const newSourceOpenTabs = sourcePane.openTabs.filter(t => t.id !== activeTabInSource.id);
    let newSourceActiveTabId: string | null = null;
    const sourceHistoryWithoutClosed = sourcePane.tabHistory.filter(id => id !== activeTabInSource.id);
    let newSourceHistoryIndex = sourcePane.currentHistoryIndex;
    if (sourcePane.tabHistory.indexOf(activeTabInSource.id) <= newSourceHistoryIndex) newSourceHistoryIndex--;
    newSourceHistoryIndex = Math.max(-1, newSourceHistoryIndex);

    if (newSourceHistoryIndex >= 0 && newSourceHistoryIndex < sourceHistoryWithoutClosed.length) {
      newSourceActiveTabId = sourceHistoryWithoutClosed[newSourceHistoryIndex];
    } else if (newSourceOpenTabs.length > 0) {
      newSourceActiveTabId = newSourceOpenTabs[0].id;
    }

    const targetPane = editorPanes[targetPaneId];
    const existingInTarget = targetPane.openTabs.find(t => t.id === activeTabInSource.id);
    let newTargetOpenTabs = [...targetPane.openTabs];
    if (!existingInTarget) {
        newTargetOpenTabs.push(activeTabInSource);
    }
    const newTargetActiveTabId = activeTabInSource.id;

    const newTargetHistoryBase = targetPane.tabHistory.slice(0, targetPane.currentHistoryIndex + 1);
    if (newTargetHistoryBase[newTargetHistoryBase.length -1] !== newTargetActiveTabId) {
        newTargetHistoryBase.push(newTargetActiveTabId);
    }

    setEditorPanes(prev => ({
        ...prev,
        [sourcePaneId]: {
            ...prev[sourcePaneId],
            openTabs: newSourceOpenTabs,
            activeTabId: newSourceActiveTabId,
            tabHistory: sourceHistoryWithoutClosed,
            currentHistoryIndex: newSourceHistoryIndex,
        },
        [targetPaneId]: {
            ...prev[targetPaneId],
            openTabs: newTargetOpenTabs,
            activeTabId: newTargetActiveTabId,
            tabHistory: newTargetHistoryBase,
            currentHistoryIndex: newTargetHistoryBase.length - 1,
        }
    }));

    setFocusedEditorPaneId(targetPaneId);
    playSound('ui-click');

  }, [editorPanes, focusedEditorPaneId, isRightEditorPaneVisible, addAppLog]);

  const handleClearLocalStorage = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all cached settings and reset the application to its defaults? This action cannot be undone.")) {
        addAppLog('action', 'User confirmed clearing local storage.', 'Settings');
        const keysToClear = [
            'portfolio-theme', 'portfolio-font-family', 'portfolio-font-size',
            'portfolio-terminal-font-size', 'portfolio-sidebarItemOrder',
            'portfolio-activityBarOrder', 'portfolio-editorPanes', 'portfolio-focusedEditorPaneId',
            'portfolio-isRightEditorPaneVisible', 'portfolio-editorSplitPercentage',
            'portfolio-isDevModeEnabled', 'portfolio-isSidebarVisible',
            'portfolio-isSearchPanelVisible', 'portfolio-isArticlesPanelVisible',
            'portfolio-isStatisticsPanelVisible', 'portfolio-leftPanelWidth',
            'portfolio-bottomPanelHeight', 'portfolio-isBottomPanelVisible',
            'portfolio-activeBottomPanelId', 'portfolio-chatMessages',
            'portfolio-guestbook-nickname', 'portfolio-guestbook-github-username',
            'portfolio-soundMuted', 'portfolio-theme-customizations' // Added theme customizations
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
        addNotificationAndLog("All cached settings have been cleared. Reloading application...", 'success', 4000, undefined, ICONS.CheckCircle2);
        setTimeout(() => {
            window.location.reload();
        }, 1500); 
    } else {
        addAppLog('info', 'User cancelled clearing local storage.', 'Settings');
    }
  }, [addAppLog, addNotificationAndLog]);

  const toggleFeatureStatusAdminPanel = useCallback(() => {
    if (!isDevModeEnabled) {
      addNotificationAndLog("Developer Mode must be enabled to access this panel.", 'warning', 5000);
      return;
    }
    setIsFeatureStatusAdminPanelOpen(prev => !prev);
    playSound('modal-toggle');
    addAppLog('action', `Feature Status Admin Panel ${!isFeatureStatusAdminPanelOpen ? 'opened' : 'closed'}.`, 'DevAdmin');
  }, [isDevModeEnabled, addNotificationAndLog, isFeatureStatusAdminPanelOpen]);

  const handleSaveFeatureStatusesToFirebase = useCallback(async (newStatuses: FeaturesStatusState) => {
    addAppLog('action', 'Attempting to save feature statuses to Firebase.', 'DevAdmin', { newStatuses });
    const featureStatusesRef = ref(database, 'feature_statuses');
    try {
      await firebaseSet(featureStatusesRef, newStatuses); // Use `set` to overwrite the entire node
      setFeaturesStatus(newStatuses); // Update local state immediately on successful save
      addNotificationAndLog('Feature statuses saved to Firebase successfully!', 'success', 3000);
      setIsFeatureStatusAdminPanelOpen(false); // Close panel on success
    } catch (error: any) {
      console.error("Error saving feature statuses to Firebase:", error);
      addAppLog('error', 'Failed to save feature statuses to Firebase.', 'DevAdmin', { error: error.message });
      addNotificationAndLog(`Error saving to Firebase: ${error.message}`, 'error', 7000);
      throw error; // Re-throw to allow admin panel to handle UI state like `isSaving`
    }
  }, [addAppLog, addNotificationAndLog]);


  const commands = useMemo(() => generateCommands({
    sidebarItems: orderedSidebarItems.flatMap(item => item.isFolder && item.children ? item.children.filter(child => !child.isFolder) : (item.isFolder ? [] : [item])),
    handleOpenTab, closeCommandPalette, isSidebarVisible, toggleSidebarVisibility, handleOpenAIChatTab, openCommandPalette,
    predefinedThemes: PREDEFINED_THEMES, handleThemeChange, currentThemeName,
    fontFamilyOptions: FONT_FAMILY_OPTIONS, handleFontFamilyChange: handleEditorFontFamilyChange, currentFontFamilyId: currentFontFamilyId,
    fontSizeOptions: FONT_SIZE_OPTIONS, handleFontSizeChange: handleEditorFontSizeChange, currentFontSizeId: currentEditorFontSizeId,
    openAboutModal, icons: ICONS, handleToggleSearchPanel, handleToggleArticlesPanel, handleToggleStatisticsPanel, 
    handleToggleGitHubPanel: handleOpenGitHubProfileTab, 
    handleOpenGuestBook: handleOpenGuestBookTab,
    toggleTerminalVisibility: handleToggleBottomPanelStatusBar, // Updated to use generic toggle
    togglePetsPanelVisibility: togglePetsPanel, // Specific toggles can still exist for targeted actions
    toggleLogsPanelVisibility: toggleLogsPanel,   // Specific toggles can still exist for targeted actions
    handleToggleSoundMute, isSoundMuted, handleRunCVGenerator, handleOpenSettingsEditor,
    terminalFontSizes: TERMINAL_FONT_SIZE_OPTIONS, currentTerminalFontSizeId, handleTerminalFontSizeChange,
    handleToggleRightEditorPane, handleFocusEditorPane, handleMoveEditorToOtherPane, addAppLog,
    featuresStatus, addNotification: addNotificationAndLog,
    isDevModeEnabled, // Pass dev mode status
    toggleFeatureStatusAdminPanel, // Pass handler for admin panel
  }), [
    orderedSidebarItems, handleOpenTab, closeCommandPalette, isSidebarVisible, toggleSidebarVisibility, handleOpenAIChatTab,
    openCommandPalette, PREDEFINED_THEMES, handleThemeChange, currentThemeName, FONT_FAMILY_OPTIONS, handleEditorFontFamilyChange,
    currentFontFamilyId, FONT_SIZE_OPTIONS, handleEditorFontSizeChange, currentEditorFontSizeId, openAboutModal, ICONS,
    handleToggleSearchPanel, handleToggleArticlesPanel, handleToggleStatisticsPanel, handleOpenGitHubProfileTab, handleOpenGuestBookTab,
    handleToggleBottomPanelStatusBar, togglePetsPanel, toggleLogsPanel, // Updated toggle for terminal/bottom panel
    handleToggleSoundMute, isSoundMuted, handleRunCVGenerator, handleOpenSettingsEditor,
    currentTerminalFontSizeId, handleTerminalFontSizeChange,
    handleToggleRightEditorPane, handleFocusEditorPane, handleMoveEditorToOtherPane, addAppLog,
    featuresStatus, addNotificationAndLog, isDevModeEnabled, toggleFeatureStatusAdminPanel, // Add new dependencies
  ]);

  const getGitHubUsername = (): string | undefined => {
    if (PORTFOLIO_DATA.otherSocial?.name === 'GitHub' && PORTFOLIO_DATA.otherSocial.url) {
        const parts = PORTFOLIO_DATA.otherSocial.url.split('/');
        return parts.pop() || parts.pop(); 
    }
    return undefined;
  };


  const activeContentDetailsForLeftPane: TabContentProps['content'] | AIChatInterfaceProps | null = useMemo(() => {
    const activeTab = editorPanes.left.openTabs.find(tab => tab.id === editorPanes.left.activeTabId);
    if (!activeTab) return null;

    if (activeTab.type === 'ai_chat') {
        const aiChatProps: AIChatInterfaceProps = {
            portfolioData: PORTFOLIO_DATA,
            addAppLog,
            messages: chatMessages,
            input: chatInput,
            setInput: setChatInput,
            isLoading: chatIsLoading,
            error: chatError,
            apiKeyAvailable: chatApiKeyAvailable,
            onSendMessage: handleChatSendMessage,
            handleOpenTab: handleOpenTab,
            currentPaneIdForChat: 'left' as EditorPaneId,
            featureStatus: featuresStatus.aiChat,
        };
        return aiChatProps;
    }
    if (activeTab.type === 'project_detail') return aiGeneratedProjects.find(p => p.id === activeTab.id) || JSON.parse(generateProjectDetailContent(activeTab.id, PORTFOLIO_DATA));
    if (activeTab.type === 'json_preview' && activeTab.fileName) { const originalFile = editorPanes.left.openTabs.find(t => t.id === activeTab.fileName) || orderedSidebarItems.flatMap(item => item.children || [item]).find(item => item.id === activeTab.fileName); if (originalFile?.id?.startsWith('project_')) return JSON.parse(generateProjectDetailContent(originalFile.id, PORTFOLIO_DATA)); return generateFileContent(activeTab.fileName, PORTFOLIO_DATA); }
    if (activeTab.type === 'extensions') {
      return { title: 'Extensions Marketplace', description: 'Browse and install VS Code extensions (demo)' };
    }
    if (activeTab.type === 'achievements') {
      return { title: 'Achievements', description: 'Unlocked badges and milestones' };
    }
    if (activeTab.type === 'support') {
      return { title: 'Support the Creator', description: 'Ways to support development' };
    }
    if (activeTab.type === 'article_detail' && activeTab.articleId) { 
      const article = devToArticles.find(a => a.id === activeTab.articleId); 
      if (article) return article;
      // Richer fallback so the detail view still renders nicely (no broken image state)
      return { 
        id: activeTab.articleId as any, 
        title: activeTab.title || "Article", 
        slug: activeTab.articleSlug || String(activeTab.articleId),
        description: "Article content could not be loaded.",
        body_markdown: "# Article content unavailable\n\nThe article data could not be found. This can happen after a page refresh or deep link before articles finish loading.",
        user: { name: "Unknown Source", username: "unknown" } as any,
        cover_image: null,
        social_image: null,
        readable_publish_date: "",
        reading_time_minutes: 1,
        tag_list: [],
        category: "",
      } as any; 
    }
    if (activeTab.type === 'cv_preview') return PORTFOLIO_DATA;
    if (activeTab.type === 'settings_editor') {
        const settingsProps: SettingsEditorProps = {
            isSoundMuted, handleToggleSoundMute, 
            themes: PREDEFINED_THEMES, currentThemeName, onThemeChange: handleThemeChange, 
            fontFamilies: FONT_FAMILY_OPTIONS, currentFontFamilyId, onFontFamilyChange: handleEditorFontFamilyChange, 
            editorFontSizes: FONT_SIZE_OPTIONS, currentEditorFontSizeId, onEditorFontSizeChange: handleEditorFontSizeChange, 
            terminalFontSizes: TERMINAL_FONT_SIZE_OPTIONS, currentTerminalFontSizeId, onTerminalFontSizeChange: handleTerminalFontSizeChange, 
            isDevModeEnabled, onToggleDevMode: handleToggleDevMode,
            currentUser, userGuestBookNickname, onUserGuestBookNicknameChange: handleUserGuestBookNicknameChange,
            userGitHubUsername, onUserGitHubUsernameChange: handleUserGitHubUsernameChange,
            onSaveUserPreferences: handleSaveUserPreferences, addNotificationAndLog,
            onClearLocalStorage: handleClearLocalStorage,
            featureStatus: featuresStatus.settingsEditor,
            customColorOverrides,
            currentThemeBaseProperties,
            onApplyCustomColorOverride: applyCustomColorOverride,
            onSaveCustomThemeOverrides: saveCustomThemeOverrides,
            onResetCustomThemeOverrides: resetCustomThemeOverrides,
            onResetSingleColorOverride: resetSingleColorOverride,
        };
        return settingsProps;
    }
    if (activeTab.type === 'github_profile_view') return { username: activeTab.githubUsername || getGitHubUsername(), mockStats: MOCK_GITHUB_STATS, featureStatus: featuresStatus.githubProfileView };
    if (activeTab.type === 'guest_book') return { addAppLog, currentUser, userGuestBookNickname, userGitHubUsername, featureStatus: featuresStatus.guestBook }; 
    if (activeTab.type === 'spotify_view') return true;
    if (activeTab.fileName) return generateFileContent(activeTab.fileName, PORTFOLIO_DATA);
    return null;
  }, [
    editorPanes.left.activeTabId, editorPanes.left.openTabs, PORTFOLIO_DATA, orderedSidebarItems, aiGeneratedProjects, 
    isSoundMuted, handleToggleSoundMute, currentThemeName, handleThemeChange, currentFontFamilyId, handleEditorFontFamilyChange, 
    currentEditorFontSizeId, handleEditorFontSizeChange, currentTerminalFontSizeId, handleTerminalFontSizeChange, 
    isDevModeEnabled, handleToggleDevMode, chatMessages, chatInput, setChatInput, chatIsLoading, chatError, 
    chatApiKeyAvailable, handleChatSendMessage, handleOpenTab, addAppLog, currentUser, userGuestBookNickname, 
    userGitHubUsername, handleUserGuestBookNicknameChange, handleUserGitHubUsernameChange, handleSaveUserPreferences, 
    addNotificationAndLog, devToArticles, handleClearLocalStorage, featuresStatus,
    customColorOverrides, currentThemeBaseProperties, applyCustomColorOverride, saveCustomThemeOverrides, resetCustomThemeOverrides, resetSingleColorOverride // Added theme customization dependencies
  ]);
  
  const activeContentDetailsForRightPane: TabContentProps['content'] | AIChatInterfaceProps | null = useMemo(() => {
    const activeTab = editorPanes.right.openTabs.find(tab => tab.id === editorPanes.right.activeTabId);
    if (!activeTab) return null;
    if (activeTab.type === 'ai_chat') {
        const aiChatProps: AIChatInterfaceProps = {
            portfolioData: PORTFOLIO_DATA,
            addAppLog,
            messages: chatMessages,
            input: chatInput,
            setInput: setChatInput,
            isLoading: chatIsLoading,
            error: chatError,
            apiKeyAvailable: chatApiKeyAvailable,
            onSendMessage: handleChatSendMessage,
            handleOpenTab: handleOpenTab,
            currentPaneIdForChat: 'right' as EditorPaneId,
            featureStatus: featuresStatus.aiChat,
        };
        return aiChatProps;
    }
    if (activeTab.type === 'project_detail') return aiGeneratedProjects.find(p => p.id === activeTab.id) || JSON.parse(generateProjectDetailContent(activeTab.id, PORTFOLIO_DATA));
    if (activeTab.type === 'json_preview' && activeTab.fileName) { const originalFile = editorPanes.right.openTabs.find(t => t.id === activeTab.fileName) || orderedSidebarItems.flatMap(item => item.children || [item]).find(item => item.id === activeTab.fileName); if (originalFile?.id?.startsWith('project_')) return JSON.parse(generateProjectDetailContent(originalFile.id, PORTFOLIO_DATA)); return generateFileContent(activeTab.fileName, PORTFOLIO_DATA); }
    if (activeTab.type === 'extensions') {
      return { title: 'Extensions Marketplace', description: 'Browse and install VS Code extensions (demo)' };
    }
    if (activeTab.type === 'achievements') {
      return { title: 'Achievements', description: 'Unlocked badges and milestones' };
    }
    if (activeTab.type === 'support') {
      return { title: 'Support the Creator', description: 'Ways to support development' };
    }
    if (activeTab.type === 'article_detail' && activeTab.articleId) { 
      const article = devToArticles.find(a => a.id === activeTab.articleId); 
      if (article) return article;
      // Richer fallback so the detail view still renders nicely (no broken image state)
      return { 
        id: activeTab.articleId as any, 
        title: activeTab.title || "Article", 
        slug: activeTab.articleSlug || String(activeTab.articleId),
        description: "Article content could not be loaded.",
        body_markdown: "# Article content unavailable\n\nThe article data could not be found. This can happen after a page refresh or deep link before articles finish loading.",
        user: { name: "Unknown Source", username: "unknown" } as any,
        cover_image: null,
        social_image: null,
        readable_publish_date: "",
        reading_time_minutes: 1,
        tag_list: [],
        category: "",
      } as any; 
    }
    if (activeTab.type === 'cv_preview') return PORTFOLIO_DATA;
    if (activeTab.type === 'settings_editor') {
      const settingsProps: SettingsEditorProps = {
            isSoundMuted, handleToggleSoundMute, 
            themes: PREDEFINED_THEMES, currentThemeName, onThemeChange: handleThemeChange, 
            fontFamilies: FONT_FAMILY_OPTIONS, currentFontFamilyId, onFontFamilyChange: handleEditorFontFamilyChange, 
            editorFontSizes: FONT_SIZE_OPTIONS, currentEditorFontSizeId, onEditorFontSizeChange: handleEditorFontSizeChange, 
            terminalFontSizes: TERMINAL_FONT_SIZE_OPTIONS, currentTerminalFontSizeId, onTerminalFontSizeChange: handleTerminalFontSizeChange, 
            isDevModeEnabled, onToggleDevMode: handleToggleDevMode,
            currentUser, userGuestBookNickname, onUserGuestBookNicknameChange: handleUserGuestBookNicknameChange,
            userGitHubUsername, onUserGitHubUsernameChange: handleUserGitHubUsernameChange,
            onSaveUserPreferences: handleSaveUserPreferences, addNotificationAndLog,
            onClearLocalStorage: handleClearLocalStorage,
            featureStatus: featuresStatus.settingsEditor,
            customColorOverrides,
            currentThemeBaseProperties,
            onApplyCustomColorOverride: applyCustomColorOverride,
            onSaveCustomThemeOverrides: saveCustomThemeOverrides,
            onResetCustomThemeOverrides: resetCustomThemeOverrides,
            onResetSingleColorOverride: resetSingleColorOverride,
        };
        return settingsProps;
    }
    if (activeTab.type === 'github_profile_view') return { username: activeTab.githubUsername || getGitHubUsername(), mockStats: MOCK_GITHUB_STATS, featureStatus: featuresStatus.githubProfileView };
    if (activeTab.type === 'guest_book') return { addAppLog, currentUser, userGuestBookNickname, userGitHubUsername, featureStatus: featuresStatus.guestBook }; 
    if (activeTab.type === 'spotify_view') return true;
    if (activeTab.fileName) return generateFileContent(activeTab.fileName, PORTFOLIO_DATA);
    return null;
  }, [
    editorPanes.right.activeTabId, editorPanes.right.openTabs, PORTFOLIO_DATA, orderedSidebarItems, aiGeneratedProjects, 
    isSoundMuted, handleToggleSoundMute, currentThemeName, handleThemeChange, currentFontFamilyId, handleEditorFontFamilyChange, 
    currentEditorFontSizeId, handleEditorFontSizeChange, currentTerminalFontSizeId, handleTerminalFontSizeChange, 
    isDevModeEnabled, handleToggleDevMode, chatMessages, chatInput, setChatInput, chatIsLoading, chatError, 
    chatApiKeyAvailable, handleChatSendMessage, handleOpenTab, addAppLog, currentUser, userGuestBookNickname, 
    userGitHubUsername, handleUserGuestBookNicknameChange, handleUserGitHubUsernameChange, handleSaveUserPreferences, 
    addNotificationAndLog, devToArticles, handleClearLocalStorage, featuresStatus,
    customColorOverrides, currentThemeBaseProperties, applyCustomColorOverride, saveCustomThemeOverrides, resetCustomThemeOverrides, resetSingleColorOverride // Added theme customization dependencies
  ]);

  const renderEditorPane = (paneId: EditorPaneId) => {
    const paneState = editorPanes[paneId];
    const activeContent = paneId === 'left' ? activeContentDetailsForLeftPane : activeContentDetailsForRightPane;
    const currentActiveTab = paneState.openTabs.find(tab => tab.id === paneState.activeTabId);

    return (
      <div className="flex flex-col h-full overflow-hidden" onClick={() => handleFocusEditorPane(paneId)} role="tabpanel" aria-labelledby={`pane-tab-${paneId}`}>
        <EditorTabs
          tabs={paneState.openTabs}
          activeTabId={paneState.activeTabId}
          onSelectTab={(tabId) => handleSelectTab(paneId, tabId)}
          onCloseTab={(tabId) => handleCloseTab(paneId, tabId)}
          onContextMenuRequest={(x, y, tabId, isCVContext) => handleEditorContextMenuRequest(x, y, tabId, paneId, isCVContext)}
          isLoading={(isPreviewTabLoading && paneState.activeTabId?.endsWith('_preview')) || (paneState.activeTabId === 'guest_book_tab' && (activeContent as any)?.isFetchingInitialEntries)}
          onReorderTabs={(draggedTabId, targetTabId) => handleReorderOpenTabs(paneId, draggedTabId, targetTabId)}
          onRunCVGeneratorFromTab={handleRunCVGenerator}
          className={focusedEditorPaneId === paneId ? 'border-b-2 border-[var(--focus-border)] -mb-px z-10' : ''}
          paneId={paneId}
        />
        <Breadcrumbs activeTab={currentActiveTab} portfolioData={PORTFOLIO_DATA} onOpenTab={(config) => handleOpenTab(config, false, paneId)} paneId={paneId}/>
        <div className="flex-1 overflow-auto relative animate-fadeIn bg-[var(--editor-background)]">
          {currentActiveTab && activeContent ? ( 
            <TabContent
              key={currentActiveTab.id}
              tab={currentActiveTab}
              content={activeContent} 
              portfolioData={PORTFOLIO_DATA}
              onOpenProjectTab={(projectId, projectTitle) => handleOpenProjectTab(projectId, projectTitle)}
              currentThemeName={currentThemeName}
              onContextMenuRequest={(x,y,tabId,isCVContext) => handleEditorContextMenuRequest(x,y,tabId,paneId,isCVContext)}
              aiGeneratedProjects={aiGeneratedProjects}
              onSuggestNewAIProject={handleSuggestNewAIProject}
              isAISuggestingProject={isAISuggestingProject}
              paneId={paneId} 
              addAppLog={addAppLog}
              featureStatusForProjectsView={featuresStatus.projectsView} 
              allArticles={devToArticles}
              onOpenArticle={handleOpenArticleTab}
              onCloseTab={(tabId) => handleCloseTab(paneId, tabId)}
              addNotificationAndLog={addNotificationAndLog}
            />
          ) : (
            <WelcomeView 
                portfolioData={PORTFOLIO_DATA} 
                onOpenTab={(config) => handleOpenTab(config, false, paneId)} 
                onOpenAIChat={handleOpenAIChatTab} 
                onFocusTerminal={handleFocusTerminal}
                onOpenGuestBook={handleOpenGuestBookTab}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell flex flex-col h-screen bg-[var(--app-background)] text-[var(--text-default)] overflow-hidden">
      <TitleBar
        onToggleSidebar={toggleSidebarVisibility}
        isSidebarVisible={isSidebarVisible}
        onOpenCommandPalette={openCommandPalette}
        onOpenAboutModal={openAboutModal}
        canNavigateBack={editorPanes[focusedEditorPaneId].currentHistoryIndex > 0}
        canNavigateForward={editorPanes[focusedEditorPaneId].currentHistoryIndex < editorPanes[focusedEditorPaneId].tabHistory.length - 1}
        onNavigateBack={() => navigateTabHistoryBack(focusedEditorPaneId)}
        onNavigateForward={() => navigateTabHistoryForward(focusedEditorPaneId)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        sidebarItems={orderedSidebarItems}
        projectsData={PORTFOLIO_DATA.projects}
        onRunItem={(config) => handleOpenTab(config, true, focusedEditorPaneId)}
        onRunCVGenerator={handleRunCVGenerator}
        onToggleTerminal={toggleTerminalPanel}
        onTogglePetsPanel={togglePetsPanel}
        onToggleLogsPanel={toggleLogsPanel}
        onToggleStatisticsPanel={handleToggleStatisticsPanel}
        onToggleGitHubPanel={handleOpenGitHubProfileTab} 
        onToggleGuestBookPanel={handleOpenGuestBookTab}
        isSoundMuted={isSoundMuted}
        onToggleSoundMute={handleToggleSoundMute}
        onOpenSettingsEditor={handleOpenSettingsEditor}
        onToggleRightEditorPane={handleToggleRightEditorPane}
        onFocusEditorPane={handleFocusEditorPane}
        onMoveEditorToOtherPane={handleMoveEditorToOtherPane}
        onToggleProfilePopup={handleToggleProfilePopup} 
        featuresStatus={featuresStatus}
        addNotificationAndLog={addNotificationAndLog}
      />
      <main className="flex-1 flex overflow-hidden">
        <ActivityBar
          items={activityBarItems}
          onReorder={handleReorderActivityBarItems}
          activeViewId={activityBarSelection}
          onOpenSettingsEditor={handleOpenSettingsEditor}
        />
        {(isSidebarVisible || isSearchPanelVisible || isArticlesPanelVisible || isStatisticsPanelVisible || isSourceControlVisible) && ( 
          <div ref={leftPanelContainerRef} className="flex"> 
            <div className="flex-shrink-0 overflow-hidden" style={{ width: `${leftPanelWidth}px` }}>
              {isSidebarVisible && featuresStatus.explorer === 'active' && <Sidebar items={orderedSidebarItems} onOpenTab={(item) => handleOpenTab(item, false, focusedEditorPaneId)} onRunAction={handleSidebarAction} isVisible={isSidebarVisible} activeTabId={editorPanes[focusedEditorPaneId].activeTabId} onReorderItems={handleReorderSidebarItems} onContextMenuRequest={handleSidebarItemContextMenuRequest} />}
              {isSidebarVisible && featuresStatus.explorer !== 'active' && <MaintenanceView featureName={ALL_FEATURE_IDS.explorer} featureIcon={ICONS.files_icon}/>}

              {isSearchPanelVisible && <SearchPanel isVisible={isSearchPanelVisible} searchTerm={globalSearchTerm} onSearchTermChange={setGlobalSearchTerm} results={searchResults} onResultClick={(result) => { handleOpenTab({ id: result.fileId, fileName: result.fileId, type: result.tabType, title: result.fileDisplayPath }, false, focusedEditorPaneId); playSound('ui-click');}} onClose={() => { setIsSearchPanelVisible(false); if(activityBarSelection === 'search') setActivityBarSelection(null); }} featureStatus={featuresStatus.searchPanel}/>}
              
              {isArticlesPanelVisible && (
                <ArticlesPanel 
                    isVisible={isArticlesPanelVisible} 
                    articles={devToArticles} 
                    isLoading={articlesLoading}
                    error={articlesError}
                    onClose={() => {setIsArticlesPanelVisible(false); if(activityBarSelection === 'articles') setActivityBarSelection(null);}} 
                    onSelectArticle={handleOpenArticleTab} 
                    activeArticleSlug={currentActiveTabForFocusedPane?.type === 'article_detail' ? currentActiveTabForFocusedPane.articleSlug || null : null}
                    onRetryFetch={handleRetryFetchArticles}
                    featureStatus={featuresStatus.articlesPanel}
                />
              )}
              {isStatisticsPanelVisible && <StatisticsPanel isVisible={isStatisticsPanelVisible} statisticsData={statisticsData} isLoading={isLoadingStatistics} error={statisticsError} onClose={() => {setIsStatisticsPanelVisible(false); if(activityBarSelection === 'statistics') setActivityBarSelection(null);}} featureStatus={featuresStatus.statisticsPanel}/>}

              {isSourceControlVisible && <SourceControlPanel isVisible={isSourceControlVisible} onClose={() => { setIsSourceControlVisible(false); if(activityBarSelection === 'source_control') setActivityBarSelection(null); }} featureStatus={featuresStatus.sourceControl} />}
            </div>
            <div ref={leftResizerRef} onMouseDown={handleLeftPanelResizeStart} onTouchStart={handleLeftPanelResizeStart} className="resizer resizer-x"></div>
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden" style={{ width: isRightEditorPaneVisible ? `${editorSplitPercentage}%` : '100%' }}>
              {renderEditorPane('left')}
            </div>
            {isRightEditorPaneVisible && (
              <>
                <div ref={editorResizerRef} onMouseDown={handleEditorResizeStart} onTouchStart={handleEditorResizeStart} className="editor-resizer-x"></div>
                <div className="flex-1 overflow-hidden" style={{ width: `${100 - editorSplitPercentage}%` }}>
                  {renderEditorPane('right')}
                </div>
              </>
            )}
          </div>
          {isBottomPanelVisible && (
            <>
              <div ref={bottomResizerRef} onMouseDown={handleBottomPanelResizeStart} onTouchStart={handleBottomPanelResizeStart} className="resizer resizer-y"></div>
              <div className="flex-shrink-0" style={{ height: `${bottomPanelHeight}px` }}>
                <BottomPanelTabs
                    tabs={[
                        { id: 'terminal', title: 'Terminal', icon: ICONS.TerminalIcon, featureId: 'terminal' },
                        { id: 'pets', title: 'Pets', icon: ICONS.CatIcon, featureId: 'petsPanel' },
                        { id: 'logs', title: 'Logs', icon: ICONS.LogsIcon, featureId: 'logsPanel' },
                    ]}
                    activeTabId={activeBottomPanelId}
                    onSelectTab={handleSelectBottomPanelTab}
                    featuresStatus={featuresStatus}
                />
                {activeBottomPanelId === 'terminal' && (
                  <TerminalPanel 
                    output={terminalOutput} 
                    onClose={handleCloseBottomPanel}
                    inputValue={terminalInputValue}
                    onInputChange={setTerminalInputValue}
                    onCommandSubmit={handleTerminalCommand}
                    featureStatus={featuresStatus.terminal}
                  />
                )}
                {activeBottomPanelId === 'pets' && <PetsPanel onClose={handleCloseBottomPanel} featureStatus={featuresStatus.petsPanel} />}
                {activeBottomPanelId === 'logs' && <LogsPanel logs={logs} onClose={handleCloseBottomPanel} featureStatus={featuresStatus.logsPanel}/>}
              </div>
            </>
          )}
        </div>
      </main>
      <StatusBar 
        version={APP_VERSION} 
        currentThemeName={currentThemeName} 
        isSoundMuted={isSoundMuted} 
        onToggleSoundMute={handleToggleSoundMute}
        notificationsCount={notificationsHook.notifications.length}
        onOpenCommandPalette={openCommandPalette}
        onOpenAboutModal={openAboutModal}
        isBottomPanelVisible={isBottomPanelVisible} 
        onToggleBottomPanel={handleToggleBottomPanelStatusBar}
        onOpenSpotify={handleOpenSpotifyTab}
      />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} commands={commands} />
      <AboutModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
      <PasskeyPromptModal isOpen={isPasskeyPromptOpen} onClose={() => handlePasskeySubmit(null)} onSubmit={handlePasskeySubmit} />
      {isProfilePopupOpen && profilePopupAnchorEl && (
        <ProfilePopup 
            isOpen={isProfilePopupOpen} 
            onClose={() => handleToggleProfilePopup()} 
            anchorEl={profilePopupAnchorEl}
            portfolioData={PORTFOLIO_DATA}
        />
      )}
      {isDevModeEnabled && (
        <FeatureStatusAdminPanel
          isOpen={isFeatureStatusAdminPanelOpen}
          onClose={toggleFeatureStatusAdminPanel}
          currentStatuses={featuresStatus}
          onSaveChangesToFirebase={handleSaveFeatureStatusesToFirebase}
          allFeatureIds={ALL_FEATURE_IDS}
        />
      )}
      <ContextMenu
        x={editorContextMenuState.x}
        y={editorContextMenuState.y}
        items={editorContextMenuState.items}
        visible={editorContextMenuState.visible}
        onClose={closeEditorContextMenu}
      />
      <ContextMenu
        x={sidebarContextMenuState.x}
        y={sidebarContextMenuState.y}
        items={sidebarContextMenuState.items}
        visible={sidebarContextMenuState.visible}
        onClose={closeSidebarContextMenu}
      />
      <NotificationContainer notifications={notificationsHook.notifications} onDismissNotification={rawRemoveNotification} />
    </div>
  );
};

export default App;
