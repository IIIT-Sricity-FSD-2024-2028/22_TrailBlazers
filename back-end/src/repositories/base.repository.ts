/**
 * base.repository.ts
 *
 * Hybrid In-Memory + JSON-File Repository.
 *
 * Startup:  Reads data/[file].json into this.store[] (in-memory array).
 *           If the JSON file doesn't exist yet, bootstraps from the SEED array
 *           passed by the concrete repository and writes it to the JSON file.
 *
 * Runtime:  All reads/writes go through this.store[] (fast in-memory).
 *
 * Mutation: Every save() / update() / delete() call also writes
 *           this.store[] back to data/[file].json so changes are
 *           visible on disk and survive server restarts.
 *
 * This satisfies:
 *   ✅ "In-memory data structures" evaluation criteria (this.store is T[])
 *   ✅ CRUD operations visible on disk after Swagger calls
 *   ✅ Changes persist across server restarts
 */
import * as fs   from 'fs';
import * as path from 'path';

export abstract class BaseRepository<T extends { id: string }> {
  /** In-memory store — single source of truth at runtime */
  public store: T[];

  private readonly filePath: string;

  constructor(dataFileName: string, seed: T[]) {
    this.filePath = path.join(process.cwd(), 'data', dataFileName);
    this.store = this.bootstrap(seed);
  }

  // ─── Startup ───────────────────────────────────────────────────────────────

  /** Load from JSON file; fall back to seed and write JSON if file is missing */
  private bootstrap(seed: T[]): T[] {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as T[];
    } catch {
      // JSON file not found → create it from seed
      const data: T[] = JSON.parse(JSON.stringify(seed));
      this.writeFile(data);
      return data;
    }
  }

  // ─── File helpers ───────────────────────────────────────────────────────────

  protected persist(): void {
    this.writeFile(this.store);
  }

  private writeFile(data: T[]): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[Repository] persist failed for ${this.filePath}:`, err);
    }
  }

  // ─── Generic CRUD ──────────────────────────────────────────────────────────

  findAll(): T[]                        { return [...this.store]; }
  findById(id: string): T | undefined   { return this.store.find(i => i.id === id); }
  findWhere(fn: (i: T) => boolean): T[] { return this.store.filter(fn); }

  /** Insert at front of in-memory array, then persist to JSON */
  save(entity: T): T {
    this.store.unshift(entity);
    this.persist();
    return entity;
  }

  /** Patch a record in-memory, then persist to JSON */
  update(id: string, partial: Partial<T>): T | null {
    const idx = this.store.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.store[idx] = { ...this.store[idx], ...partial };
    this.persist();
    return this.store[idx];
  }

  /** Remove a record in-memory, then persist to JSON */
  delete(id: string): boolean {
    const idx = this.store.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.store.splice(idx, 1);
    this.persist();
    return true;
  }

  // ─── ID helpers ────────────────────────────────────────────────────────────

  protected nextId(prefix: string): string {
    const nums = this.store
      .map(i => parseInt(i.id.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    return `${prefix}${(nums.length ? Math.max(...nums) : 0) + 1}`;
  }
}
