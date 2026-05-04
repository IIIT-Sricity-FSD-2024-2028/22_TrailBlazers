import { Module } from '@nestjs/common';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';

@Module({
  controllers: [QnaController],
  providers: [QnaService],
})
export class QnaModule {}
