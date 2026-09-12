import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { ObservationProcessor } from './observation.processor';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

@Module({
  imports: [AuthModule, UsersModule, StorageModule],
  controllers: [ObservationsController],
  providers: [ObservationsService, ObservationProcessor],
  exports: [ObservationsService, ObservationProcessor],
})
export class ObservationsModule {}
