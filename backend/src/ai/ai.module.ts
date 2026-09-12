import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai.types';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

@Module({
  providers: [
    OpenAICompatibleProvider,
    {
      provide: AI_PROVIDER,
      useExisting: OpenAICompatibleProvider,
    },
  ],
  exports: [AI_PROVIDER, OpenAICompatibleProvider],
})
export class AiModule {}
