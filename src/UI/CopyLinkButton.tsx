import React, { useEffect, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Tab } from '../App/types';
import { getTabShareUrl } from '../Utils/tabHash';
import { playSound } from '../Utils/audioUtils';

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
};

// Copies a deep link (e.g. https://…/#/projects.json) to the tab, for sharing.
const CopyLinkButton: React.FC<{ tab: Tab; className?: string }> = ({ tab, className }) => {
  const [copied, setCopied] = useState(false);
  const url = getTabShareUrl(tab);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!url) return null;

  const handleClick = async () => {
    if (await copyText(url)) {
      setCopied(true);
      playSound('setting-change');
    }
  };

  return (
    <button
      onClick={handleClick}
      title={copied ? 'Link copied!' : 'Copy link to this tab'}
      aria-label={copied ? 'Link copied' : 'Copy link to this tab'}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--titlebar-button-hover-background)] hover:text-[var(--breadcrumbs-focus-foreground)] transition-colors ${copied ? 'text-emerald-400' : ''} ${className || ''}`}
    >
      {copied ? <Check size={13} /> : <Link2 size={13} />}
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  );
};

export default CopyLinkButton;
