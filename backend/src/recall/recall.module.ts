import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { ObservationsModule } from '../observations/observations.module';
import { UsersModule } from '../users/users.module';
import { RecallController } from './recall.controller';
import { RecallService } from './recall.service';

@Module({
  imports: [AuthModule, UsersModule, EntitlementsModule, ObservationsModule],
  controllers: [RecallController],
  providers: [RecallService],
  exports: [RecallService],
})
export class RecallModule {}
