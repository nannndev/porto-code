import fs from 'fs';
import path from 'path';
import axios from 'axios';
import xml2js from 'xml2js';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { sourcesConfig } from './sourcesConfig';

// Helper to convert HTML tag structures to Markdown
function convertElementToMarkdown(node: any, $: cheerio.CheerioAPI): string {
  if (node.type === 'text') {
    return node.data || '';
  }

  let childrenMarkdown = '';
  if (node.children) {
    node.children.forEach((child: any) => {
      childrenMarkdown += convertElementToMarkdown(child, $);
    });
  }

  const tagName = node.name?.toLowerCase();
  switch (tagName) {
    case 'h1': return `\n\n# ${childrenMarkdown.trim()}\n\n`;
    case 'h2': return `\n\n## ${childrenMarkdown.trim()}\n\n`;
    case 'h3': return `\n\n### ${childrenMarkdown.trim()}\n\n`;
    case 'h4': return `\n\n#### ${childrenMarkdown.trim()}\n\n`;
    case 'h5': return `\n\n##### ${childrenMarkdown.trim()}\n\n`;
    case 'h6': return `\n\n###### ${childrenMarkdown.trim()}\n\n`;
    case 'p': return `\n\n${childrenMarkdown.trim()}\n\n`;
    case 'strong':
    case 'b': return `**${childrenMarkdown}**`;
    case 'em':
    case 'i': return `*${childrenMarkdown}*`;
    case 'li': return `- ${childrenMarkdown.trim()}\n`;
    case 'ul': return `\n\n${childrenMarkdown}\n\n`;
    case 'ol': return `\n\n${childrenMarkdown}\n\n`;
    case 'a': {
      const href = node.attribs?.href;
      if (href && childrenMarkdown.trim()) {
        return `[${childrenMarkdown.trim()}](${href})`;
      }
      return childrenMarkdown;
    }
    case 'br': return '\n';
    case 'code': return `\`${childrenMarkdown}\``;
    case 'pre': return `\n\`\`\`\n${childrenMarkdown}\n\`\`\`\n`;
    case 'blockquote': return `\n> ${childrenMarkdown.trim().split('\n').join('\n> ')}\n`;
    default: return childrenMarkdown;
  }
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const $ = cheerio.load(html);
  const body = $('body')[0];
  if (!body) return '';
  return convertElementToMarkdown(body, $)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Helper to fix common XML entity issues and parse string to promise
async function parseXml(xml: string) {
  try {
    let cleanedXml = xml.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-fA-F\d]+);)/g, '&amp;');
    cleanedXml = cleanedXml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const parsed = await xml2js.parseStringPromise(cleanedXml, {
      trim: true,
      explicitArray: false,
      attrkey: false,
      mergeAttrs: true,
      normalize: true,
    });

    if (!parsed || !parsed.rss || !parsed.rss.channel) {
      throw new Error('Invalid RSS structure');
    }

    return parsed.rss.channel;
  } catch (error: any) {
    throw new Error(`XML Parsing Error: ${error.message}`);
  }
}

