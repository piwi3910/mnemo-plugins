import type { PluginAPI } from '../../../types/server';

interface ReadingItem {
  id: string;
  url: string;
  title: string;
  notes: string;
  read: boolean;
  createdAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function storageKey(userId: string): string {
  return `reading-list:items:${userId}`;
}

async function getItems(api: PluginAPI, userId: string): Promise<ReadingItem[]> {
  const stored = await api.storage.get(storageKey(userId), userId);
  if (!Array.isArray(stored)) return [];
  return stored as ReadingItem[];
}

async function saveItems(api: PluginAPI, userId: string, items: ReadingItem[]): Promise<void> {
  await api.storage.set(storageKey(userId), items, userId);
}

export function activate(api: PluginAPI): void {
  api.log.info('Reading List plugin activated');

  // GET /items — list all reading items for the current user
  api.routes.register('get', '/items', async (req, res) => {
    try {
      const userId: string = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const items = await getItems(api, userId);
      res.json({ items });
    } catch (err: any) {
      api.log.error('Reading List GET /items error', err);
      res.status(500).json({ error: 'Failed to fetch reading list' });
    }
  });

  // POST /items — add a new item
  api.routes.register('post', '/items', async (req, res) => {
    try {
      const userId: string = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { url, title, notes } = req.body as {
        url?: string;
        title?: string;
        notes?: string;
      };

      if (!url || typeof url !== 'string' || !url.trim()) {
        res.status(400).json({ error: 'url (string) is required' });
        return;
      }

      const items = await getItems(api, userId);
      const newItem: ReadingItem = {
        id: generateId(),
        url: url.trim(),
        title: (title ?? '').trim() || url.trim(),
        notes: (notes ?? '').trim(),
        read: false,
        createdAt: new Date().toISOString(),
      };

      items.unshift(newItem);
      await saveItems(api, userId, items);
      res.status(201).json({ item: newItem });
    } catch (err: any) {
      api.log.error('Reading List POST /items error', err);
      res.status(500).json({ error: 'Failed to add item' });
    }
  });

  // PUT /items/:id — update an item
  api.routes.register('put', '/items/:id', async (req, res) => {
    try {
      const userId: string = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params as { id: string };
      const items = await getItems(api, userId);
      const idx = items.findIndex((item) => item.id === id);

      if (idx === -1) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      const updates = req.body as Partial<ReadingItem>;
      const updated: ReadingItem = {
        ...items[idx],
        ...(updates.title !== undefined ? { title: String(updates.title) } : {}),
        ...(updates.notes !== undefined ? { notes: String(updates.notes) } : {}),
        ...(updates.read !== undefined ? { read: Boolean(updates.read) } : {}),
        ...(updates.url !== undefined ? { url: String(updates.url) } : {}),
      };

      items[idx] = updated;
      await saveItems(api, userId, items);
      res.json({ item: updated });
    } catch (err: any) {
      api.log.error('Reading List PUT /items/:id error', err);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // DELETE /items/:id — remove an item
  api.routes.register('delete', '/items/:id', async (req, res) => {
    try {
      const userId: string = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params as { id: string };
      const items = await getItems(api, userId);
      const filtered = items.filter((item) => item.id !== id);

      if (filtered.length === items.length) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      await saveItems(api, userId, filtered);
      res.json({ success: true });
    } catch (err: any) {
      api.log.error('Reading List DELETE /items/:id error', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
