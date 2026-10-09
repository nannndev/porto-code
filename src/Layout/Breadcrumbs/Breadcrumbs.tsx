
import React from 'react';
import { Tab, PortfolioData, SidebarItemConfig, EditorPaneId } from '../../App/types'; 
import { ICONS } from '../../App/constants';
import CopyLinkButton from '../../UI/CopyLinkButton';


interface BreadcrumbsProps {
  activeTab: Tab | undefined | null;
  portfolioData: PortfolioData;
  onOpenTab: (itemOrConfig: SidebarItemConfig | { id?: string, fileName?: string, type?: Tab['type'], title?: string, articleSlug?: string }) => void; 
  className?: string; 
  paneId: EditorPaneId;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ activeTab, portfolioData, onOpenTab, className, paneId }) => {
  if (!activeTab) {
    return null;
  }

  const getProjectTitleFromId = (projectId: string): string => {
    const directProject = portfolioData.projects.find(p => p.id === projectId);
    if (directProject) {
      return directProject.title;
    }
    return activeTab?.title || 'Project Detail';
  };
  
  const RootIcon = ICONS['projects.json']; 
  const SeparatorIcon = ICONS.chevron_right_icon;
  const ProjectsJSONIcon = ICONS['projects.json']; 
  const CVGeneratorFolderIcon = ICONS.folder_closed_icon; 
  const SupportFolderIcon = ICONS.folder_closed_icon; 

  let FinalSegmentIcon: React.ElementType | undefined = ICONS.default;
  if (activeTab.type === 'file' && activeTab.fileName && ICONS[activeTab.fileName]) {
    FinalSegmentIcon = ICONS[activeTab.fileName];
  } else if (activeTab.type === 'project_detail') {
    FinalSegmentIcon = ICONS['project_detail'] || ICONS.default;
  } else if (activeTab.type === 'ai_chat') {
    FinalSegmentIcon = ICONS.ai_chat_icon || ICONS.default;
  } else if (activeTab.type === 'article_detail') {
    FinalSegmentIcon = ICONS.article_detail || ICONS.default;
  } else if (activeTab.type === 'json_preview' && activeTab.fileName && ICONS[activeTab.fileName]) {
    FinalSegmentIcon = ICONS[activeTab.fileName];
  } else if (activeTab.type === 'cv_preview') {
    FinalSegmentIcon = ICONS.cv_preview_icon || ICONS.FileText;
  } else if (activeTab.type === 'settings_editor') {
    FinalSegmentIcon = ICONS.settings_editor_icon || ICONS.settings_icon;
  }


  return (
    <div className={`flex items-center px-3 py-1.5 text-xs text-[var(--breadcrumbs-foreground)] bg-[var(--breadcrumbs-background)] border-t border-[var(--border-color)] shadow-sm ${className || ''}`} aria-label={`Breadcrumbs for ${paneId} pane`}>
      {RootIcon && (
        <button 
          onClick={() => { /* Optional: Define action for clicking root */}} 
          className="flex items-center hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors duration-150"
          title="Portfolio Root"
        >
          <RootIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />
          <span className="font-medium">PORTFOLIO</span>
        </button>
      )}
      
      {SeparatorIcon && <SeparatorIcon size={16} className="mx-1 text-[var(--breadcrumbs-separator-color)]" />}

      {activeTab.type === 'project_detail' && (
        <>
          {ProjectsJSONIcon && (
            <button 
              onClick={() => onOpenTab({ fileName: 'projects.json', type: 'file', title: 'projects.json' })}
              className="flex items-center hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors duration-150"
              title="Open projects.json"
            >
              <ProjectsJSONIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)] opacity-75" />
              <span>projects.json</span>
            </button>
          )}
          {SeparatorIcon && <SeparatorIcon size={16} className="mx-1 text-[var(--breadcrumbs-separator-color)]" />}
          <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{getProjectTitleFromId(activeTab.id)}</span>
          </div>
        </>
      )}
      
      {activeTab.type === 'article_detail' && (
        <>
           {ICONS.articles_icon && (
            <button 
              onClick={() => { /* TODO: Action to show/focus ArticlesPanel */ }}
              className="flex items-center hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors duration-150"
              title="Go to Articles"
            >
              <ICONS.articles_icon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)] opacity-75" />
              <span>Articles</span>
            </button>
          )}
          {SeparatorIcon && <SeparatorIcon size={16} className="mx-1 text-[var(--breadcrumbs-separator-color)]" />}
          <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span className="truncate max-w-xs">{activeTab.title}</span>
          </div>
        </>
      )}

      {(activeTab.type === 'file' && activeTab.fileName === 'generate_cv.ts') && (
        <>
          {CVGeneratorFolderIcon && (
             <button 
              onClick={() => { /* Optional: Action to focus CV_GENERATOR folder in sidebar */}}
              className="flex items-center hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors duration-150"
              title="CV_GENERATOR Folder"
            >
              <CVGeneratorFolderIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)] opacity-75" />
              <span>CV_GENERATOR</span>
            </button>
          )}
          {SeparatorIcon && <SeparatorIcon size={16} className="mx-1 text-[var(--breadcrumbs-separator-color)]" />}
          <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{activeTab.title}</span>
          </div>
        </>
      )}

      {(activeTab.type === 'file' && (activeTab.fileName === 'support.md' || activeTab.fileName === 'guide.md')) && (
        <>
          {SupportFolderIcon && (
             <button 
              onClick={() => { /* Optional: Action to focus SUPPORT folder in sidebar */}}
              className="flex items-center hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors duration-150"
              title="SUPPORT Folder"
            >
              <SupportFolderIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)] opacity-75" />
              <span>SUPPORT</span>
            </button>
          )}
          {SeparatorIcon && <SeparatorIcon size={16} className="mx-1 text-[var(--breadcrumbs-separator-color)]" />}
          <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{activeTab.title}</span>
          </div>
        </>
      )}
      
      {(activeTab.type === 'file' && !['generate_cv.ts', 'support.md', 'guide.md'].includes(activeTab.fileName || '') || activeTab.type === 'json_preview') && (
         <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{activeTab.title}</span>
        </div>
      )}

      {activeTab.type === 'ai_chat' && (
        <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{activeTab.title}</span>
        </div>
      )}

      {activeTab.type === 'cv_preview' && (
         <>
          {CVGeneratorFolderIcon && (
             <button 
              onClick={() => { /* Optional: Action to focus CV_GENERATOR folder in sidebar */}}
              className="flex items-center hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors duration-150"
              title="CV_GENERATOR Folder"
            >
              <CVGeneratorFolderIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)] opacity-75" />
              <span>CV_GENERATOR</span>
            </button>
          )}
          {SeparatorIcon && <SeparatorIcon size={16} className="mx-1 text-[var(--breadcrumbs-separator-color)]" />}
          <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{activeTab.title}</span>
          </div>
        </>
      )}
      {activeTab.type === 'settings_editor' && (
        <div className="flex items-center text-[var(--breadcrumbs-focus-foreground)]">
            {FinalSegmentIcon && <FinalSegmentIcon size={14} className="mr-1.5 text-[var(--breadcrumbs-icon-foreground)]" />}
            <span>{activeTab.title}</span>
        </div>
      )}
      <CopyLinkButton tab={activeTab} className="ml-auto flex-shrink-0" />
    </div>
  );
};

export default Breadcrumbs;
