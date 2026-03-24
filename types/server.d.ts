// Server-side Plugin API types
// These types are available to server plugins via: import type { PluginAPI } from '../../../types/server';

export type PluginEvent =
  | "note:beforeSave" | "note:afterSave"
  | "note:beforeDelete" | "note:afterDelete"
  | "note:open" | "search:query"
  | "user:login" | "user:logout";

export type PluginEventHandler = (...args: any[]) => void | Promise<void>;
export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export interface Note {
  path: string;
  content: string;
  title: string;
  modifiedAt: Date;
}

export interface NoteEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: NoteEntry[];
}

export interface StorageEntry {
  key: string;
  value: unknown;
  userId: string | null;
}

export interface IndexFields {
  title: string;
  content: string;
  tags?: string[];
}

export interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export interface PluginAPI {
  notes: {
    get(userId: string, path: string): Promise<Note>;
    list(userId: string, folder?: string): Promise<NoteEntry[]>;
    create(userId: string, path: string, content: string): Promise<void>;
    update(userId: string, path: string, content: string): Promise<void>;
    delete(userId: string, path: string): Promise<void>;
  };
  events: {
    on(event: PluginEvent, handler: PluginEventHandler): void;
    off(event: PluginEvent, handler: PluginEventHandler): void;
  };
  routes: {
    register(method: HttpMethod, path: string, handler: (req: any, res: any, next?: any) => void): void;
  };
  storage: {
    get(key: string, userId?: string): Promise<unknown>;
    set(key: string, value: unknown, userId?: string): Promise<void>;
    delete(key: string, userId?: string): Promise<void>;
    list(prefix?: string, userId?: string): Promise<StorageEntry[]>;
  };
  database: {
    registerEntity(entity: any): void;
    getRepository(entity: any): any;
  };
  settings: {
    get(key: string, userId?: string): Promise<unknown>;
  };
  search: {
    index(userId: string, path: string, fields: IndexFields): Promise<void>;
    query(userId: string, query: string): Promise<SearchResult[]>;
  };
  log: {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  };
  plugin: {
    id: string;
    version: string;
    dataDir: string;
  };
}
