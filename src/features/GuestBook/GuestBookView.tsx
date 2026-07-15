
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GuestBookEntry, AIValidationStatus, GuestBookViewProps as ViewProps, FeatureStatus } from '../../App/types'; 
import type { FirebaseUser as AuthUser } from '../../Utils/firebase'; 
import { 
  auth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from '../../Utils/firebase';
import { 
  addGuestBookEntryToFirestore, 
  subscribeToGuestBookEntries,
  addReactionToEntry,
  removeReactionFromEntry
} from '../../Utils/guestBookUtils';
import { validateGuestBookMessageWithGemini } from '../../Utils/aiUtils';
import GuestBookForm from './GuestBookForm';
import GuestBookEntryItem from './GuestBookEntryItem';
import { ICONS, PREDEFINED_EMOJIS, ALL_FEATURE_IDS } from '../../App/constants';
import { LogLevel } from '../../App/types';
import { playSound } from '../../Utils/audioUtils';
import MaintenanceView from '../../UI/MaintenanceView'; // Import MaintenanceView
import { incrementStatistic } from '../../Utils/statisticsUtils'; // Added
import { BookHeart, MessageCircle, ShieldCheck, Users } from 'lucide-react';

const GuestBookView: React.FC<ViewProps> = ({ addAppLog, currentUser, userGuestBookNickname, userGitHubUsername, featureStatus }) => {
  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [isFetchingInitialEntries, setIsFetchingInitialEntries] = useState(true);
  // currentUser is now passed as a prop
  const [error, setError] = useState<string | null>(null);
  const newEntryTimeoutRef = useRef<number | null>(null);

  // Effective nickname calculation for the form
  const effectiveNickname = useMemo(() => {
    if (currentUser) {
      return userGuestBookNickname || currentUser.displayName || 'Authenticated User';
    }
    return 'Authenticated User';
  }, [currentUser, userGuestBookNickname]);


  useEffect(() => {
    if (featureStatus !== 'active') return; // Do not proceed if feature is not active

    addAppLog('info', 'GuestBookView mounted', 'GuestBook');
    // Auth state is now managed by App.tsx, currentUser is a prop.
    // We still log when currentUser prop changes.
    if (currentUser) {
      addAppLog('info', `User state updated in GuestBookView: ${currentUser.displayName}`, 'GuestBookAuth', {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
      });
    } else {
      addAppLog('info', 'User state updated in GuestBookView: No user signed in.', 'GuestBookAuth');
    }

    const unsubscribeEntries = subscribeToGuestBookEntries((newEntries) => {
      setEntries(prevEntries => {
        const prevEntryIds = new Set(prevEntries.map(e => e.id));
        return newEntries.map(ne => ({
          ...ne,
          isNew: !prevEntryIds.has(ne.id) && prevEntries.length > 0 
        }));
      });

      if (isFetchingInitialEntries) {
        setIsFetchingInitialEntries(false);
        addAppLog('info', 'Initial guest book entries loaded.', 'GuestBook');
      }
    });

    return () => {
      unsubscribeEntries();
      if (newEntryTimeoutRef.current) clearTimeout(newEntryTimeoutRef.current);
      addAppLog('info', 'GuestBookView unmounted, entries subscription cleaned up.', 'GuestBook');
    };
  }, [addAppLog, isFetchingInitialEntries, currentUser, featureStatus]); // Added currentUser and featureStatus to deps
  
  useEffect(() => {
    if (featureStatus !== 'active') return;
    const newEntry = entries.find(e => e.isNew);
    if (newEntry) {
      if (newEntryTimeoutRef.current) clearTimeout(newEntryTimeoutRef.current);
      newEntryTimeoutRef.current = window.setTimeout(() => { 
        setEntries(prev => prev.map(e => e.id === newEntry.id ? { ...e, isNew: false } : e));
      }, 3000); 
    }
  }, [entries, featureStatus]);


  const handleSignIn = async (providerName: 'google' | 'github') => {
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    try {
      setError(null);
      addAppLog('action', `Attempting sign-in with ${providerName}.`, 'GuestBookAuth');
      await signInWithPopup(auth, provider);
      playSound('ui-click'); 
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(`Sign-in failed: ${err.message}`);
      addAppLog('error', `Sign-in failed with ${providerName}.`, 'GuestBookAuth', { errorCode: err.code, errorMessage: err.message });
      playSound('error');
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      addAppLog('action', 'Attempting sign-out.', 'GuestBookAuth');
      await firebaseSignOut(auth);
      playSound('ui-click');
    } catch (err: any) {
      console.error("Sign-out error:", err);
      setError(`Sign-out failed: ${err.message}`);
      addAppLog('error', 'Sign-out failed.', 'GuestBookAuth', { errorCode: err.code, errorMessage: err.message });
      playSound('error');
    }
  };

  const handleSubmitMessage = async (message: string) => {
    if (!currentUser) {
      setError("You must be signed in to post a message.");
      addAppLog('warning', 'Submit attempt failed: User not signed in.', 'GuestBook');
      playSound('error');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const githubProviderInfo = currentUser.providerData.find(pd => pd.providerId === 'github.com');
    const authProviderForEntry = githubProviderInfo ? 'github' : 'google';
    
    let autoDetectedGitHubUsername: string | undefined = undefined;
    if (githubProviderInfo) {
      if (githubProviderInfo.email && githubProviderInfo.email.includes('+') && githubProviderInfo.email.endsWith('@users.noreply.github.com')) {
        const emailParts = githubProviderInfo.email.split('@')[0].split('+');
        if (emailParts.length === 2 && emailParts[1]) autoDetectedGitHubUsername = emailParts[1];
      }
      if (!autoDetectedGitHubUsername && githubProviderInfo.displayName && !githubProviderInfo.displayName.includes(' ')) {
        autoDetectedGitHubUsername = githubProviderInfo.displayName;
      }
    }

    // Prioritize user-defined preferences, then auth data, then defaults
    const finalNickname = userGuestBookNickname || currentUser.displayName || (authProviderForEntry === 'github' ? 'GitHub User' : 'Google User');
    const finalGithubLogin = userGitHubUsername || (authProviderForEntry === 'github' ? autoDetectedGitHubUsername : undefined);

    const entryDataForFirestore = {
      userId: currentUser.uid,
      authProvider: authProviderForEntry,
      nickname: finalNickname,
      avatarUrl: currentUser.photoURL || null, 
      githubLogin: finalGithubLogin || null,
      message: message,
      aiValidationStatus: 'pending', 
      reactions: {}, 
    };
    addAppLog('debug', 'Data prepared for Firestore guest book entry creation (before AI validation).', 'GuestBook', entryDataForFirestore);

    addAppLog('action', 'Attempting to submit guest book message.', 'GuestBook', { 
        messageLength: message.length,
        userId: currentUser.uid,
        finalNickname,
        finalGithubLogin,
        authProvider: authProviderForEntry
    });

    let tempEntryId: string | null = null; 

    try {
      let aiValidationStatus: AIValidationStatus = 'pending';
      tempEntryId = `temp-${Date.now()}`; 

      const optimisticEntry: GuestBookEntry = {
        id: tempEntryId,
        userId: currentUser.uid,
        authProvider: authProviderForEntry,
        nickname: finalNickname, 
        avatarUrl: currentUser.photoURL || undefined,
        githubLogin: finalGithubLogin, 
        message,
        timestamp: new Date(),
        aiValidationStatus: 'pending',
        reactions: {},
        isNew: true,
      };
      setEntries(prev => [optimisticEntry, ...prev]);

      aiValidationStatus = await validateGuestBookMessageWithGemini(message, addAppLog);
      
      if (tempEntryId) {
        setEntries(prev => prev.filter(entry => entry.id !== tempEntryId));
      }

      await addGuestBookEntryToFirestore(
        currentUser.uid,
        authProviderForEntry,
        finalNickname, 
        message,
        aiValidationStatus,
        currentUser.photoURL || undefined,
        finalGithubLogin 
      );
      incrementStatistic('guestbook/total_entries'); // Increment guest book entry count
      playSound('chat-receive'); 
      addAppLog('info', 'Guest book message submitted successfully.', 'GuestBook', { validationStatus: aiValidationStatus });

    } catch (err: any) {
      console.error("Error submitting message:", err);
      setError(`Failed to post message: ${err.message}`);
      addAppLog('error', 'Failed to submit guest book message.', 'GuestBook', { errorCode: err.code, errorMessage: err.message });
      if (tempEntryId) { 
        setEntries(prev => prev.filter(entry => entry.id !== tempEntryId));
      }
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (entryId: string, newEmojiClicked: string) => {
    if (!currentUser) {
      setError("You must be signed in to react.");
      addAppLog('warning', 'Reaction attempt failed: User not signed in.', 'GuestBook');
      playSound('error');
      return;
    }
    setError(null);
    
    const entry = entries.find(e => e.id === entryId);
    if (!entry) {
      addAppLog('warning', `Reaction attempt failed: Entry ${entryId} not found.`, 'GuestBook');
      return;
    }

    const userId = currentUser.uid;
    const currentReactions = entry.reactions || {};
    let previousReactionEmoji: string | null = null;

    for (const existingEmoji of PREDEFINED_EMOJIS) {
      if (currentReactions[existingEmoji]?.includes(userId)) {
        previousReactionEmoji = existingEmoji;
        break;
      }
    }

    try {
      if (previousReactionEmoji) {
        if (previousReactionEmoji === newEmojiClicked) {
          addAppLog('action', `User ${userId} removing reaction '${newEmojiClicked}' from entry ${entryId} (toggle off).`, 'GuestBook');
          await removeReactionFromEntry(entryId, newEmojiClicked, userId);
        } else {
          addAppLog('action', `User ${userId} changing reaction from '${previousReactionEmoji}' to '${newEmojiClicked}' on entry ${entryId}.`, 'GuestBook');
          await removeReactionFromEntry(entryId, previousReactionEmoji, userId); 
          await addReactionToEntry(entryId, newEmojiClicked, userId);
        }
      } else {
        addAppLog('action', `User ${userId} adding new reaction '${newEmojiClicked}' to entry ${entryId}.`, 'GuestBook');
        await addReactionToEntry(entryId, newEmojiClicked, userId);
      }
      playSound('ui-click');
    } catch (err: any) {
      console.error("Error updating reaction:", err);
      let displayError = "Failed to update reaction.";
      if (err.message && (err.message.toLowerCase().includes("permission") || err.message.toLowerCase().includes("missing or insufficient permissions"))) {
        displayError = `Failed to update reaction: Permission issue with database. Please ensure Firestore rules allow reaction updates. (${err.code || 'No Code'})`;
      } else if (err.message) {
        displayError = `Failed to update reaction: ${err.message} (${err.code || 'No Code'})`;
      }
      setError(displayError);
      addAppLog('error', 'Failed to update reaction.', 'GuestBook', { 
        errorMessage: err.message, 
        errorCode: err.code, 
        entryId, 
        emoji: newEmojiClicked,
        userId: currentUser.uid,
        userProvider: currentUser.providerData[0]?.providerId
      });
      playSound('error');
    }
  };

  if (featureStatus !== 'active') {
    return <MaintenanceView featureName={ALL_FEATURE_IDS.guestBook} featureIcon={ICONS.guest_book_icon} />;
  }

  return (
    <div className="guestbook-view h-full bg-[var(--editor-background)] text-[var(--editor-foreground)] overflow-y-auto relative">
      {isFetchingInitialEntries && (
        <div className="linear-progress-bar" aria-label="Loading guest book entries...">
          <div className="linear-progress-bar-indicator"></div>
        </div>
      )}
      <div className="guestbook-ambient" aria-hidden="true" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-[var(--border-color)]/70 pb-6 mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/icons/liquid/guest-book.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain liquid-content-icon" />
            <div>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.24em] text-[var(--text-accent)] mb-1">Open channel · PORTO CODE</p>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--editor-foreground)]">Leave a trace.</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-xl">A public log for hellos, feedback, and the conversations that begin after the code ships.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] font-mono">
            <span className="inline-flex items-center gap-1.5"><MessageCircle size={14} className="text-[var(--text-accent)]" /> {entries.length} messages</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-[var(--text-accent)]" /> Public</span>
          </div>
        </header>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-[var(--notification-error-background)] text-[var(--notification-error-foreground)] border border-[var(--notification-error-border)] text-xs" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.45fr)] gap-6 lg:gap-8 items-start">
          <aside className="lg:sticky lg:top-6 space-y-3">
            <GuestBookForm
              currentUser={currentUser}
              effectiveNickname={effectiveNickname}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              onSubmitMessage={handleSubmitMessage}
              isSubmitting={isLoading}
            />
            <div className="flex items-center gap-2 px-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
              <ShieldCheck size={14} className="text-[var(--text-accent)] flex-shrink-0" />
              Messages are checked before joining the public log.
            </div>
          </aside>

          <section aria-label="Guest book messages">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookHeart size={16} className="text-[var(--text-accent)]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.18em]">Visitor log</h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Newest first</span>
            </div>

            <div className="space-y-3">
              {entries.length === 0 && !isFetchingInitialEntries && (
                <div className="guestbook-empty text-center text-[var(--text-muted)] py-16 px-6 rounded-2xl border border-dashed border-[var(--border-color)]">
                  <MessageCircle size={34} className="mx-auto mb-3 text-[var(--text-accent)] opacity-70" />
                  <p className="text-base font-semibold text-[var(--editor-foreground)]">No transmissions yet.</p>
                  <p className="text-xs mt-1">Start the log with the first message.</p>
                </div>
              )}
              {entries.map((entry, index) => (
                <GuestBookEntryItem
                  key={entry.id}
                  entry={entry}
                  entryNumber={entries.length - index}
                  currentUser={currentUser}
                  onReaction={(emoji) => handleReaction(entry.id, emoji)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GuestBookView;