// Scrape full article details
async function fetchArticleDetail(url: string, selectors: any = {}) {
  try {
    let currentUrl: string | null = url;
    let allContent = '';
    let allContentHtml = '';
    let firstPageData: any = null;
    let firstPageHtml: string | null = null;
    let visitedUrls = new Set<string>();
    let pageCount = 0;

    while (currentUrl && !visitedUrls.has(currentUrl) && pageCount < 3) { // limit to 3 pages max per article for build speed
      visitedUrls.add(currentUrl);
      pageCount++;

      const { data } = await axios.get(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/',
        },
        timeout: 8000,
      });

      if (!firstPageHtml) {
        firstPageHtml = data as string;
      }

      const dom = new JSDOM(data, { url: currentUrl });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!firstPageData) {
        firstPageData = article;
      }

      if (article?.textContent) {
        allContent += (allContent ? '\n\n' : '') + article.textContent.trim();
      }

      if (article?.content) {
        allContentHtml += (allContentHtml ? '<hr class="page-divider">' : '') + article.content;
      }

      // Detect next page
      const $ = cheerio.load(data);
      let nextUrl: string | null = null;

      // Special case for Tribun: often has "?page=all" which is better
      if (currentUrl.includes('tribunnews.com') && !currentUrl.includes('?page=all')) {
        nextUrl = currentUrl.includes('?') ? `${currentUrl}&page=all` : `${currentUrl}?page=all`;
      } else {
        const nextLink = $('a').filter((i, el) => {
          const text = $(el).text().toLowerCase();
          const href = $(el).attr('href');
          return !!(
            href &&
            (text.includes('selanjutnya') ||
             text.includes('next') ||
             (text.trim().match(/^\d+$/) && parseInt(text.trim()) === pageCount + 1))
          );
        }).first();

        if (nextLink.length > 0) {
          nextUrl = new URL(nextLink.attr('href') || '', currentUrl || '').href;
        }
      }

      if (nextUrl && !visitedUrls.has(nextUrl)) {
        currentUrl = nextUrl;
      } else {
        currentUrl = null;
      }
    }

    if (!firstPageHtml) {
      return {
        contentMarkdown: null,
        excerpt: null,
        author: null,
        tags: null,
      };
    }

    const $ = cheerio.load(firstPageHtml);
    const authorSelector = selectors.author || '.author, .writer, .byline, .text-muted, .penulis, .reporter, .author-name, #penulis, .by';
    const tagsSelector = selectors.tags || '.tags a, .tag-links a, [href*="/tag/"], .detail-tag a, .detail_tag a, .tag a';

    let author = firstPageData?.byline || $(authorSelector).first().text().trim() || null;
    if (author) {
      author = author.replace(/\t|\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const tags: string[] = [];
    $(tagsSelector).each((i, el) => {
      const tagText = $(el).text().trim();
      if (tagText && !tags.includes(tagText)) tags.push(tagText);
    });

    const markdown = htmlToMarkdown(allContentHtml);

    return {
      contentMarkdown: markdown || allContent || null,
      excerpt: firstPageData?.excerpt || null,
      author,
      tags: tags.length > 0 ? tags : null,
    };
  } catch (error: any) {
    console.error(`Error crawling details for ${url}:`, error.message);
    return {
      contentMarkdown: null,
      excerpt: null,
      author: null,
      tags: null,
    };
  }
}

// Clean HTML strings (like description / summary)
function cleanHtml(str: string): string {
  if (!str) return '';
  return str.replace(/(<([^>]+)>)/gi, '').trim();
}

// Generate human-friendly publish date
function toReadableDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Date not available';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  } catch {
    return 'Date not available';
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Helper function to run tasks with concurrency limits
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      try {
        results[currentIndex] = await fn(item);
      } catch (err) {
        // Suppress errors inside worker to let other workers finish
      }
    }
  });

  await Promise.all(workers);
  return results;
}

interface FeedTarget {
  sourceId: string;
  source: any;
  categoryKey: string;
  rssUrl: string;
}

interface PendingArticle {
  sourceId: string;
  source: any;
  categoryKey: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  coverImage: string | null;
}

