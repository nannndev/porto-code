import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { playSound } from '../../Utils/audioUtils';

const STORAGE_KEY = 'portfolio-onboarding-done';
const START_DELAY_MS = 1500;

interface TourStep {
  // CSS selectors tried in order; the first visible match is highlighted.
  targets: string[];
  title: string;
  body: string;
  mobileBody?: string;
}

const STEPS: TourStep[] = [
  {
    targets: ['[aria-label="Explorer"]'],
    title: 'Browse like a codebase',
    body: 'Open the Explorer to read my profile as files: about, experience, skills, projects and contact.',
  },
  {
    targets: ['[aria-label="Open menu"]', '[data-tour="command-center"]'],
    title: 'Jump anywhere',
    body: 'Press Ctrl+Shift+P (⌘⇧P on Mac) to open the Command Palette and go to any file or action.',
    mobileBody: 'Tap the menu to search files and actions, just like the Command Palette.',
  },
  {
    targets: ['[aria-label="AI Assistant"]'],
    title: 'Ask the AI assistant',
    body: 'Not sure where to start? Ask about my skills, projects or experience.',
  },
];

const isVisible = (el: Element): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const findTarget = (step: TourStep): Element | null => {
  for (const selector of step.targets) {
    const match = Array.from(document.querySelectorAll(selector)).find(isVisible);
    if (match) return match;
  }
  return null;
};

const hasCompletedTour = (): boolean => {
  try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return true; }
};

// First-visit coach marks pointing at the three ways to explore the portfolio.
const OnboardingTour: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (hasCompletedTour()) return;
    const timer = setTimeout(() => setStepIndex(0), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const finish = useCallback(() => {
    setStepIndex(null);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* storage unavailable */ }
  }, []);

  const goTo = useCallback((index: number) => {
    // Skip steps whose target isn't on screen (e.g. a feature under maintenance).
    let next = index;
    while (next < STEPS.length && !findTarget(STEPS[next])) next++;
    if (next >= STEPS.length) finish();
    else setStepIndex(next);
  }, [finish]);

  useLayoutEffect(() => {
    if (stepIndex === null) return;
    const update = () => {
      const target = findTarget(STEPS[stepIndex]);
      if (target) setRect(target.getBoundingClientRect());
      else goTo(stepIndex + 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [stepIndex, goTo]);

  useEffect(() => {
    if (stepIndex === null) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [stepIndex, finish]);

  if (stepIndex === null || !rect) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const padding = 6;
  const cardWidth = Math.min(300, window.innerWidth - 32);

  // Place the card beside the target, keeping it on screen.
  let top: number;
  let left: number;
  if (rect.top > window.innerHeight * 0.6) {
    top = rect.top - padding - 12 - 150; // above (e.g. mobile bottom tab bar)
    left = rect.left + rect.width / 2 - cardWidth / 2;
  } else if (rect.top < 80) {
    top = rect.bottom + padding + 12; // below anything in the title bar
    left = rect.left + rect.width / 2 - cardWidth / 2;
  } else if (rect.right < 120) {
    top = rect.top - padding;
    left = rect.right + padding + 12; // right of the vertical activity bar
  } else {
    top = rect.bottom + padding + 12; // below (e.g. title bar)
    left = rect.left + rect.width / 2 - cardWidth / 2;
  }
  left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
  top = Math.max(16, top);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Quick tour">
      <div className="absolute inset-0" onClick={finish} />
      <div
        className="absolute rounded-lg ring-2 ring-[var(--text-accent)] pointer-events-none transition-all duration-300"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
        }}
      />
      <div
        className="absolute p-4 rounded-xl border border-[var(--border-color)] bg-[var(--modal-background,#1e1e1e)] text-[var(--text-default)] shadow-2xl transition-all duration-300"
        style={{ top, left, width: cardWidth }}
      >
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-accent)] font-bold mb-1">
          Quick tour · {stepIndex + 1}/{STEPS.length}
        </p>
        <h3 className="text-sm font-bold mb-1">{step.title}</h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{isMobile && step.mobileBody ? step.mobileBody : step.body}</p>
        <div className="flex items-center justify-between mt-3">
          <button onClick={finish} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-default)]">
            Skip tour
          </button>
          <button
            onClick={() => { playSound('ui-click'); if (isLast) finish(); else goTo(stepIndex + 1); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] hover:bg-[var(--modal-button-hover-background)]"
            autoFocus
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
