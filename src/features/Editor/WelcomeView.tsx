
import React from 'react';
import { ICONS, REPO_URL, SIDEBAR_ITEMS, APP_VERSION } from '../../App/constants';
import { PortfolioData, SidebarItemConfig } from '../../App/types';
import { Play, TerminalSquare, MessageSquare as GuestBookFeatureIcon } from 'lucide-react'; // Added icons for features

interface WelcomeViewProps {
  portfolioData: PortfolioData;
  onOpenTab: (item: SidebarItemConfig | { id?: string, fileName: string, type?: 'file' | 'project_detail' | 'ai_chat' | 'json_preview', title?: string }) => void;
  onOpenAIChat: () => void;
  onFocusTerminal: () => void; // New prop
  onOpenGuestBook: () => void; // New prop for Guest Book
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ portfolioData, onOpenTab, onOpenAIChat, onFocusTerminal, onOpenGuestBook }) => {
  const AppLogoIcon = ICONS.file_code_icon || ICONS.default;
  const AboutIcon = ICONS['about.json'] || ICONS.default;
  const ProjectsIcon = ICONS['projects.json'] || ICONS.default;
  const ChatIcon = ICONS.ai_chat_icon || ICONS.default;
  const GithubIcon = ICONS.GitFork || ICONS.default;
  const ContactFileIcon = ICONS.Mail || ICONS.default;
  const ExplorerIcon = ICONS.Eye || ICONS.default;
  const CommandPaletteIcon = ICONS.Command || ICONS.default;
  const RightClickIcon = ICONS.MousePointerClick || ICONS.default;
  const TerminalFeatureIcon = ICONS.TerminalIcon || TerminalSquare;


  const handleOpenSidebarItem = (itemId: string) => {
    const findItem = (items: SidebarItemConfig[]): SidebarItemConfig | undefined => {
      for (const item of items) {
        if (item.id === itemId && !item.isFolder) return item;
        if (item.isFolder && item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const itemToOpen = findItem(SIDEBAR_ITEMS);
    if (itemToOpen) {
      onOpenTab(itemToOpen);
    } else {
      console.warn(`WelcomeView: Could not find sidebar item with id: ${itemId}`);
    }
  };
  
  const FeatureCard: React.FC<{icon: React.ElementType, iconSrc: string, title: string, description: string, buttonText: string, onButtonClick: () => void}> = ({icon: Icon, iconSrc, title, description, buttonText, onButtonClick}) => (
    <div className="liquid-card bg-[var(--sidebar-item-hover-background)]/30 backdrop-blur-md p-5 rounded-xl border border-[var(--border-color)]/60 hover:border-[var(--text-accent)]/50 flex flex-col text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[var(--text-accent)]/5 group/card">
      <div className="relative flex items-center mb-3">
        <img
          src={iconSrc}
          alt=""
          width="64"
          height="64"
          className="liquid-content-icon w-14 h-14 sm:w-16 sm:h-16 object-contain mr-3 flex-shrink-0 transition-transform duration-300 group-hover/card:scale-105"
        />
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--editor-foreground)] tracking-tight">{title}</h3>
          <Icon size={14} aria-hidden="true" className="mt-1 text-[var(--text-accent)] opacity-70" />
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4 flex-grow leading-relaxed">{description}</p>
      <button
        onClick={onButtonClick}
        className="mt-auto self-start text-xs px-4 py-2 bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] font-medium rounded-lg hover:bg-[var(--modal-button-hover-background)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--modal-button-background)]/20 active:scale-[0.98] flex items-center"
      >
        <Play size={12} className="mr-1.5" /> {buttonText}
      </button>
    </div>
  );


  return (
    <div className="relative flex flex-col items-center w-full min-h-full p-6 sm:p-8 md:p-12 bg-[var(--editor-background)] text-[var(--editor-foreground)] text-center overflow-y-auto">
      {/* Background glow decorator */}
      <div className="welcome-aurora absolute inset-0 pointer-events-none"></div>
      
      <div className="relative flex flex-col items-center max-w-4xl w-full z-10">
        <div className="liquid-logo p-3 bg-[var(--sidebar-item-hover-background)]/50 rounded-2xl border border-[var(--border-color)]/40 mb-4">
          <AppLogoIcon size={52} className="text-[var(--text-accent)]" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-500">
          PORTO CODE
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] mb-1.5 max-w-lg leading-relaxed">
          Welcome to the interactive workspace of <span className="text-[var(--text-default)] font-semibold">{portfolioData.name}</span>
        </p>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]/80 mb-8 max-w-xl leading-relaxed">
          A developer environment designed to showcase full-stack mobile & web engineering expertise.
        </p>

        <div className="w-full mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)] mr-3">Key Features</h2>
            <div className="flex-grow h-[1px] bg-[var(--border-color)]/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard 
              icon={ChatIcon}
              iconSrc="/icons/liquid/ai-assistant.png"
              title="AI Assistant"
              description="Ask questions about Nandang's experience, project architecture, or tools. Powered by Gemini."
              buttonText="Open AI Chat"
              onButtonClick={onOpenAIChat}
            />
            <FeatureCard 
              icon={TerminalFeatureIcon}
              iconSrc="/icons/liquid/terminal.png"
              title="Interactive Terminal"
              description="Execute VSCode terminal command lines in real time. Type 'help' to get started."
              buttonText="Focus Terminal"
              onButtonClick={onFocusTerminal}
            />
            <FeatureCard 
              icon={GuestBookFeatureIcon}
              iconSrc="/icons/liquid/guest-book.png"
              title="Guest Book"
              description="Leave comments, feedback, or say hi to share your thoughts on the portfolio."
              buttonText="Open Guest Book"
              onButtonClick={onOpenGuestBook}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <div className="liquid-card bg-[var(--sidebar-background)]/40 backdrop-blur-md p-5 sm:p-6 rounded-xl border border-[var(--border-color)]/60 text-left transition-all duration-300 hover:border-[var(--border-color)]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)] mb-3">Start Exploring</h2>
            <ul className="space-y-2">
              {[
                { id: 'about.json', icon: AboutIcon, text: "View About Me" },
                { id: 'projects.json', icon: ProjectsIcon, text: "Explore Projects" },
                { id: 'contact.json', icon: ContactFileIcon, text: "Contact Info" },
              ].map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleOpenSidebarItem(item.id)}
                    className="group/button flex items-center justify-between w-full text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] transition-all duration-200 text-xs sm:text-sm p-2 rounded-lg hover:bg-[var(--sidebar-item-hover-background)]/80 border border-transparent hover:border-[var(--border-color)]/40"
                  >
                    <div className="flex items-center">
                      <item.icon size={16} className="mr-2.5 flex-shrink-0 text-[var(--text-muted)] group-hover/button:text-[var(--text-accent)] transition-colors duration-200" />
                      <span className="font-medium group-hover/button:translate-x-0.5 transition-transform duration-200">{item.text}</span>
                    </div>
                    <code className="text-[10px] bg-[var(--editor-tab-inactive-background)]/80 px-2 py-0.5 rounded border border-[var(--border-color)]/30 group-hover/button:text-[var(--link-hover-foreground)]">{item.id}</code>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-card bg-[var(--sidebar-background)]/40 backdrop-blur-md p-5 sm:p-6 rounded-xl border border-[var(--border-color)]/60 text-left transition-all duration-300 hover:border-[var(--border-color)]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)] mb-3">How to Navigate</h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)]">
                  {[
                      {icon: ExplorerIcon, text: "Use the <strong>Explorer</strong> sidebar to browse and open json/markdown files."},
                      {icon: CommandPaletteIcon, text: "Press <code>Ctrl+Shift+P</code> (or <code>Cmd+Shift+P</code>) to trigger the Command Palette."},
                      {icon: RightClickIcon, text: "Right-click on tabs or file content to access specific context menus."},
                  ].map((item, idx) => (
                      <li key={idx} className="flex items-start p-1 hover:text-[var(--editor-foreground)] transition-colors duration-200">
                          <item.icon size={16} className="mr-2.5 mt-0.5 flex-shrink-0 text-[var(--text-accent)]" />
                          <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></span>
                      </li>
                  ))}
              </ul>
          </div>
        </div>

        <div className="liquid-card text-left w-full bg-[var(--sidebar-background)]/40 backdrop-blur-md p-5 sm:p-6 rounded-xl border border-[var(--border-color)]/60 mb-8 transition-all duration-300 hover:border-[var(--border-color)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)] mb-3">Project Info</h2>
          <ul className="space-y-2">
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group/button flex items-center justify-between w-full text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] transition-all duration-200 text-xs sm:text-sm p-2 rounded-lg hover:bg-[var(--sidebar-item-hover-background)]/80 border border-transparent hover:border-[var(--border-color)]/40"
              >
                <div className="flex items-center">
                  <GithubIcon size={16} className="mr-2.5 flex-shrink-0 text-[var(--text-muted)] group-hover/button:text-[var(--text-accent)] transition-colors duration-200" />
                  <span className="font-medium">View Source Repository</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] group-hover/button:text-[var(--link-hover-foreground)] flex items-center">
                  github.com/nannndev <Play size={8} className="ml-1" />
                </span>
              </a>
            </li>
            <li className="text-xs text-[var(--text-muted)]/90 px-2 py-1 leading-relaxed border-t border-[var(--border-color)]/30 mt-2 pt-2">
              This developer portfolio workspace simulates a desktop IDE environment, styled directly using HSL custom theme configurations, Tailwind, and React.
            </li>
          </ul>
        </div>

        <p className="text-[10px] sm:text-xs text-[var(--text-muted)]/60 mt-4">
          Version {APP_VERSION} | &copy; {new Date().getFullYear()} {portfolioData.name}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default WelcomeView;
