
import { ExternalLink, Loader2 } from 'lucide-react';
import React, { lazy, Suspense, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import remarkGfm from 'remark-gfm';
import { ALL_FEATURE_IDS, ICONS } from '../../App/constants';
import { AIChatInterfaceProps as AIChatInterfacePropsType, ArticleItem, SettingsEditorProps as EditorProps, FeatureStatus, GuestBookViewProps, MockGitHubStats, PortfolioData, ProjectDetail, ProjectListingItem, TabContentProps as TabContentPropsType } from '../../App/types';
import MaintenanceView from '../../UI/MaintenanceView';
import { ProjectCard } from '../../UI/ProjectCard/ProjectCard';
import { getSyntaxHighlighterTheme } from '../../Utils/syntaxHighlighterUtils';

// Heavy views are code-split and only downloaded when their tab is opened.
const AIChatInterface = lazy(() => import('../AIChat/AIChatInterface'));
const GitHubProfileView = lazy(() => import('../GitHub/GitHubProfileView').then(m => ({ default: m.GitHubProfileView })));
const GuestBookView = lazy(() => import('../GuestBook/GuestBookView'));
const SpotifyView = lazy(() => import('../Spotify/SpotifyView'));
const SettingsEditor = lazy(() => import('../Settings/SettingsEditor'));
const ArticleDetailView = lazy(() => import('../articles/ArticleDetailView'));
const SupportView = lazy(() => import('../Modals/SupportView'));
const CVPreview = lazy(() => import('./CVPreview'));
const JsonPreviewView = lazy(() => import('./JsonPreviewView'));


SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('typescript', typescript); 

// This type is now defined in types.ts as AIChatInterfaceProps
// We can use that directly or keep this local one if it's slightly different,
// but for consistency, it's better to use the one from types.ts if they are identical.
// For this fix, assuming `AIChatInterfacePropsType` from `types.ts` is the correct one.

const TabContentInner: React.FC<TabContentPropsType> = ({
  tab,
  content, 
  portfolioData,
  onOpenProjectTab,
  currentThemeName,
  onContextMenuRequest,
  aiGeneratedProjects,
  onSuggestNewAIProject,
  isAISuggestingProject,
  paneId, 
  addAppLog,
  featureStatusForProjectsView, // Added prop
  allArticles = [],
  onOpenArticle,
  onCloseTab,
  addNotificationAndLog,
}) => {
  const [finalSyntaxTheme, setFinalSyntaxTheme] = React.useState<any>({});
  const SparklesIcon = ICONS.SparklesIcon;
  const [aiProjectKeywords, setAiProjectKeywords] = useState(''); 

  React.useLayoutEffect(() => {
    setFinalSyntaxTheme(getSyntaxHighlighterTheme(currentThemeName));
  }, [currentThemeName]);

  const handleContextMenu = (event: React.MouseEvent) => {
    const isCVGeneratorScript = tab.fileName === 'generate_cv.ts';
    if (isCVGeneratorScript) {
        event.preventDefault();
        onContextMenuRequest(event.pageX, event.pageY, tab.id, true);
        return;
    }
    if (tab.type === 'cv_preview' || tab.type === 'settings_editor' || tab.type === 'github_profile_view' || tab.type === 'guest_book' || tab.type === 'spotify_view') return; 
    const eligibleForPreview = ['about.json', 'experience.json', 'skills.json', 'contact.json', 'projects.json'].includes(tab.fileName || '');
    if (((tab.type === 'file' && eligibleForPreview) || (tab.type === 'project_detail' && !tab.id.startsWith('ai_project_'))) && !tab.id.endsWith('_preview')) {
        event.preventDefault();
        onContextMenuRequest(event.pageX, event.pageY, tab.id, false);
    }
  };

  if (tab.type === 'achievements') {
    return (
      <div className="p-8 text-[var(--editor-foreground)] bg-[var(--editor-background)] h-full overflow-auto">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-3">🏆 Achievements</h1>
          <div className="space-y-3">
            {[
              { name: 'First Steps', desc: 'Opened your first file', unlocked: true },
              { name: 'AI Curious', desc: 'Chatted with the AI Assistant', unlocked: true },
              { name: 'Social Butterfly', desc: 'Left a message in the Guest Book', unlocked: false },
              { name: 'Customization Master', desc: 'Changed themes 5+ times', unlocked: false },
            ].map((a, i) => (
              <div key={i} className={`p-4 rounded border ${a.unlocked ? 'border-[var(--text-accent)] bg-[var(--text-accent)]/5' : 'border-[var(--border-color)] opacity-60'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{a.unlocked ? '✅' : '🔒'}</span>
                  <span className="font-semibold">{a.name}</span>
                </div>
                <div className="text-sm text-[var(--text-muted)] ml-7">{a.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--text-muted)]">More achievements will unlock as you explore Porto Code.</p>
        </div>
      </div>
    );
  }

  if (tab.type === 'support') {
    return <SupportView />;
  }

  if (tab.type === 'extensions') {
    return (
      <div className="p-8 text-[var(--editor-foreground)] bg-[var(--editor-background)] h-full overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <span>🧩</span> Extensions Marketplace
          </h1>
          <p className="text-[var(--text-muted)] mb-6">Discover extensions that power Nandang's development workflow (demo)</p>

          <div className="grid gap-3">
            {['Flutter Tools', 'Dart', 'GitLens', 'Tailwind CSS IntelliSense', 'Prettier', 'ESLint'].map((ext, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-[var(--border-color)] rounded bg-[var(--editor-tab-inactive-background)]">
                <div>
                  <div className="font-semibold">{ext}</div>
                  <div className="text-xs text-[var(--text-muted)]">Popular • 10M+ installs</div>
                </div>
                <button className="px-3 py-1 text-xs bg-[var(--focus-border)] text-white rounded">Install</button>
              </div>
            ))}
          </div>
          <div className="mt-8 text-xs text-[var(--text-muted)]">More extensions coming soon. This is a demo marketplace.</div>
        </div>
      </div>
    );
  }

  if (tab.type === 'ai_chat') {
    const aiChatProps = content as AIChatInterfacePropsType; 
    return (
      <AIChatInterface
        portfolioData={portfolioData}
        addAppLog={addAppLog}
        messages={aiChatProps.messages}
        input={aiChatProps.input}
        setInput={aiChatProps.setInput}
        isLoading={aiChatProps.isLoading}
        error={aiChatProps.error}
        apiKeyAvailable={aiChatProps.apiKeyAvailable}
        onSendMessage={aiChatProps.onSendMessage}
        handleOpenTab={aiChatProps.handleOpenTab} 
        currentPaneIdForChat={aiChatProps.currentPaneIdForChat} 
        featureStatus={aiChatProps.featureStatus} // Pass featureStatus
      />
    );
  }

  if (tab.type === 'cv_preview') {
    return <CVPreview portfolioData={content as PortfolioData} />;
  }

  if (tab.type === 'github_profile_view') {
    const ghContent = content as { username?: string; mockStats: MockGitHubStats; featureStatus: FeatureStatus };
    return <GitHubProfileView username={ghContent.username} mockStats={ghContent.mockStats} addAppLog={addAppLog} featureStatus={ghContent.featureStatus} />;
  }
  
  if (tab.type === 'guest_book') {
    const guestBookProps = content as GuestBookViewProps;
    return <GuestBookView {...guestBookProps} />;
  }

  if (tab.type === 'spotify_view') {
    return <SpotifyView />;
  }


  if (tab.type === 'settings_editor') {
    const settingsProps = content as EditorProps; 
    return <SettingsEditor {...settingsProps} />;
  }
  
  const getSyntaxHighlighterContent = (rawContent: any, language: string): string => {
    let contentStr = typeof rawContent === 'string' ? rawContent : '// Error: Expected code string';
    if (language === 'json' && typeof rawContent !== 'string') {
        contentStr = JSON.stringify(rawContent, null, 2);
    }
    return (contentStr && contentStr.trim() !== '') ? contentStr : `// No content to display for ${tab.fileName || 'this file'}`;
  };


  if (tab.type === 'file' && tab.fileName === 'generate_cv.ts') {
    const displayContent = getSyntaxHighlighterContent(content, 'typescript');
    return (
      <div onContextMenu={handleContextMenu} className="h-full w-full">
        <SyntaxHighlighter
          language="typescript"
          style={finalSyntaxTheme}
          showLineNumbers={true}
          lineNumberStyle={{ color: 'var(--editor-line-number-foreground)', marginRight: '1em', fontSize: 'var(--editor-font-size)', fontFamily: 'var(--editor-font-family)' }}
          wrapLines={true}
          wrapLongLines={false}
          className="h-full w-full" 
          customStyle={{padding: '1rem'}}
        >
          {displayContent}
        </SyntaxHighlighter>
      </div>
    );
  }

  if (tab.type === 'project_detail' && tab.id.startsWith('ai_project_')) {
    const aiProject = content as ProjectDetail;
    if (aiProject) {
      return <JsonPreviewView jsonData={aiProject} fileId={tab.id} portfolioData={portfolioData} />;
    }
  }

  const codeContentString = (typeof content === 'string') ? content : JSON.stringify(content, null, 2);

  if (tab.type === 'article_detail') {
    const articleData = content as ArticleItem;
    // Pass the article data to the new ArticleDetailView component
    return (
      <ArticleDetailView 
        article={articleData} 
        allArticles={allArticles}
        onOpenArticle={onOpenArticle}
        onCloseTab={() => onCloseTab?.(tab.id)}
        addNotificationAndLog={addNotificationAndLog}
      />
    );
  }
  
  if (tab.type === 'json_preview' && tab.fileName) {
    try {
      const parsedData = JSON.parse(codeContentString);
      return <JsonPreviewView jsonData={parsedData} fileId={tab.fileName} portfolioData={portfolioData} />;
    }
    catch (error) {
      console.error(`Failed to parse JSON for preview tab ${tab.id} in pane ${paneId}:`, error);
      return <div className="p-4 text-red-400 bg-[var(--editor-background)]">Error displaying preview: Invalid JSON data.</div>;
    }
  }


  if (tab.id === 'projects.json' && tab.type === 'file') {
    if (featureStatusForProjectsView && featureStatusForProjectsView !== 'active') {
      return <MaintenanceView featureName={ALL_FEATURE_IDS.projectsView} featureIcon={ICONS['projects.json']} />;
    }
    try {
      const projectsData = JSON.parse(codeContentString);
      const projectsList = projectsData.projects as ProjectListingItem[];
      
      const allDisplayProjects: ProjectDetail[] = [
        ...projectsList.map(p => ({ // Map existing projects to ProjectDetail like structure for consistency if needed by card
            id: p.id, 
            title: p.title, 
            imageUrls: p.imageUrls, 
            technologies: p.technologies || [],
            description: portfolioData.projects.find(fp => fp.id === p.id)?.description || "No description available." 
        })),
        ...aiGeneratedProjects.map(aiP => ({...aiP, id: aiP.id || `ai_temp_${Date.now()}`})) // Ensure ID for AI projects
      ];


      return (
        <div
          className="p-2 md:p-4 h-full overflow-auto bg-[var(--editor-background)] text-[var(--editor-foreground)]"
          onContextMenu={handleContextMenu}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--text-accent)] mb-2 sm:mb-0">// projects.json</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4 md:mb-6">
              <input
                type="text"
                value={aiProjectKeywords}
                onChange={(e) => setAiProjectKeywords(e.target.value)}
                placeholder="Keywords for AI (optional, e.g., game, health)"
                className="flex-grow p-1.5 bg-[var(--modal-input-background)] text-[var(--modal-foreground)] border border-[var(--modal-input-border)] rounded-md focus:outline-none focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-border)] text-xs placeholder-[var(--text-muted)] min-w-[200px]"
                aria-label="Keywords for AI project suggestion"
              />
              {SparklesIcon && (
                <button
                  onClick={() => onSuggestNewAIProject(aiProjectKeywords)}
                  disabled={isAISuggestingProject}
                  className="flex items-center self-start sm:self-center px-2 sm:px-3 py-1.5 bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] hover:bg-[var(--modal-button-hover-background)] rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[var(--focus-border)] disabled:opacity-60 transition-colors whitespace-nowrap"
                  title="Suggest a new project idea using AI"
                >
                  {isAISuggestingProject ? (
                    <Loader2 size={14} className="animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <SparklesIcon size={14} className="mr-1 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">{isAISuggestingProject ? 'Suggesting...' : 'Suggest New Project Idea'}</span>
                  <span className="sm:hidden">{isAISuggestingProject ? '...' : 'AI Suggest'}</span>
                </button>
              )}
            </div>
          <p className="mb-4 md:mb-6 text-sm text-[var(--text-muted)]">
            {`Explore my projects. Click on any project card to view its details in a new "file". Or, try the AI suggestion feature!`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {allDisplayProjects.map((project) => (
              <ProjectCard
                key={project.id}
                projectId={project.id}
                projectTitle={project.id.startsWith('ai_project_') ? `✨ ${project.title} (AI)` : project.title}
                imageUrls={project.imageUrls}
                technologies={project.technologies} 
                onClick={() => onOpenProjectTab(project.id, project.id.startsWith('ai_project_') ? `✨ ${project.title} (AI)` : project.title)}
              />
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error(`Failed to parse JSON for projects.json in pane ${paneId}:`, error);
      return <div className="p-4 text-red-400 bg-[var(--editor-background)]">Error displaying projects: Invalid JSON data.</div>;
    }
  }

  if (tab.type === 'project_detail' && !tab.id.startsWith('ai_project_')) {
     try {
       const projectJson = JSON.parse(codeContentString);
       return <JsonPreviewView jsonData={projectJson} fileId={tab.id} portfolioData={portfolioData} />;
     }
     catch (e) {
       console.error(`Error parsing project_detail for JsonPreviewView in pane ${paneId}`, e);
       return <div className="p-4 text-red-400 bg-[var(--editor-background)]">Error: Could not parse project detail.</div>;
     }
  }

  if (tab.type === 'file') {
    // Handle support.md as markdown
    if (tab.fileName === 'support.md') {
        const markdownContent = typeof content === 'string' ? content : '# Error: Content not a string.';
        return (
          <div onContextMenu={handleContextMenu} className="p-4 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
            <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[var(--link-foreground)] hover:underline">{props.children} <ExternalLink size={12} className="ml-1 opacity-70" /></a>
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </article>
          </div>
        );
    }
    // Default to JSON syntax highlighting for other .json files or code string
    const displayContent = getSyntaxHighlighterContent(codeContentString, 'json');
    return (
      <div onContextMenu={handleContextMenu} className="h-full w-full">
        <SyntaxHighlighter
          language="json" // Default to json for other files, or determine language if possible
          style={finalSyntaxTheme}
          showLineNumbers={true}
          lineNumberStyle={{ color: 'var(--editor-line-number-foreground)', marginRight: '1em', fontSize: 'var(--editor-font-size)', fontFamily: 'var(--editor-font-family)' }}
          wrapLines={true}
          wrapLongLines={false}
          className="h-full w-full"  
          customStyle={{padding: '1rem'}}
        >
          {displayContent}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <div className="p-4 text-red-400 bg-[var(--editor-background)]">
      Error: Unhandled tab type or content issue.
      <pre>{`Tab Type: ${tab.type}, Content Type: ${typeof content}`}</pre>
    </div>
  );
};

const TabContentFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full text-[var(--text-muted)]">
    <Loader2 size={20} className="animate-spin" />
  </div>
);

const TabContent: React.FC<TabContentPropsType> = (props) => (
  <Suspense fallback={<TabContentFallback />}>
    <TabContentInner {...props} />
  </Suspense>
);

export default TabContent;