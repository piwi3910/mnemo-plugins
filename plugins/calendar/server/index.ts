import type { PluginAPI, NoteEntry } from '../../../types/server';

/**
 * Collect direct file children of the root entries list (non-recursive),
 * used for the Daily folder which is a flat list of date-named notes.
 */
function collectDirectFiles(entries: NoteEntry[]): NoteEntry[] {
  const files: NoteEntry[] = [];
  for (const entry of entries) {
    if (entry.type === 'file') {
      files.push(entry);
    }
  }
  return files;
}

export function activate(api: PluginAPI): void {
  api.log.info('Calendar server plugin activated');

  // GET /dates?year=YYYY&month=M — return ISO date strings that have daily notes
  api.routes.register('get', '/dates', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;

    try {
      const entries = await api.notes.list(userId, 'Daily');
      const files = collectDirectFiles(entries);

      // Daily notes are named like "2026-03-24.md"
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const dates = files
        .filter((e) => e.name.startsWith(prefix) && e.name.endsWith('.md'))
        .map((e) => e.name.replace(/\.md$/, ''));

      res.json(dates);
    } catch {
      // Daily folder doesn't exist yet — return empty list
      res.json([]);
    }
  });

  // POST /open/:date — open (or create) a daily note for the given ISO date
  api.routes.register('post', '/open/:date', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const date: string = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format; expected YYYY-MM-DD' });
      return;
    }

    const logicalPath = `Daily/${date}`;

    try {
      const note = await api.notes.get(userId, logicalPath);
      res.json({ path: `${logicalPath}.md`, content: note.content });
    } catch {
      // Note doesn't exist yet — create it
      const content = `# Daily Note — ${date}\n\n`;
      try {
        await api.notes.create(userId, logicalPath, content);
        res.json({ path: `${logicalPath}.md`, content });
      } catch (createErr: any) {
        api.log.error('Calendar /open create error', createErr);
        res.status(500).json({ error: createErr.message ?? 'Failed to create daily note' });
      }
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
