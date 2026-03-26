import type { PluginAPI } from '../../../types/server';
import * as https from 'https';
import * as http from 'http';

interface Feed {
  id: string;
  url: string;
  title: string;
  addedAt: string;
}

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

// Simple XML tag extractor — pulls the first occurrence of <tag>content</tag>
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(?:<\\!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

// Extract all <item> or <entry> blocks from RSS/Atom XML
function extractItems(xml: string): string[] {
  const tag = xml.includes('<entry') ? 'entry' : 'item';
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?<\\/${tag}>`, 'gi');
  return xml.match(re) ?? [];
}

function parseFeedTitle(xml: string): string {
  // Try to get channel title
  const channelMatch = xml.match(/<channel[\s>][\s\S]*?<\/channel>/i);
  if (channelMatch) return extractTag(channelMatch[0], 'title') || 'Untitled Feed';
  return extractTag(xml, 'title') || 'Untitled Feed';
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      headers: {
        'User-Agent': 'Mnemo RSS Reader/1.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      timeout: 10000,
    };

    const req = lib.get(options as any, (resp) => {
      // Handle redirects
      if (resp.statusCode && resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        fetchUrl(resp.headers.location).then(resolve).catch(reject);
        return;
      }
      if (resp.statusCode && resp.statusCode >= 400) {
        reject(new Error(`HTTP ${resp.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      resp.on('data', (c: Buffer) => chunks.push(c));
      resp.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      resp.on('error', reject);
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

const FEEDS_STORAGE_KEY = 'rss:feeds';

export function activate(api: PluginAPI): void {
  api.log.info('RSS Reader plugin activated');

  // GET /feeds
  api.routes.register('get', '/feeds', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    try {
      const feeds = (await api.storage.get(FEEDS_STORAGE_KEY, userId) as Feed[] | null) ?? [];
      res.json({ feeds });
    } catch {
      res.json({ feeds: [] });
    }
  });

  // POST /feeds — add a feed
  api.routes.register('post', '/feeds', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const url: string = req.body?.url;
    if (!url) { res.status(400).json({ error: 'Missing url' }); return; }

    try {
      // Fetch the feed to get its title
      let title = url;
      try {
        const xml = await fetchUrl(url);
        title = parseFeedTitle(xml) || url;
      } catch {
        // Use URL as title if fetch fails
      }

      const feeds = (await api.storage.get(FEEDS_STORAGE_KEY, userId) as Feed[] | null) ?? [];

      // Prevent duplicates
      if (feeds.some((f) => f.url === url)) {
        res.status(409).json({ error: 'Feed already exists' });
        return;
      }

      const newFeed: Feed = {
        id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        url,
        title,
        addedAt: new Date().toISOString(),
      };

      feeds.push(newFeed);
      await api.storage.set(FEEDS_STORAGE_KEY, feeds, userId);
      res.json({ feed: newFeed });
    } catch (err: any) {
      api.log.error('RSS POST /feeds error', err);
      res.status(500).json({ error: err?.message ?? 'Failed to add feed' });
    }
  });

  // DELETE /feeds/:id
  api.routes.register('delete', '/feeds/:id', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const id: string = req.params.id;
    try {
      const feeds = (await api.storage.get(FEEDS_STORAGE_KEY, userId) as Feed[] | null) ?? [];
      const updated = feeds.filter((f) => f.id !== id);
      await api.storage.set(FEEDS_STORAGE_KEY, updated, userId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? 'Failed to remove feed' });
    }
  });

  // GET /feeds/:id/items
  api.routes.register('get', '/feeds/:id/items', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const id: string = req.params.id;
    try {
      const feeds = (await api.storage.get(FEEDS_STORAGE_KEY, userId) as Feed[] | null) ?? [];
      const feed = feeds.find((f) => f.id === id);
      if (!feed) { res.status(404).json({ error: 'Feed not found' }); return; }

      const xml = await fetchUrl(feed.url);
      const rawItems = extractItems(xml);
      const items: FeedItem[] = rawItems.slice(0, 20).map((block) => {
        // Prefer <link href="..."> for Atom, else content of <link>
        const linkHrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
        const link = linkHrefMatch ? linkHrefMatch[1] : extractTag(block, 'link');
        return {
          title: extractTag(block, 'title') || '(No title)',
          link,
          description: extractTag(block, 'description') || extractTag(block, 'summary') || '',
          pubDate: extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || '',
        };
      });

      res.json({ items });
    } catch (err: any) {
      api.log.error('RSS GET /feeds/:id/items error', err);
      res.status(500).json({ error: err?.message ?? 'Failed to fetch feed' });
    }
  });

  // POST /clip — save an article as a note
  api.routes.register('post', '/clip', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { title, url, content } = req.body ?? {};
    if (!title || !url) { res.status(400).json({ error: 'Missing title or url' }); return; }

    const safeTitle = String(title).replace(/[/\\:*?"<>|]/g, '-').slice(0, 80);
    const notePath = `RSS Clips/${safeTitle}`;
    const noteContent = [
      `# ${title}`,
      '',
      `Source: ${url}`,
      `Clipped: ${new Date().toISOString().slice(0, 10)}`,
      '',
      '---',
      '',
      content ? String(content) : '',
    ].join('\n');

    try {
      await api.notes.create(userId, notePath, noteContent);
      res.json({ path: `${notePath}.md` });
    } catch (err: any) {
      api.log.error('RSS POST /clip error', err);
      res.status(500).json({ error: err?.message ?? 'Failed to save note' });
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
