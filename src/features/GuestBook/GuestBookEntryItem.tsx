
import React, { useState } from 'react';
import { GuestBookEntry } from '../../App/types';
import type { FirebaseUser } from '../../Utils/firebase'; 
import { PREDEFINED_EMOJIS, ICONS } from '../../App/constants';
import { CheckCircle, AlertTriangle, MessageSquare, Info, ExternalLink, Github } from 'lucide-react'; 

interface GuestBookEntryItemProps {
  entry: GuestBookEntry;
  entryNumber: number;
  currentUser: FirebaseUser | null;
  onReaction: (emoji: string) => void;
  className?: string;
}

const AI_STATUS_ICONS: { [key in GuestBookEntry['aiValidationStatus']]: { icon: React.ElementType, color: string, title: string } } = {
  validated_ok: { icon: CheckCircle, color: 'text-green-500', title: 'AI Validated: Message seems appropriate.' },
  validated_flagged: { icon: AlertTriangle, color: 'text-yellow-500', title: 'AI Flagged: Message may need review.' },
  validation_skipped: { icon: MessageSquare, color: 'text-[var(--text-muted)]', title: 'AI Validation Skipped.' },
  validation_error: { icon: Info, color: 'text-red-500', title: 'AI Validation Error.' },
  pending: { icon: ICONS.SpinnerIcon, color: 'text-[var(--text-muted)] animate-spin', title: 'AI Validation Pending...'}
};

interface UserProfileLinkProps {
  nickname: string;
  avatarUrl?: string;
  githubLogin?: string;
  authProvider: 'google' | 'github';
  children?: React.ReactNode; 
}

const UserProfileDisplay: React.FC<UserProfileLinkProps> = ({ nickname, avatarUrl, githubLogin, authProvider }) => {
  const content = (
    <>
      {avatarUrl ? (
        <img src={avatarUrl} alt={`${nickname}'s avatar`} className="w-10 h-10 rounded-full border border-[var(--focus-border)]" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[var(--sidebar-item-hover-background)] flex items-center justify-center text-[var(--text-accent)] text-lg font-semibold border border-[var(--focus-border)]">
          {nickname.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-semibold text-[var(--editor-foreground)] ml-3">{nickname}</span>
      {authProvider === 'github' && githubLogin && (
        <Github size={14} className="ml-1.5 text-[var(--text-muted)] group-hover:text-[var(--link-foreground)] transition-colors" />
      )}
    </>
  );

  if (authProvider === 'github' && githubLogin) {
    return (
      <a
        href={`https://github.com/${githubLogin}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center hover:text-[var(--link-hover-foreground)] group"
        title={`View ${nickname}'s GitHub profile (@${githubLogin})`}
      >
        {content}
        <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-70 transition-opacity text-[var(--link-foreground)]" />
      </a>
    );
  }
  
  return <div className="inline-flex items-center">{content}</div>;
};


const GuestBookEntryItem: React.FC<GuestBookEntryItemProps> = ({ entry, entryNumber, currentUser, onReaction, className }) => {
  const [showAllReactions, setShowAllReactions] = useState(false);

  const aiStatusInfo = AI_STATUS_ICONS[entry.aiValidationStatus] || AI_STATUS_ICONS.pending;
  const AiIcon = aiStatusInfo.icon;

  const userReactedEmojis = currentUser 
    ? Object.keys(entry.reactions || {}).filter(emoji => 
        (entry.reactions[emoji] || []).includes(currentUser.uid)
      )
    : [];

  const sortedReactions = Object.entries(entry.reactions || {})
    .filter(([, userIds]) => userIds.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  const displayedReactions = showAllReactions ? sortedReactions : sortedReactions.slice(0, 5);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <article className={`guestbook-entry group p-4 sm:p-5 rounded-2xl border border-[var(--border-color)]/70 bg-[var(--sidebar-background)] hover:border-[var(--focus-border)]/40 transition-all duration-200 ${className || ''} ${entry.isNew ? 'animate-spawnItem ring-1 ring-[var(--focus-border)]/30' : ''}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <UserProfileDisplay 
          nickname={entry.nickname}
          avatarUrl={entry.avatarUrl}
          githubLogin={entry.githubLogin}
          authProvider={entry.authProvider}
        />
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="hidden sm:inline text-[9px] text-[var(--text-accent)]/70 font-mono tracking-wider">
            MSG-{String(entryNumber).padStart(3, '0')}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono tracking-tight">
            {formatTimestamp(entry.timestamp)}
          </span>
          
          {/* Improved AI Badge */}
          {(entry.aiValidationStatus === 'validated_ok' || entry.aiValidationStatus === 'validated_flagged') && (
            <div 
              className={`flex items-center gap-1 px-2 py-px rounded-full text-[10px] font-medium border ${aiStatusInfo.color} bg-current/5 border-current/20`}
              title={aiStatusInfo.title}
            >
              <AiIcon size={11} />
              <span className="font-mono text-[9px] tracking-wider">
                {entry.aiValidationStatus === 'validated_ok' ? 'VERIFIED' : 'REVIEWED'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="text-sm leading-7 text-[var(--editor-foreground)] whitespace-pre-wrap pl-1 pr-2 mb-5">
        {entry.message}
      </div>

      {/* Reactions - Significantly improved */}
      <div className="flex flex-wrap items-center gap-1.5 pl-1">
        {PREDEFINED_EMOJIS.map(emoji => {
          const userIds = entry.reactions?.[emoji] || [];
          const count = userIds.length;
          const hasReacted = userReactedEmojis.includes(emoji);
          
          if (count === 0 && !hasReacted) return null;

          return (
            <button
              key={emoji}
              onClick={() => onReaction(emoji)}
              disabled={!currentUser}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full border transition-all active:scale-[0.96]
                ${hasReacted 
                  ? 'bg-[var(--focus-border)]/15 border-[var(--focus-border)] text-[var(--focus-border)] shadow-sm' 
                  : 'bg-[var(--editor-tab-inactive-background)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--sidebar-item-hover-background)]'
                }
                ${!currentUser ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.03]'}
              `}
              title={currentUser ? (hasReacted ? `Remove your ${emoji} reaction` : `React with ${emoji}`) : "Sign in to react"}
            >
              <span className="text-base leading-none">{emoji}</span>
              {count > 0 && (
                <span className="font-mono text-[10px] font-medium tabular-nums">{count}</span>
              )}
            </button>
          );
        })}

        {sortedReactions.length > 5 && !showAllReactions && (
          <button 
            onClick={() => setShowAllReactions(true)}
            className="text-[10px] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--editor-foreground)] hover:bg-[var(--sidebar-item-hover-background)] rounded-full transition-colors"
          >
            +{sortedReactions.length - 5}
          </button>
        )}
        
        {showAllReactions && sortedReactions.length > 5 && (
          <button 
            onClick={() => setShowAllReactions(false)}
            className="text-[10px] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--editor-foreground)]"
          >
            show less
          </button>
        )}
      </div>
    </article>
  );
};

export default GuestBookEntryItem;
