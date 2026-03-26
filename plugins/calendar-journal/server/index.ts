import type { PluginAPI, NoteEntry } from '../../../types/server';

interface JournalEntry {
  date: string;       // YYYY-MM-DD
  path: string;       // note path
  title: string;      // first heading or filename
  wordCount: number;
  preview: string;    // first 100 chars of content (non-heading)
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractTitle(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function extractPreview(content: string): string {
  // Skip heading lines and return first meaningful text
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      return t.slice(0, 100);
    }
  }
  return '';
}

function collectDirectFiles(entries: NoteEntry[]): NoteEntry[] {
  const files: NoteEntry[] = [];
  for (const entry of entries) {
    if (entry.type === 'file') files.push(entry);
  }
  return files;
}

export function activate(api: PluginAPI): void {
  api.log.info('Calendar Journal plugin activated');

  // GET /entries?year=YYYY&month=MM
  api.routes.register('get', '/entries', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const year = parseInt(req.query?.year as string, 10) || new Date().getFullYear();
    const month = parseInt(req.query?.month as string, 10) || new Date().getMonth() + 1;
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    try {
      const allEntries = await api.notes.list(userId, 'Daily');
      const files = collectDirectFiles(allEntries);

      const matchingFiles = files.filter(
        (e) => e.name.startsWith(prefix) && e.name.endsWith('.md')
      );

      const entries: JournalEntry[] = await Promise.all(
        matchingFiles.map(async (file) => {
          const date = file.name.replace(/\.md$/, '');
          try {
            const note = await api.notes.get(userId, `Daily/${date}`);
            return {
              date,
              path: `Daily/${date}.md`,
              title: extractTitle(note.content, date),
              wordCount: countWords(note.content),
              preview: extractPreview(note.content),
            };
          } catch {
            return {
              date,
              path: `Daily/${date}.md`,
              title: date,
              wordCount: 0,
              preview: '',
            };
          }
        })
      );

      // Sort ascending
      entries.sort((a, b) => a.date.localeCompare(b.date));
      res.json({ entries });
    } catch {
      res.json({ entries: [] });
    }
  });

  // POST /create-entry — create today's (or given date's) daily note
  api.routes.register('post', '/create-entry', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const date: string = (req.body?.date as string) || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format; expected YYYY-MM-DD' });
      return;
    }

    const logicalPath = `Daily/${date}`;
    try {
      const note = await api.notes.get(userId, logicalPath);
      res.json({ path: `${logicalPath}.md`, content: note.content, existed: true });
    } catch {
      const content = `# ${date}\n\n`;
      try {
        await api.notes.create(userId, logicalPath, content);
        res.json({ path: `${logicalPath}.md`, content, existed: false });
      } catch (err: any) {
        api.log.error('Calendar Journal /create-entry error', err);
        res.status(500).json({ error: err?.message ?? 'Failed to create entry' });
      }
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
