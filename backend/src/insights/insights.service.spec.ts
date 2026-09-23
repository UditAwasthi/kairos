import { ProcessingStatus } from '@prisma/client';
import { InsightsService } from './insights.service';

describe('InsightsService', () => {
  const user = { id: 'user_a', clerkUserId: 'clerk_a' };

  it('returns an empty-state insight when there are no recent memories', async () => {
    const prisma = {
      observation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new InsightsService(
      prisma as never,
      { findOrCreateByClerkId: jest.fn().mockResolvedValue(user) } as never,
      { isConfigured: () => false } as never,
    );

    const result = await service.todayForClerkUser('clerk_a');
    expect(result.empty).toBe(true);
    expect(result.observationCount).toBe(0);
    expect(result.body).toMatch(/Capture something today/i);
  });

  it('falls back to the latest summary when AI is off', async () => {
    const prisma = {
      observation: {
        findMany: jest.fn().mockResolvedValue([
          {
            summary: 'You spent more time on backend work this week.',
            extractedText: 'notes',
            originalFilename: 'note.txt',
            source: 'QUICK_CAPTURE',
            capturedAt: new Date(),
            processingStatus: ProcessingStatus.COMPLETED,
          },
        ]),
      },
    };
    const service = new InsightsService(
      prisma as never,
      { findOrCreateByClerkId: jest.fn().mockResolvedValue(user) } as never,
      { isConfigured: () => false } as never,
    );

    const result = await service.todayForClerkUser('clerk_a');
    expect(result.empty).toBe(false);
    expect(result.body).toMatch(/backend work/i);
  });
});
