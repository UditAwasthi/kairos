import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { ObservationProcessor } from './observation.processor';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

@Module({
  imports: [AuthModule, UsersModule, StorageModule, AiModule, EmbeddingsModule],
  controllers: [ObservationsController],
  providers: [ObservationsService, ObservationProcessor],
  exports: [ObservationsService, ObservationProcessor],
})
export class ObservationsModule {}
