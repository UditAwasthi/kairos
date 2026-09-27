import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementService } from './entitlement.service';
import { RevenueCatWebhookController } from './revenuecat-webhook.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RevenueCatWebhookController],
  providers: [EntitlementService],
  exports: [EntitlementService],
})
export class EntitlementsModule {}
