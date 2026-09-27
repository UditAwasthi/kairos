import {
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Post,
  Body,
} from '@nestjs/common';
import { EntitlementFeature, EntitlementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RevenueCatEvent = {
  app_user_id?: unknown;
  type?: unknown;
  entitlement_ids?: unknown;
  expiration_at_ms?: unknown;
};

const GRANTING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'BILLING_ISSUE',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'REFUND_REVERSED',
]);
const REVOKING_EVENTS = new Set([
  'EXPIRATION',
  'SUBSCRIPTION_PAUSED',
  'REFUND',
]);

@Controller('webhooks/revenuecat')
export class RevenueCatWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(200)
  async receive(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { event?: RevenueCatEvent },
  ) {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION;
    if (!expected || authorization !== expected) throw new ForbiddenException();

    const event = body?.event;
    if (
      !event ||
      typeof event.app_user_id !== 'string' ||
      typeof event.type !== 'string' ||
      !Array.isArray(event.entitlement_ids) ||
      !event.entitlement_ids.includes('recall')
    )
      return { received: true, updated: false };

    if (
      !GRANTING_EVENTS.has(event.type) &&
      !REVOKING_EVENTS.has(event.type) &&
      event.type !== 'CANCELLATION'
    )
      return { received: true, updated: false };

    const user = await this.prisma.user.findUnique({
      where: { clerkUserId: event.app_user_id },
      select: { id: true },
    });
    if (!user) return { received: true, updated: false };

    const expiration =
      typeof event.expiration_at_ms === 'number'
        ? new Date(event.expiration_at_ms)
        : null;
    const canGrant =
      GRANTING_EVENTS.has(event.type) || event.type === 'CANCELLATION';
    const active =
      canGrant && (!expiration || expiration.getTime() > Date.now());
    const status = active
      ? event.type === 'BILLING_ISSUE'
        ? EntitlementStatus.grace
        : EntitlementStatus.active
      : EntitlementStatus.inactive;

    await this.prisma.entitlement.upsert({
      where: {
        userId_feature: { userId: user.id, feature: EntitlementFeature.RECALL },
      },
      create: {
        userId: user.id,
        feature: EntitlementFeature.RECALL,
        status,
        validUntil: expiration,
        source: 'revenuecat',
      },
      update: { status, validUntil: expiration, source: 'revenuecat' },
    });
    return { received: true, updated: true };
  }
}
