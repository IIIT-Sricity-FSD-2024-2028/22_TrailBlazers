import { Global, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';

@Global()
@Module({
  controllers: [UsersController],
  providers:   [UsersRepository, UsersService],
  exports:     [UsersService, UsersRepository],
})
export class UsersModule {}
