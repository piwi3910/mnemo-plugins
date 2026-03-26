import type { PluginAPI } from '../../../types/server';

interface Flashcard {
  question: string;
  answer: string;
}

// Extract flashcards in "Q: ... / A: ..." format
function extractQAFormat(content: string): Flashcard[] {
  const cards: Flashcard[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const qMatch = lines[i].match(/^Q:\s*(.+)$/i);
    if (qMatch) {
      // Look ahead for an A: line (allow one blank line between)
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const aMatch = lines[j].match(/^A:\s*(.+)$/i);
        if (aMatch) {
          cards.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
          i = j; // skip ahead past the answer line
          break;
        }
      }
    }
  }

  return cards;
}

// Extract flashcards in "**question**" followed by answer paragraph format
function extractBoldFormat(content: string): Flashcard[] {
  const cards: Flashcard[] = [];
  // Match **question** on its own line (or start of line), followed by non-empty content
  const boldPattern = /^\*\*(.+?)\*\*\s*$/gm;
  const paragraphs = content.split(/\n{2,}/);

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi].trim();
    boldPattern.lastIndex = 0;
    const m = boldPattern.exec(para);
    if (m && m[0] === para) {
      // The entire paragraph is just **question** — look for the next non-empty paragraph
      for (let pj = pi + 1; pj < paragraphs.length; pj++) {
        const answerPara = paragraphs[pj].trim();
        if (answerPara) {
          cards.push({ question: m[1].trim(), answer: answerPara });
          break;
        }
      }
    }
  }

  return cards;
}

export function activate(api: PluginAPI): void {
  api.log.info('Flashcards plugin activated');

  // GET /cards?path=... — extract flashcard pairs from a note
  api.routes.register('get', '/cards', async (req, res) => {
    const userId: string = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notePath = req.query?.path as string;
    if (!notePath) {
      res.status(400).json({ error: 'Missing path parameter' });
      return;
    }

    try {
      const note = await api.notes.get(userId, notePath);
      const qaCards = extractQAFormat(note.content);
      const boldCards = extractBoldFormat(note.content);

      // Merge and deduplicate by question text
      const seen = new Set<string>();
      const cards: Flashcard[] = [];
      for (const card of [...qaCards, ...boldCards]) {
        if (!seen.has(card.question)) {
          seen.add(card.question);
          cards.push(card);
        }
      }

      res.json({ cards });
    } catch (err: any) {
      api.log.error('Flashcards GET /cards error', err);
      res.status(500).json({ error: err?.message ?? 'Failed to extract cards' });
    }
  });
}

export function deactivate(): void {
  // Nothing to clean up
}
