// Client-side Plugin API types
// These types are available to client plugins via: import type { ClientPluginAPI } from '../../../types/client';

export interface ClientPluginAPI {
  ui: {
    registerSidebarPanel(component: any, options: { id: string; title: string; icon: string; order?: number }): void;
    registerStatusBarItem(component: any, options: { id: string; position: "left" | "right"; order?: number }): void;
    registerEditorToolbarButton(component: any, options: { id: string; order?: number }): void;
    registerSettingsSection(component: any, options: { id: string; title: string }): void;
    registerPage(component: any, options: { id: string; path: string; title: string; icon: string; showInSidebar?: boolean }): void;
    registerNoteAction(options: { id: string; label: string; icon: string; onClick: (notePath: string) => void }): void;
  };
  editor: {
    registerExtension(extension: any): void;
  };
  markdown: {
    registerCodeFenceRenderer(language: string, component: any): void;
    registerPostProcessor(fn: (html: string) => string): void;
  };
  commands: {
    register(command: { id: string; name: string; shortcut?: string; execute: () => void }): void;
  };
  context: {
    useCurrentUser(): { id: string; name: string; email: string } | null;
    useCurrentNote(): { path: string; content: string } | null;
    useTheme(): "light" | "dark";
    usePluginSettings(key: string): unknown;
  };
  api: {
    fetch(path: string, options?: RequestInit): Promise<Response>;
  };
  notify: {
    info(message: string): void;
    success(message: string): void;
    error(message: string): void;
  };
}

// Host dependencies available via window.__krytonPluginDeps
export interface KrytonPluginDeps {
  React: typeof import("react");
  vim: () => any;
  getCM: (view: any) => any;
}

declare global {
  interface Window {
    __krytonPluginDeps: KrytonPluginDeps;
  }
}

