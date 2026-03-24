import type { PluginAPI, NoteEntry } from '../../../types/server';

/**
 * Recursively collect all .md file paths from a NoteEntry tree.
 */
function collectMdPaths(entries: NoteEntry[]): string[] {
  const paths: string[] = [];
  for (const entry of entries) {
    if (entry.type === 'file' && entry.name.endsWith('.md')) {
      paths.push(entry.path);
    } else if (entry.type === 'directory' && entry.children) {
      paths.push(...collectMdPaths(entry.children));
    }
  }
  return paths;
}

export function activate(api: PluginAPI): void {
  api.log.info('Checklist server plugin activated');

  // GET /notes — return all notes that contain checkbox syntax
  api.routes.register('get', '/notes', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const entries = await api.notes.list(userId);
      const paths = collectMdPaths(entries);

      const results: Array<{ path: string; content: string }> = [];

      await Promise.all(
        paths.map(async (notePath) => {
          try {
            // Derive the logical path (strip .md suffix) for api.notes.get
            const logicalPath = notePath.replace(/\.md$/, '');
            const note = await api.notes.get(userId, logicalPath);
            if (
              note.content.includes('- [ ]') ||
              note.content.includes('- [x]') ||
              note.content.includes('- [X]') ||
              note.content.includes('* [ ]') ||
              note.content.includes('* [x]') ||
              note.content.includes('* [X]')
            ) {
              results.push({ path: notePath, content: note.content });
            }
          } catch {
            // skip unreadable notes
          }
        })
      );

      res.json(results);
    } catch (err: any) {
      api.log.error('Checklist /notes error', err);
      res.status(500).json({ error: err.message ?? 'Failed to list notes' });
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
