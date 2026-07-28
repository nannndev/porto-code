
import React, { useEffect, useRef, useState } from 'react';
import { ICONS, PORTFOLIO_DATA } from '../../App/constants';
import { AppMenuItem, SidebarItemConfig, Tab, ProjectDetail, EditorPaneId, FeaturesStatusState, NotificationType, LogLevel } from '../../App/types';
import { playSound } from '../../Utils/audioUtils';
import MenuBar from '../../UI/MenuBar/MenuBar';
import { generateMenuConfig } from './titleBarMenu';
import { LucideIcon } from 'lucide-react';


export interface TitleBarProps { // Made exportable for potential use elsewhere, though not strictly necessary for this fix
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
  onOpenCommandPalette: () => void;
  onOpenAboutModal: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  sidebarItems: SidebarItemConfig[];
  projectsData: ProjectDetail[];
  onRunItem: (config: { id: string, fileName: string, title: string, type: Tab['type'] }) => void;
  onRunCVGenerator: () => void;
  onToggleTerminal: () => void;
  onTogglePetsPanel: () => void;
  onToggleLogsPanel: () => void;
  onToggleStatisticsPanel: () => void;
  onToggleGitHubPanel: () => void; 
  onToggleGuestBookPanel: () => void; 
  isSoundMuted: boolean;
  onToggleSoundMute: () => void;
  onOpenSettingsEditor: () => void;
  className?: string;
  onToggleRightEditorPane: () => void;
  onFocusEditorPane: (paneId: EditorPaneId) => void;
  onMoveEditorToOtherPane: () => void;
  onToggleProfilePopup: (event: React.MouseEvent<HTMLButtonElement>) => void; 
  featuresStatus: FeaturesStatusState; // Added
  addNotificationAndLog: (message: string, type: NotificationType, duration?: number, actions?: any[], icon?: LucideIcon) => void; // Added
}

