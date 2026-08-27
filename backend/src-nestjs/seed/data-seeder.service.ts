import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InMemoryStore } from '../repositories/in-memory.store';
import { INITIAL_SEED_DATA } from './seed-data/initial-seed.data';

@Injectable()
export class DataSeederService implements OnModuleInit {
  private readonly logger = new Logger(DataSeederService.name);

  constructor(private readonly store: InMemoryStore) {}

  onModuleInit() {
    this.seedAllCollections();
  }

  seedAllCollections() {
    if (this.store.isLoaded()) {
      this.logger.log(
        'Persistent data loaded from store-data.json. Skipping initial data seeding to preserve runtime state.',
      );
      return;
    }

    this.logger.log('Initializing Data Store with seed data...');

    let totalSeeded = 0;
    const collections = Object.keys(INITIAL_SEED_DATA);

    for (const colName of collections) {
      const rows = INITIAL_SEED_DATA[colName];
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          const item = { ...row };
          if (!item.id) {
            item.id =
              item.key ||
              item.name ||
              `${colName}_${Math.random().toString(36).substring(2, 9)}`;
          }
          this.store.create(colName, item);
          totalSeeded++;
        }
      }
    }

    this.store.saveToDisk();

    this.logger.log(
      `Data Store initialized successfully with ${totalSeeded} entities across ${collections.length} collections and persisted to disk.`,
    );
  }
}

// Retain alias export for backwards compatibility
export { DataSeederService as InMemorySeedService };
