import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementService } from './entitlement.service';

@Module({
  imports: [PrismaModule],
  providers: [EntitlementService],
  exports: [EntitlementService],
})
export class EntitlementsModule {}