export const TitleBar: React.FC<TitleBarProps> = (props) => { 
  const {
    onToggleSidebar, isSidebarVisible, onOpenCommandPalette, onOpenAboutModal,
    canNavigateBack, canNavigateForward, onNavigateBack, onNavigateForward,
    isFullscreen, onToggleFullscreen,
    sidebarItems, projectsData, onRunItem, onRunCVGenerator,
    onToggleTerminal, onTogglePetsPanel, onToggleLogsPanel, onToggleStatisticsPanel, onToggleGitHubPanel, onToggleGuestBookPanel,
    isSoundMuted, onToggleSoundMute,
    onOpenSettingsEditor,
    className,
    onToggleRightEditorPane,
    onFocusEditorPane,
    onMoveEditorToOtherPane,
    onToggleProfilePopup,
    featuresStatus, // Destructure
    addNotificationAndLog // Destructure
  } = props;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
    if (activeMenu !== menuName && menuName) {
        playSound('ui-click');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (activeMenu) {
            setActiveMenu(null);
        }
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeMenu]);

  const menuConfig = generateMenuConfig({
    onOpenCommandPalette,
    onToggleSidebar,
    isSidebarVisible,
    onOpenAboutModal,
    icons: ICONS,
    sidebarItems,
    projectsData,
    onRunItem,
    onRunCVGenerator,
    onToggleTerminal,
    onTogglePetsPanel,
    onToggleLogsPanel, 
    onToggleStatisticsPanel,
    onToggleGitHubPanel, 
    onToggleGuestBookPanel, 
    onOpenSettingsEditor,
    isSoundMuted, 
    onToggleSoundMute, 
    onToggleRightEditorPane,
    onFocusEditorPane,
    onMoveEditorToOtherPane,
    featuresStatus, // Pass down
    addNotificationAndLog, // Pass down
    canNavigateBack,
    canNavigateForward,
    onNavigateBack,
    onNavigateForward,
  });

  const MenuDropdownIcon = ICONS.chevron_down_icon;

  const renderSubItems = (items: AppMenuItem[], level = 0): JSX.Element => (
    <div
        className={`
          ${level === 0 ? 'absolute top-[calc(100%+10px)] left-0' : 'relative'}
          bg-[var(--menu-dropdown-background)] border border-[var(--menu-dropdown-border)]
          menu-dropdown rounded-2xl shadow-lg p-1.5 z-[220] min-w-[248px] text-[var(--menu-item-foreground)]
        `}
    >
      {items.map((subItem, index) => {
        if (subItem.separator) {
          return <hr key={`sep-${index}`} className="menu-glass-separator my-1.5 border-[var(--menubar-separator-color)]" />;
        }
        const itemKey = subItem.label || `menu-item-${index}`;

        return subItem.subItems ? (
          <div key={itemKey} className="relative group/submenu">
            <button
              className={`menu-item-glass w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-all rounded-xl
                          ${subItem.isSelected ? 'bg-[var(--menu-item-selected-background)] text-[var(--menu-item-selected-foreground)]' : 'hover:bg-[var(--menu-item-hover-background)] hover:text-[var(--menu-item-hover-foreground)]'}`}
            >
              <div className="flex items-center">
                {subItem.icon && <subItem.icon size={14} className="mr-2 text-[var(--menu-item-icon-foreground)]" />}
                {subItem.label}
              </div>
              {MenuDropdownIcon && <MenuDropdownIcon size={14} className="-rotate-90 text-[var(--menu-item-icon-foreground)]" />}
            </button>
            <div className="absolute left-full top-0 hidden group-hover/submenu:block group-focus-within/submenu:block -mt-1 ml-px">
                {renderSubItems(subItem.subItems, level + 1)}
            </div>
          </div>
        ) : (
          <button
            key={itemKey}
            onClick={() => {
              if (subItem.action) {
                  subItem.action();
                  if (!subItem.label?.startsWith('Run ') && subItem.label !== 'Settings') {
                     playSound('command-execute');
                  }
              }
              setActiveMenu(null);
            }}
            className={`menu-item-glass w-full text-left px-3 py-2 text-xs flex items-center transition-all rounded-xl
                        ${subItem.isSelected ? 'bg-[var(--menu-item-selected-background)] text-[var(--menu-item-selected-foreground)]' : 'hover:bg-[var(--menu-item-hover-background)] hover:text-[var(--menu-item-hover-foreground)]'}`}
          >
            {subItem.icon && <subItem.icon size={14} className={`mr-2 ${subItem.isSelected ? 'text-[var(--menu-item-selected-foreground)]' : 'text-[var(--menu-item-icon-foreground)]'}`} />}
            <span className="flex-grow">{subItem.label}</span>
          </button>
        )
      })}
    </div>
  );


  return (
    <div className={`relative z-[200] overflow-visible bg-[var(--titlebar-background)] text-[var(--titlebar-foreground)] px-1 sm:px-2 py-1.5 border-b border-[var(--titlebar-border)] flex items-center justify-between text-xs h-[36px] flex-shrink-0 ${className || ''}`}>
      <div className="flex items-center space-x-0.5 sm:space-x-1" ref={menuRef}>
        <ICONS.file_code_icon size={20} className="text-[var(--titlebar-icon-blue)] ml-1" />
        <MenuBar menuItems={menuConfig} activeMenu={activeMenu} toggleMenu={toggleMenu} renderSubItems={renderSubItems} />

        <button
            title="Back"
            onClick={onNavigateBack}
            disabled={!canNavigateBack}
            className="p-1 rounded hover:bg-[var(--titlebar-button-hover-background)] focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back in tab history"
        >
            <ICONS.arrow_left_icon size={18} className="text-[var(--titlebar-icon-blue)]" />
        </button>
        <button
            title="Forward"
            onClick={onNavigateForward}
            disabled={!canNavigateForward}
            className="p-1 rounded hover:bg-[var(--titlebar-button-hover-background)] focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go forward in tab history"
        >
            <ICONS.arrow_right_icon size={18} className="text-[var(--titlebar-icon-blue)]" />
        </button>
      </div>

      <div className="flex-1 flex justify-center items-center min-w-0 px-1 sm:px-2">
        <div className="bg-[var(--menubar-background)] border border-[var(--menubar-separator-color)] rounded-md px-2 sm:px-3 py-1 flex items-center max-w-xs sm:max-w-md w-full">
          <ICONS.file_code_icon size={14} className="text-[var(--titlebar-icon-blue)] mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate text-[var(--titlebar-foreground)] text-xs hidden sm:inline">
            PORTO <span className="text-[var(--text-accent)]">CODE</span> -- {PORTFOLIO_DATA.name}
          </span>
          <span className="truncate text-[var(--titlebar-foreground)] text-xs sm:hidden">
            PORTO CODE
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-0.5 sm:space-x-1.5">
        <button 
            title="Toggle Second Editor Group" 
            className="md:inline-flex p-1 hover:bg-[var(--titlebar-button-hover-background)] rounded text-[var(--titlebar-foreground)] items-center justify-center" 
            onClick={onToggleRightEditorPane}
        >
          <ICONS.split_square_horizontal_icon size={16} />
        </button>
        <button title="Toggle Panel Layout (Not Implemented)" className="hidden md:inline-flex p-1 hover:bg-[var(--titlebar-button-hover-background)] rounded text-[var(--titlebar-foreground)] items-center justify-center" onClick={() => playSound('ui-click')}>
          <ICONS.layout_grid_icon size={16} />
        </button>
        <button 
            onClick={onToggleProfilePopup} 
            title="Profile" 
            className="p-1 hover:bg-[var(--titlebar-button-hover-background)] rounded text-[var(--titlebar-foreground)]"
            aria-label="Toggle profile popup"
        >
          <ICONS.user_profile_icon size={16} />
        </button>

        <div className="h-4 w-px bg-[var(--menubar-separator-color)] mx-0.5 sm:mx-1"></div>

        <button
          title="Minimize (Not Implemented)"
          className="p-1 sm:p-1.5 hover:bg-[var(--titlebar-button-hover-background)] rounded text-[var(--titlebar-foreground)]"
          aria-label="Minimize window (feature not implemented)"
          onClick={() => playSound('ui-click')}
        >
          <ICONS.minus_icon size={16} />
        </button>
        <button
          title={isFullscreen ? "Restore Down" : "Maximize"}
          onClick={onToggleFullscreen}
          className="p-1 sm:p-1.5 hover:bg-[var(--titlebar-button-hover-background)] rounded text-[var(--titlebar-foreground)]"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <ICONS.square_icon size={14} />
        </button>
        <button
          title="Close (Not Implemented)"
          className="p-1 sm:p-1.5 hover:bg-red-600 rounded text-[var(--titlebar-foreground)] hover:text-white"
          aria-label="Close window (feature not implemented)"
          onClick={() => playSound('ui-click')}
        >
          <ICONS.x_icon size={16} />
        </button>
      </div>
    </div>
  );
};

// Note: Default export is removed to align with named export usage in App.tsx
// export default TitleBar; 
// If TitleBar is intended to be a default export from this module, then App.tsx's import should be:
// import TitleBar from '../Layout/TitleBar/TitleBar';
// But if it's a named export (as 'export const TitleBar...'), then App.tsx's import should be:
// import { TitleBar } from '../Layout/TitleBar/TitleBar';
// For now, keeping it as a named export.
