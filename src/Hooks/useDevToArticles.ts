import { useState, useCallback } from 'react';
import { ArticleItem, LogLevel } from '../App/types';

// Crawled at build time by scripts/crawl-articles.ts and served as a static asset,
// so the ~2 MB payload is only downloaded when the articles view is opened.
const ARTICLES_URL = '/data/articles.json';

export const useDevToArticles = (
  username: string, 
  addAppLogHook?: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void
) => {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const log = addAppLogHook || console.log;

  const fetchArticles = useCallback(async (isRetry: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    if (typeof log === 'function') {
      log('info', `Local crawled articles fetch started. Retry: ${isRetry}`, 'CrawledArticlesHook');
    }

    try {
      const response = await fetch(ARTICLES_URL);
      if (!response.ok) {
        throw new Error(`Failed to load articles (HTTP ${response.status}).`);
      }
      const crawledArticles: ArticleItem[] = await response.json();

      const sortedData = crawledArticles.sort((a, b) => 
        new Date(b.published_timestamp).getTime() - new Date(a.published_timestamp).getTime()
      );

      setArticles(sortedData);
      if (typeof log === 'function') {
        log('info', `Successfully loaded ${sortedData.length} crawled articles.`, 'CrawledArticlesHook');
      }
      setIsLoading(false);
      return true;
    } catch (e: any) {
      const errorMessage = e.message || "An unknown error occurred while loading articles.";
      console.error("Error loading articles:", e);
      setError(errorMessage);
      setArticles([]); 
      if (typeof log === 'function') {
        log('error', `Failed to load articles: ${errorMessage}`, 'CrawledArticlesHook', { error: e });
      }
      setIsLoading(false);
      return false;
    }
  }, [log]);

  return { articles, isLoading, error, fetchArticles };
};