async function run() {
  console.log('🚀 Starting Concurrent Article Scraping Script...');

  // Dynamically extract all sources and categories from sourcesConfig
  const feedTargets: FeedTarget[] = [];
  for (const sourceId of Object.keys(sourcesConfig)) {
    const source = sourcesConfig[sourceId];
    if (!source || !source.categories) continue;
    for (const categoryKey of Object.keys(source.categories)) {
      const categoryPath = source.categories[categoryKey];
      if (categoryPath === undefined) continue;

      let rssUrl = categoryPath;
      if (!categoryPath.startsWith('http://') && !categoryPath.startsWith('https://')) {
        rssUrl = source.baseUrl + categoryPath;
      }
      feedTargets.push({ sourceId, source, categoryKey, rssUrl });
    }
  }

  console.log(`📡 Fetching ${feedTargets.length} RSS feeds concurrently...`);

  const maxArticlesPerCategory = 2;
  const pendingArticles: PendingArticle[] = [];
  const seenUrls = new Set<string>();

  await runWithConcurrency(feedTargets, 15, async (target) => {
    try {
      const { data: xmlData } = await axios.get(target.rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      });

      const channel = await parseXml(xmlData);
      let items = channel.item || [];
      if (!Array.isArray(items)) {
        items = [items];
      }

      let count = 0;
      for (const item of items) {
        if (count >= maxArticlesPerCategory) break;

        const title = item.title;
        const link = item.link;
        if (!title || !link) continue;

        let resolvedLink = typeof link === 'string' ? link : (link._ || link.href || '');
        if (typeof resolvedLink !== 'string' || !resolvedLink.startsWith('http')) {
          continue;
        }

        if (seenUrls.has(resolvedLink)) {
          continue;
        }
        seenUrls.add(resolvedLink);

        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
        const description = cleanHtml(item.description || '');

        let coverImage = null;
        if (item.enclosure && item.enclosure.url) {
          coverImage = item.enclosure.url;
        } else if (item.enclosure && item.enclosure.href) {
          coverImage = item.enclosure.href;
        } else if (target.source.postKeys?.thumbnail && item[target.source.postKeys.thumbnail]) {
          coverImage = item[target.source.postKeys.thumbnail];
        }

        pendingArticles.push({
          sourceId: target.sourceId,
          source: target.source,
          categoryKey: target.categoryKey,
          title,
          link: resolvedLink,
          pubDate,
          description,
          coverImage,
        });

        count++;
      }
    } catch (err: any) {
      // Fail silently for individual feeds
    }
  });

  console.log(`✅ RSS Feeds fetched. Found ${pendingArticles.length} unique articles. Crawling details concurrently...`);

  const allArticles: any[] = [];
  let articleId = 1;

  await runWithConcurrency(pendingArticles, 10, async (pending) => {
    try {
      console.log(`🕷️ Crawling detail for: "${pending.title}" (${pending.sourceId})`);
      const details = await fetchArticleDetail(pending.link, pending.source.selectors || {});

      // Skip article if content extraction failed completely
      if (!details.contentMarkdown) return;

      const wordCount = (details.contentMarkdown || '').split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      const article = {
        type_of: 'article',
        id: articleId++,
        title: pending.title,
        description: details.excerpt || pending.description || 'No summary available.',
        readable_publish_date: toReadableDate(pending.pubDate),
        slug: generateSlug(pending.title),
        path: `/article/${generateSlug(pending.title)}`,
        url: pending.link,
        comments_count: 0,
        public_reactions_count: 0,
        collection_id: null,
        published_timestamp: pending.pubDate,
        positive_reactions_count: 0,
        cover_image: pending.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
        social_image: pending.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
        canonical_url: pending.link,
        created_at: pending.pubDate,
        edited_at: null,
        crossposted_at: null,
        published_at: pending.pubDate,
        last_comment_at: '',
        reading_time_minutes: readingTime,
        tag_list: details.tags || ['news', pending.sourceId, pending.categoryKey],
        tags: (details.tags || ['news', pending.sourceId, pending.categoryKey]).join(', '),
        body_markdown: details.contentMarkdown,
        category: pending.categoryKey,
        user: {
          name: pending.source.name,
          username: pending.sourceId,
          twitter_username: null,
          github_username: null,
          user_id: 100 + articleId,
          website_url: pending.source.baseUrl,
          profile_image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80',
          profile_image_90: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80'
        }
      };

      allArticles.push(article);
    } catch (err: any) {
      console.error(`❌ Failed crawling details for "${pending.title}": ${err.message}`);
    }
  });

  // Sort articles by published_timestamp descending so newest are on top
  allArticles.sort((a, b) => new Date(b.published_timestamp).getTime() - new Date(a.published_timestamp).getTime());

  // Assign clean sequential IDs
  allArticles.forEach((article, index) => {
    article.id = index + 1;
  });

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(allArticles, null, 2), 'utf-8');
  console.log(`\n🎉 Success! Wrote ${allArticles.length} crawled articles to: ${outputPath}`);
}

run();
