import { Injectable } from '@nestjs/common';
import {
  EntitlementFeature,
  EntitlementStatus,
  type Entitlement,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isEntitlementStatusAllowed,
  type EntitlementView,
} from './entitlement.types';
import {
  readStubDefaultStatus,
  readStubGrantAll,
  StubEntitlementProvider,
} from './stub-entitlement.provider';

@Injectable()
export class EntitlementService {
  private readonly provider = new StubEntitlementProvider();

  constructor(private readonly prisma: PrismaService) {}

  async isAllowed(
    userId: string,
    feature: EntitlementFeature = EntitlementFeature.RECALL,
  ): Promise<boolean> {
    const view = await this.getEntitlement(userId, feature);
    return view.allowed;
  }

  async getEntitlement(
    userId: string,
    feature: EntitlementFeature = EntitlementFeature.RECALL,
  ): Promise<EntitlementView> {
    if (!isRecallFeatureEnabled()) {
      return {
        feature: 'RECALL',
        status: EntitlementStatus.inactive,
        allowed: false,
        validUntil: null,
        source: 'disabled',
      };
    }

    if (readStubGrantAll()) {
      return {
        feature: 'RECALL',
        status: EntitlementStatus.active,
        allowed: true,
        validUntil: null,
        source: 'stub_grant_all',
      };
    }

    const remote = await this.provider.resolveRemote?.(userId, feature);
    if (remote) {
      await this.prisma.entitlement.upsert({
        where: { userId_feature: { userId, feature } },
        create: {
          userId,
          feature,
          status: remote.status,
          validUntil: remote.validUntil,
          source: remote.source,
        },
        update: {
          status: remote.status,
          validUntil: remote.validUntil,
          source: remote.source,
        },
      });
    }

    const row = await this.prisma.entitlement.findUnique({
      where: { userId_feature: { userId, feature } },
    });

    if (row) {
      return toView(row);
    }

    const stubDefault = readStubDefaultStatus();
    if (stubDefault) {
      return {
        feature: 'RECALL',
        status: stubDefault,
        allowed: isEntitlementStatusAllowed(stubDefault, null),
        validUntil: null,
        source: 'stub_default',
      };
    }

    return {
      feature: 'RECALL',
      status: EntitlementStatus.inactive,
      allowed: false,
      validUntil: null,
      source: 'none',
    };
  }

  /** Test/admin helper — upserts a DB entitlement row. */
  async upsertForUser(params: {
    userId: string;
    feature?: EntitlementFeature;
    status: EntitlementStatus;
    validUntil?: Date | null;
    source?: string;
  }): Promise<Entitlement> {
    const feature = params.feature ?? EntitlementFeature.RECALL;
    return this.prisma.entitlement.upsert({
      where: { userId_feature: { userId: params.userId, feature } },
      create: {
        userId: params.userId,
        feature,
        status: params.status,
        validUntil: params.validUntil ?? null,
        source: params.source ?? 'admin',
      },
      update: {
        status: params.status,
        validUntil: params.validUntil ?? null,
        source: params.source ?? 'admin',
      },
    });
  }
}

function toView(row: Entitlement): EntitlementView {
  const allowed = isEntitlementStatusAllowed(row.status, row.validUntil);
  return {
    feature: 'RECALL',
    status: allowed ? row.status : EntitlementStatus.expired,
    allowed,
    validUntil: row.validUntil ? row.validUntil.toISOString() : null,
    source: row.source,
  };
}

export function isRecallFeatureEnabled(): boolean {
  const raw = (process.env.RECALL_ENABLED ?? 'true').trim().toLowerCase();
  return raw !== '0' && raw !== 'false' && raw !== 'no';
}
