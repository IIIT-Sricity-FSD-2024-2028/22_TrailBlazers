import { Module } from '@nestjs/common';
import { DataSeederService } from './data-seeder.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  providers: [DataSeederService],
  exports: [DataSeederService],
})
export class SeedModule {}
