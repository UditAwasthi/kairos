import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { AskController } from './ask.controller';
import { AskService } from './ask.service';
import { RagContextBuilder } from './rag-context.builder';

@Module({
  imports: [AuthModule, SearchModule, AiModule],
  controllers: [AskController],
  providers: [AskService, RagContextBuilder],
  exports: [AskService],
})
export class AskModule {}
