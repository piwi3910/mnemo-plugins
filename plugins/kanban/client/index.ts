import type { ClientPluginAPI } from '../../../types/client';

const { React } = window.__mnemoPluginDeps;
const { createElement: h } = React;

interface KanbanCard {
  text: string;
}

interface KanbanColumn {
  title: string;
  cards: KanbanCard[];
}

// Parse the kanban format:
//   ## Column Title
//   - Card text
//   - Another card
function parseKanban(content: string): KanbanColumn[] {
  const columns: KanbanColumn[] = [];
  let current: KanbanColumn | null = null;

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd();
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      current = { title: headingMatch[1].trim(), cards: [] };
      columns.push(current);
      continue;
    }
    const cardMatch = line.match(/^[-*]\s+(.+)$/);
    if (cardMatch && current) {
      current.cards.push({ text: cardMatch[1].trim() });
    }
  }

  return columns;
}

// A fixed palette of column header accent colours (cycles if > 5 columns)
const COLUMN_COLORS = [
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#16a34a', // green
  '#d97706', // amber
  '#db2777', // pink
];

function KanbanRenderer({ content }: { content: string; notePath: string }): any {
  const columns = parseKanban(content);

  if (columns.length === 0) {
    return h('div', {
      style: {
        border: '1px solid #4f4f6a',
        borderRadius: '8px',
        padding: '16px',
        color: '#9ca3af',
        fontSize: '13px',
        textAlign: 'center',
        background: '#1e1e2e',
      },
    }, 'No columns found. Use ## Heading to define columns and - Item for cards.');
  }

  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'row',
      gap: '12px',
      padding: '12px',
      background: '#1a1a2e',
      borderRadius: '8px',
      border: '1px solid #4f4f6a',
      overflowX: 'auto',
      alignItems: 'flex-start',
    },
  },
    columns.map((col, colIdx) => {
      const color = COLUMN_COLORS[colIdx % COLUMN_COLORS.length];
      return h('div', {
        key: `col-${colIdx}`,
        style: {
          minWidth: '180px',
          maxWidth: '240px',
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        },
      },
        // Column header
        h('div', {
          style: {
            padding: '6px 10px',
            borderRadius: '6px',
            background: `${color}22`,
            borderLeft: `3px solid ${color}`,
            fontWeight: '600',
            fontSize: '13px',
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
          h('span', null, col.title),
          h('span', {
            style: {
              fontSize: '11px',
              background: `${color}33`,
              color,
              padding: '1px 6px',
              borderRadius: '10px',
            },
          }, String(col.cards.length))
        ),

        // Cards
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          },
        },
          col.cards.length === 0
            ? h('div', {
                style: {
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px dashed #4f4f6a',
                  color: '#6b7280',
                  fontSize: '12px',
                  textAlign: 'center',
                },
              }, 'No cards')
            : col.cards.map((card, cardIdx) =>
                h('div', {
                  key: `card-${cardIdx}`,
                  style: {
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#252535',
                    border: '1px solid #3a3a5a',
                    fontSize: '13px',
                    color: '#e0e0e0',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                  },
                }, card.text)
              )
        )
      );
    })
  );
}

export function activate(api: ClientPluginAPI): void {
  api.markdown.registerCodeFenceRenderer('kanban', KanbanRenderer);
}

export function deactivate(): void {
  // Cleanup is handled by the plugin system
}
