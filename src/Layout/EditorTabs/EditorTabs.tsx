
import React, { useState } from 'react';
import { Tab, EditorPaneId } from '../../App/types';
import { ICONS } from '../../App/constants';
import { playSound } from '../../Utils/audioUtils';


interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onContextMenuRequest: (x: number, y: number, tabId: string, isCVContext?: boolean) => void; 
  isLoading?: boolean; 
  onReorderTabs: (draggedTabId: string, targetTabId: string | null) => void; 
  onRunCVGeneratorFromTab?: () => void;
  className?: string; 
  paneId: EditorPaneId;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ 
  tabs, 
  activeTabId, 
  onSelectTab, 
  onCloseTab, 
  onContextMenuRequest,
  isLoading,
  onReorderTabs,
  className,
  paneId
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null); 
  const [isDragOverEndZone, setIsDragOverEndZone] = useState<boolean>(false);

  if (tabs.length === 0 && !isLoading) {
    return null;
  }
  const CloseIcon = ICONS.x_icon;


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ tabId, sourcePaneId: paneId }));
    playSound('ui-click'); 
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, targetTabId: string | null) => {
    e.preventDefault();
    if (draggedTabId) {
      if (targetTabId && targetTabId !== draggedTabId) {
        setDragOverTabId(targetTabId);
        setIsDragOverEndZone(false);
      } else if (targetTabId === null) { 
        setDragOverTabId(null);
        setIsDragOverEndZone(true);
      }
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLElement>, targetTabId: string | null) => {
    e.preventDefault();
    if (draggedTabId) {
      if (targetTabId && targetTabId !== draggedTabId) {
        setDragOverTabId(targetTabId);
        setIsDragOverEndZone(false);
      } else if (targetTabId === null) {
        setDragOverTabId(null);
        setIsDragOverEndZone(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget) && (!e.currentTarget.parentElement || !e.currentTarget.parentElement.contains(relatedTarget))) {
      setDragOverTabId(null);
      setIsDragOverEndZone(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetTabId: string | null) => {
    e.preventDefault();
    if (draggedTabId) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.sourcePaneId === paneId) { 
             if (targetTabId === null) { 
                onReorderTabs(draggedTabId, null);
              } else if (targetTabId !== draggedTabId) {
                onReorderTabs(draggedTabId, targetTabId);
              }
        } else {
            console.log("Cross-pane drop detected. Source:", data.sourcePaneId, "Target:", paneId, "Tab:", data.tabId);
        }
      } catch (error) {
           if (draggedTabId) { 
               if (targetTabId === null) { 
                    onReorderTabs(draggedTabId, null);
                } else if (targetTabId !== draggedTabId) {
                    onReorderTabs(draggedTabId, targetTabId);
                }
           }
      }
    }
    resetDragState();
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const resetDragState = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
    setIsDragOverEndZone(false);
  };

  return (
    <div 
      className={`relative flex bg-[var(--editor-tab-background)] border-b border-[var(--editor-tab-border)] overflow-x-auto flex-shrink-0 ${className || ''}`}
      role="tablist"
      aria-label={`Editor open files for ${paneId} pane`}
      onDragLeave={handleDragLeave} 
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isBeingDragged = tab.id === draggedTabId;
        const isDropTarget = tab.id === dragOverTabId;

        let iconKey = tab.id; 
        if (tab.type === 'project_detail') iconKey = 'project_detail';
        else if (tab.type === 'ai_chat') iconKey = 'ai_chat_icon'; 
        else if (tab.type === 'article_detail') iconKey = 'article_detail';
        else if (tab.type === 'cv_preview') iconKey = 'cv_preview_icon'; 
        else if (tab.fileName === 'generate_cv.ts') iconKey = 'generate_cv_icon';
        else if (tab.type === 'settings_editor') iconKey = 'settings_editor_icon';
        else if (tab.type === 'github_profile_view') iconKey = 'github_profile_view';
        else if (tab.type === 'guest_book') iconKey = 'guest_book_icon';
        else if (tab.type === 'json_preview' && tab.fileName) {
             iconKey = ICONS[tab.fileName] ? tab.fileName : (ICONS[(tab.fileName.split('_preview')[0])] ? tab.fileName.split('_preview')[0] : 'default');
        }
        
        const IconComponent = ICONS[iconKey] || ICONS.default;
        
        const iconColorClass = isActive ? 'text-[var(--editor-tab-icon-active-foreground)]' : 'text-[var(--editor-tab-icon-foreground)] group-hover/tab:text-[var(--editor-tab-active-foreground)]';
        const textColorClass = isActive ? 'text-[var(--editor-tab-active-foreground)]' : 'text-[var(--editor-tab-inactive-foreground)] group-hover/tab:text-[var(--editor-tab-active-foreground)]';
        const tabBackgroundClass = isActive ? 'bg-[var(--editor-tab-active-background)]' : 'bg-[var(--editor-tab-inactive-background)] hover:bg-[var(--editor-tab-hover-background)]';
        
        // Use bottom border for active tab indicator
        const activeBorderClass = isActive ? 'border-b-2 border-[var(--editor-tab-active-border-bottom,var(--focus-border))]' : 'border-b-2 border-transparent';
        
        let dynamicClasses = `${tabBackgroundClass} ${activeBorderClass} flex-shrink-0`; // Added flex-shrink-0 here
        if (isBeingDragged) dynamicClasses += ' opacity-50 ring-2 ring-[var(--focus-border)] ring-inset';
        if (isDropTarget) dynamicClasses += ' border-l-2 border-[var(--focus-border)]';

        return (
          <div
            key={tab.id}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragEnter={(e) => handleDragEnter(e, tab.id)}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${paneId}-${tab.id}`} 
            id={`tab-${paneId}-${tab.id}`} 
            tabIndex={0} 
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectTab(tab.id);}}
            onContextMenu={(e) => { 
              e.preventDefault();
              onContextMenuRequest(e.pageX, e.pageY, tab.id, tab.fileName === 'generate_cv.ts');
            }}
            className={`flex items-center py-2 px-3 md:px-4 cursor-pointer border-r border-[var(--editor-tab-border)] whitespace-nowrap group/tab transition-all duration-150 ease-in-out relative focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[var(--focus-border)]
              ${dynamicClasses}`}
            // Adjust paddingBottom for active tab to account for border, maintaining consistent height
            style={{paddingBottom: isActive ? 'calc(0.5rem - 2px)' : '0.5rem'}} 
            title={tab.title}
          >
            <IconComponent size={16} className={`mr-2 flex-shrink-0 ${iconColorClass} pointer-events-none`} />
            <span className={`text-sm truncate max-w-[80px] md:max-w-[120px] ${textColorClass} pointer-events-none`}>{tab.title}</span>
            
            {CloseIcon && (
              <button
                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                className={`ml-1 p-0.5 rounded hover:bg-[var(--titlebar-button-hover-background)] focus:outline-none transition-colors duration-150 ease-in-out ${isActive ? 'text-[var(--editor-tab-active-foreground)] hover:opacity-80' : 'text-[var(--editor-tab-inactive-foreground)] group-hover/tab:text-[var(--editor-tab-active-foreground)]'}`}
                title={`Close ${tab.title}`}
                aria-label={`Close ${tab.title} tab`}
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        );
      })}
      <div 
        className={`flex-grow bg-[var(--editor-tab-background)] h-full border-b-2 min-h-[38px] 
                    ${isDragOverEndZone ? 'bg-[var(--editor-tab-hover-background)] border-[var(--focus-border)] border-dashed' : 'border-transparent'}`}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragEnter={(e) => handleDragEnter(e, null)}
        onDrop={(e) => handleDrop(e, null)}
      ></div>
      
      {isLoading && ( 
        <div className="linear-progress-bar" aria-label="Loading content">
          <div className="linear-progress-bar-indicator"></div>
        </div>
      )}
    </div>
  );
};

export default EditorTabs;
