import { Tab } from '../App/types';

// URL hash (without the leading "#/") that deep-links to a tab, or '' if the tab has none.
export const getTabHash = (tab: Tab): string => {
  switch (tab.type) {
    case 'file':
    case 'project_detail':
      return tab.id;
    case 'article_detail':
      return `article_${tab.articleId}`;
    case 'ai_chat':
      return 'ai_chat';
    case 'github_profile_view':
      return 'github';
    case 'guest_book':
      return 'guest_book';
    case 'settings_editor':
      return 'settings';
    case 'cv_preview':
      return 'cv_preview';
    case 'spotify_view':
      return 'spotify';
    case 'json_preview':
      return `${tab.id.replace('_preview', '')}_preview`;
    default:
      return '';
  }
};

export const getTabShareUrl = (tab: Tab): string | null => {
  const hash = getTabHash(tab);
  return hash ? `${window.location.origin}${window.location.pathname}#/${hash}` : null;
};
