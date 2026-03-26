import type { PluginAPI, NoteEntry, Note } from '../../../types/server';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface DailyCount {
  date: string;  // YYYY-MM-DD
  count: number;
}

interface StatsPayload {
  totalNotes: number;
  totalWords: number;
  averageLength: number;
  notesPerDay: DailyCount[];
  topTags: Array<{ tag: string; count: number }>;
  totalLinks: number;
  computedAt: string;
}

interface CachedStats {
  data: StatsPayload;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractTags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_/-]+)/g) ?? [];
  return matches.map((m) => m.slice(1));
}

function countLinks(content: string): number {
  const mdLinks = (content.match(/\[([^\]]+)\]\([^)]+\)/g) ?? []).length;
  const wikiLinks = (content.match(/\[\[[^\]]+\]\]/g) ?? []).length;
  return mdLinks + wikiLinks;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function last30Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(toDateString(d));
  }
  return days;
}

// ---------------------------------------------------------------------------
// Collect all file paths from a NoteEntry tree
// ---------------------------------------------------------------------------

function collectFilePaths(entries: NoteEntry[]): string[] {
  const paths: string[] = [];
  for (const entry of entries) {
    if (entry.type === 'file' && entry.path.endsWith('.md')) {
      paths.push(entry.path);
    } else if (entry.type === 'directory' && entry.children) {
      paths.push(...collectFilePaths(entry.children));
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Compute stats
// ---------------------------------------------------------------------------

async function computeStats(api: PluginAPI, userId: string): Promise<StatsPayload> {
  let entries: NoteEntry[] = [];
  try {
    entries = await api.notes.list(userId);
  } catch {
    // vault may be empty
  }

  const paths = collectFilePaths(entries);

  let totalWords = 0;
  let totalLinks = 0;
  const tagCounts: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};

  // Fetch all notes in parallel (capped to avoid overload on large vaults)
  const BATCH = 50;
  for (let i = 0; i < paths.length; i += BATCH) {
    const batch = paths.slice(i, i + BATCH);
    const notes = await Promise.all(
      batch.map(async (p) => {
        try {
          return await api.notes.get(userId, p);
        } catch {
          return null;
        }
      })
    );

    for (const note of notes) {
      if (!note) continue;
      totalWords += countWords(note.content);
      totalLinks += countLinks(note.content);

      for (const tag of extractTags(note.content)) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }

      // Use modifiedAt to approximate creation date for per-day counts
      const dateStr = toDateString(new Date(note.modifiedAt));
      dayCounts[dateStr] = (dayCounts[dateStr] ?? 0) + 1;
    }
  }

  const totalNotes = paths.length;
  const averageLength = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const days = last30Days();
  const notesPerDay: DailyCount[] = days.map((date) => ({
    date,
    count: dayCounts[date] ?? 0,
  }));

  return {
    totalNotes,
    totalWords,
    averageLength,
    notesPerDay,
    topTags,
    totalLinks,
    computedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plugin activation
// ---------------------------------------------------------------------------

export function activate(api: PluginAPI): void {
  api.log.info('Metrics plugin activated');

  // GET /stats — returns aggregated writing statistics
  api.routes.register('get', '/stats', async (req, res) => {
    try {
      const userId: string = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const cacheKey = `metrics:stats-cache:${userId}`;
      const forceRefresh = req.query?.refresh === 'true';

      // Check cache
      if (!forceRefresh) {
        try {
          const cached = await api.storage.get(cacheKey, userId) as CachedStats | null;
          if (cached && typeof cached === 'object' && cached.expiresAt > Date.now()) {
            res.json({ stats: cached.data, cached: true });
            return;
          }
        } catch {
          // Cache miss or error — proceed to compute
        }
      }

      // Compute fresh stats
      const stats = await computeStats(api, userId);

      // Cache the result
      try {
        const cacheEntry: CachedStats = {
          data: stats,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        await api.storage.set(cacheKey, cacheEntry, userId);
      } catch {
        // Non-fatal — just skip caching
      }

      res.json({ stats, cached: false });
    } catch (err: any) {
      api.log.error('Metrics GET /stats error', err);
      res.status(500).json({ error: 'Failed to compute stats' });
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
