import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InMemoryStore {
  private readonly logger = new Logger(InMemoryStore.name);
  private readonly store: Map<string, Map<string, any>> = new Map();
  private readonly dataDir: string;
  private readonly filePath: string;
  private readonly tempFilePath: string;
  private isLoadedFromDisk: boolean = false;

  constructor() {
    // Persistent store directory: <project_root>/backend/data/store-data.json
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'store-data.json');
    this.tempFilePath = path.join(this.dataDir, 'store-data.json.tmp');

    this.initCollections();
    this.tryLoadFromDisk();
  }

  private initCollections(): void {
    const defaultCollections = [
      'users',
      'organizations',
      'events',
      'event_requests',
      'tickets',
      'payments',
      'revenue_inquiries',
      'event_invitations',
      'quotations',
      'quotation_versions',
      'quotation_line_items',
      'quotation_change_requests',
      'quotation_audit_logs',
      'event_operations_audit_logs',
      'event_qa_questions',
      'event_qa_upvotes',
      'event_operational_issues',
      'event_sessions',
      'event_polls',
      'event_poll_options',
      'event_poll_responses',
      'event_feedback',
      'feedback_polls',
      'feedback_questions',
      'feedback_responses',
      'feedback_answers',
      'notifications',
      'event_change_requests',
      'analytics_audit_logs',
      'file_uploads',
    ];

    for (const name of defaultCollections) {
      this.initCollection(name);
    }
  }

  private initCollection(collectionName: string): void {
    if (!this.store.has(collectionName)) {
      this.store.set(collectionName, new Map<string, any>());
    }
  }

  public isLoaded(): boolean {
    return this.isLoadedFromDisk;
  }

  private tryLoadFromDisk(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.logger.log('No existing persistent store-data.json found. Starting fresh.');
        this.isLoadedFromDisk = false;
        return;
      }

      const raw = fs.readFileSync(this.filePath, 'utf-8');
      if (!raw || !raw.trim()) {
        this.logger.warn('Persistent store-data.json is empty. Will seed initial data.');
        this.isLoadedFromDisk = false;
        return;
      }

      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        this.logger.warn('Invalid store-data.json format. Will seed initial data.');
        this.isLoadedFromDisk = false;
        return;
      }

      let entityCount = 0;
      let colCount = 0;

      for (const colName of Object.keys(parsed)) {
        this.initCollection(colName);
        const colMap = this.store.get(colName)!;
        const itemsObj = parsed[colName] || {};

        if (typeof itemsObj === 'object' && itemsObj !== null) {
          for (const id of Object.keys(itemsObj)) {
            colMap.set(id, itemsObj[id]);
            entityCount++;
          }
          colCount++;
        }
      }

      if (entityCount > 0) {
        this.isLoadedFromDisk = true;
        this.logger.log(
          `Successfully loaded persistent data from disk (${entityCount} entities across ${colCount} collections).`,
        );
      } else {
        this.isLoadedFromDisk = false;
      }
    } catch (err: any) {
      this.logger.error(`Error loading store-data.json from disk: ${err.message}. Starting with fresh seed data.`);
      this.isLoadedFromDisk = false;
    }
  }

  public saveToDisk(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const serialized: Record<string, Record<string, any>> = {};

      for (const [colName, colMap] of this.store.entries()) {
        serialized[colName] = {};
        for (const [id, item] of colMap.entries()) {
          serialized[colName][id] = item;
        }
      }

      const jsonString = JSON.stringify(serialized, null, 2);
      fs.writeFileSync(this.tempFilePath, jsonString, 'utf-8');
      fs.renameSync(this.tempFilePath, this.filePath);
    } catch (err: any) {
      this.logger.error(`Failed to persist store data to disk: ${err.message}`);
    }
  }

  getCollection<T = any>(collectionName: string): Map<string, T> {
    this.initCollection(collectionName);
    return this.store.get(collectionName)!;
  }

  create<T extends { id: string }>(collectionName: string, item: T): T {
    if (!item || !item.id) {
      throw new Error(`Cannot create item in ${collectionName}: missing 'id' property.`);
    }
    const col = this.getCollection<T>(collectionName);
    col.set(item.id, { ...item });
    this.saveToDisk();
    return { ...col.get(item.id)! };
  }

  findAll<T = any>(collectionName: string): T[] {
    const col = this.getCollection<T>(collectionName);
    return Array.from(col.values()).map((item) => ({ ...item }));
  }

  findById<T = any>(collectionName: string, id: string): T | null {
    if (!id) return null;
    const col = this.getCollection<T>(collectionName);
    const found = col.get(id);
    return found ? { ...found } : null;
  }

  find<T = any>(collectionName: string, predicate: (item: T) => boolean): T[] {
    const col = this.getCollection<T>(collectionName);
    const results: T[] = [];
    for (const item of col.values()) {
      if (predicate(item)) {
        results.push({ ...item });
      }
    }
    return results;
  }

  findOne<T = any>(collectionName: string, predicate: (item: T) => boolean): T | null {
    const col = this.getCollection<T>(collectionName);
    for (const item of col.values()) {
      if (predicate(item)) {
        return { ...item };
      }
    }
    return null;
  }

  update<T extends { id: string }>(collectionName: string, id: string, patch: Partial<T>): T | null {
    const col = this.getCollection<T>(collectionName);
    const existing = col.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...patch,
      id,
      updatedAt: (patch as any).updatedAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    col.set(id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  delete(collectionName: string, id: string): boolean {
    const col = this.getCollection(collectionName);
    const result = col.delete(id);
    if (result) {
      this.saveToDisk();
    }
    return result;
  }

  deleteWhere<T = any>(collectionName: string, predicate: (item: T) => boolean): number {
    const col = this.getCollection<T>(collectionName);
    let deletedCount = 0;
    for (const [id, item] of col.entries()) {
      if (predicate(item)) {
        col.delete(id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.saveToDisk();
    }
    return deletedCount;
  }

  count<T = any>(collectionName: string, predicate?: (item: T) => boolean): number {
    const col = this.getCollection<T>(collectionName);
    if (!predicate) return col.size;

    let cnt = 0;
    for (const item of col.values()) {
      if (predicate(item)) cnt++;
    }
    return cnt;
  }

  clear(collectionName?: string): void {
    if (collectionName) {
      if (this.store.has(collectionName)) {
        this.store.get(collectionName)!.clear();
      }
    } else {
      for (const col of this.store.values()) {
        col.clear();
      }
    }
    this.saveToDisk();
  }
}
