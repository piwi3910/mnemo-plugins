import type { ClientPluginAPI } from '../../../types/client';

const { React } = window.__mnemoPluginDeps;
const { createElement: h, useState, useCallback } = React;

interface ExcalidrawElement {
  type?: string;
  [key: string]: unknown;
}

interface ExcalidrawScene {
  elements?: ExcalidrawElement[];
  [key: string]: unknown;
}

function ExcalidrawRenderer({ content }: { content: string; notePath: string }): any {
  const [copied, setCopied] = useState(false);

  let scene: ExcalidrawScene = {};
  let parseError: string | null = null;
  let elementCount = 0;

  try {
    scene = JSON.parse(content) as ExcalidrawScene;
    elementCount = Array.isArray(scene.elements) ? scene.elements.length : 0;
  } catch (err: any) {
    parseError = err?.message || 'Invalid JSON';
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [content]);

  if (parseError) {
    return h('div', {
      style: {
        border: '1px solid #ef4444',
        borderRadius: '8px',
        padding: '16px',
        background: 'rgba(239,68,68,0.1)',
        color: '#ef4444',
        fontSize: '13px',
      },
    },
      h('strong', null, 'Excalidraw: invalid JSON'),
      h('pre', {
        style: { marginTop: '8px', fontSize: '11px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' },
      }, parseError)
    );
  }

  // Summarize element types
  const typeCounts: Record<string, number> = {};
  if (Array.isArray(scene.elements)) {
    for (const el of scene.elements) {
      const t = (el.type as string) || 'unknown';
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
  }
  const typesSummary = Object.entries(typeCounts)
    .map(([t, c]) => `${c} ${t}${c !== 1 ? 's' : ''}`)
    .join(', ');

  return h('div', {
    style: {
      border: '2px solid #4f4f6a',
      borderRadius: '8px',
      padding: '20px',
      background: '#1e1e2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      minHeight: '100px',
    },
  },
    // Icon + title row
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#a78bfa',
      },
    },
      h('svg', {
        width: '20', height: '20', viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        h('path', { d: 'M12 20h9' }),
        h('path', { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' })
      ),
      h('span', { style: { fontWeight: '600', fontSize: '14px' } }, 'Excalidraw diagram')
    ),

    // Element count
    h('div', {
      style: { textAlign: 'center', color: '#9ca3af', fontSize: '13px' },
    },
      elementCount === 0
        ? 'Empty diagram'
        : `${elementCount} element${elementCount !== 1 ? 's' : ''}${typesSummary ? ` — ${typesSummary}` : ''}`
    ),

    // Copy button
    h('button', {
      onClick: handleCopy,
      style: {
        padding: '6px 16px',
        fontSize: '12px',
        borderRadius: '6px',
        border: '1px solid #4f4f6a',
        background: copied ? '#22c55e22' : '#2a2a3e',
        color: copied ? '#22c55e' : '#a78bfa',
        cursor: 'pointer',
        transition: 'all 0.15s',
      },
    }, copied ? 'Copied!' : 'Copy to Excalidraw')
  );
}

export function activate(api: ClientPluginAPI): void {
  api.markdown.registerCodeFenceRenderer('excalidraw', ExcalidrawRenderer);
}

export function deactivate(): void {
  // Cleanup is handled by the plugin system
}
