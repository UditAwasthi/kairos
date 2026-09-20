import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { EntitlementFeature, Prisma } from '@prisma/client';
import { EntitlementService } from '../entitlements/entitlement.service';
import { entitlementForbidden } from '../entitlements/entitlement.types';
import { ObservationsService } from '../observations/observations.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  FINGERPRINT_DEDUPE_WINDOW_MS,
  RecallRateLimiter,
} from './recall-rate-limiter';
import {
  MAX_REQUEST_BODY_CHARS,
  validateRecallBatch,
  type ValidatedRecallEvent,
} from './recall.validation';

export type RecallEventResultStatus = 'accepted' | 'deduped' | 'rejected';

export type RecallEventResult = {
  clientEventId: string;
  status: RecallEventResultStatus;
  observationId: string | null;
  deduped: boolean;
  reason?: string;
};

@Injectable()
export class RecallService {
  private readonly rateLimiter = new RecallRateLimiter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly entitlements: EntitlementService,
    private readonly observations: ObservationsService,
  ) {}

  async getEntitlementForClerkUser(clerkUserId: string) {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    return this.entitlements.getEntitlement(user.id, EntitlementFeature.RECALL);
  }

  async ingestEventsForClerkUser(
    clerkUserId: string,
    body: unknown,
  ): Promise<{ results: RecallEventResult[] }> {
    const approx =
      typeof body === 'string'
        ? body.length
        : JSON.stringify(body ?? {}).length;
    if (approx > MAX_REQUEST_BODY_CHARS) {
      throw new PayloadTooLargeException({
        error: {
          code: 'EVENT_TOO_LARGE',
          message: 'Recall request body exceeds size limit.',
        },
      });
    }

    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const allowed = await this.entitlements.isAllowed(
      user.id,
      EntitlementFeature.RECALL,
    );
    if (!allowed) {
      throw entitlementForbidden();
    }

    const validated = validateRecallBatch(body ?? {});
    if (validated.rejectedBatch) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_RECALL_BATCH',
          message: validated.rejectedBatch,
        },
      });
    }

    const results: RecallEventResult[] = [];
    const toAccept: ValidatedRecallEvent[] = [];

    for (const item of validated.events) {
      if (!item.ok) {
        results.push({
          clientEventId: item.clientEventId ?? 'unknown',
          status: 'rejected',
          observationId: null,
          deduped: false,
          reason: item.reason,
        });
        continue;
      }

      const existing = await this.prisma.recallEventReceipt.findUnique({
        where: {
          userId_clientEventId: {
            userId: user.id,
            clientEventId: item.event.clientEventId,
          },
        },
      });
      if (existing) {
        results.push({
          clientEventId: item.event.clientEventId,
          status: 'deduped',
          observationId: existing.observationId,
          deduped: true,
        });
        continue;
      }

      const fingerprintHit = await this.prisma.recallEventReceipt.findFirst({
        where: {
          userId: user.id,
          fingerprint: item.event.fingerprint,
          createdAt: {
            gte: new Date(Date.now() - FINGERPRINT_DEDUPE_WINDOW_MS),
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (fingerprintHit) {
        // Soft dedupe: record receipt pointing at existing observation without new obs.
        try {
          await this.prisma.recallEventReceipt.create({
            data: {
              userId: user.id,
              clientEventId: item.event.clientEventId,
              fingerprint: item.event.fingerprint,
              observationId: fingerprintHit.observationId,
            },
          });
        } catch (error) {
          if (isUniqueViolation(error)) {
            const again = await this.prisma.recallEventReceipt.findUnique({
              where: {
                userId_clientEventId: {
                  userId: user.id,
                  clientEventId: item.event.clientEventId,
                },
              },
            });
            results.push({
              clientEventId: item.event.clientEventId,
              status: 'deduped',
              observationId: again?.observationId ?? null,
              deduped: true,
            });
            continue;
          }
          throw error;
        }
        results.push({
          clientEventId: item.event.clientEventId,
          status: 'deduped',
          observationId: fingerprintHit.observationId,
          deduped: true,
        });
        continue;
      }

      toAccept.push(item.event);
    }

    if (toAccept.length > 0) {
      const allowed = this.rateLimiter.tryConsumeUpTo(user.id, toAccept.length);
      if (allowed <= 0) {
        throw new HttpException(
          {
            error: {
              code: 'RECALL_RATE_LIMITED',
              message: 'Recall event rate limit exceeded. Try again later.',
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const accepting = toAccept.slice(0, allowed);
      const deferred = toAccept.slice(allowed);
      for (const event of deferred) {
        results.push({
          clientEventId: event.clientEventId,
          status: 'rejected',
          observationId: null,
          deduped: false,
          reason: 'Rate limited; retry later.',
        });
      }
      // Replace toAccept with the capacity we actually reserved.
      toAccept.length = 0;
      toAccept.push(...accepting);
    }

    for (const event of toAccept) {
      try {
        const observation = await this.observations.createFromRecall({
          clerkUserId,
          event,
        });

        try {
          await this.prisma.recallEventReceipt.create({
            data: {
              userId: user.id,
              clientEventId: event.clientEventId,
              fingerprint: event.fingerprint,
              observationId: observation.id,
            },
          });
        } catch (error) {
          if (isUniqueViolation(error)) {
            // Race: another request won — treat as dedupe; observation already created.
            const again = await this.prisma.recallEventReceipt.findUnique({
              where: {
                userId_clientEventId: {
                  userId: user.id,
                  clientEventId: event.clientEventId,
                },
              },
            });
            results.push({
              clientEventId: event.clientEventId,
              status: 'deduped',
              observationId: again?.observationId ?? observation.id,
              deduped: true,
            });
            continue;
          }
          throw error;
        }

        results.push({
          clientEventId: event.clientEventId,
          status: 'accepted',
          observationId: observation.id,
          deduped: false,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to create observation.';
        results.push({
          clientEventId: event.clientEventId,
          status: 'rejected',
          observationId: null,
          deduped: false,
          reason: message.slice(0, 200),
        });
      }
    }

    // Preserve request order: rejected/deduped already pushed; append accepted in loop.
    // Re-order to match input clientEventIds where possible.
    const byId = new Map(results.map((r) => [r.clientEventId, r]));
    const ordered: RecallEventResult[] = [];
    for (const item of validated.events) {
      const id = item.ok
        ? item.event.clientEventId
        : (item.clientEventId ?? 'unknown');
      const hit = byId.get(id);
      if (hit) {
        ordered.push(hit);
        byId.delete(id);
      }
    }
    for (const leftover of byId.values()) ordered.push(leftover);

    return { results: ordered };
  }

  async deleteRecallDataForClerkUser(clerkUserId: string): Promise<{
    deletedObservations: number;
  }> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const rows = await this.prisma.observation.findMany({
      where: {
        userId: user.id,
        sourceMetadata: {
          path: ['captureKind'],
          equals: 'recall',
        },
      },
      select: { id: true },
    });

    let deleted = 0;
    for (const row of rows) {
      await this.observations.deleteForClerkUser(clerkUserId, row.id);
      deleted += 1;
    }

    await this.prisma.recallEventReceipt.deleteMany({
      where: { userId: user.id },
    });
    return { deletedObservations: deleted };
  }

  /** Test helper */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
