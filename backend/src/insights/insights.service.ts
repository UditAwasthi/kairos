import { Inject, Injectable } from '@nestjs/common';
import { ProcessingStatus } from '@prisma/client';
import { AI_PROVIDER, type AIProvider } from '../ai/ai.types';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

export type TodayInsight = {
  title: string;
  body: string;
  generatedAt: string;
  observationCount: number;
  empty: boolean;
};

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  async todayForClerkUser(clerkUserId: string): Promise<TodayInsight> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const observations = await this.prisma.observation.findMany({
      where: {
        userId: user.id,
        processingStatus: ProcessingStatus.COMPLETED,
        capturedAt: { gte: since },
      },
      orderBy: { capturedAt: 'desc' },
      take: 12,
      select: {
        summary: true,
        extractedText: true,
        originalFilename: true,
        source: true,
        capturedAt: true,
      },
    });

    const generatedAt = new Date().toISOString();
    if (observations.length === 0) {
      return {
        title: "Today's insight",
        body: 'Capture something today and Kairos will start finding patterns.',
        generatedAt,
        observationCount: 0,
        empty: true,
      };
    }

    const snippets = observations
      .map((item) => {
        const text = (item.summary || item.extractedText || '').trim();
        return text ? `${item.source}: ${text.slice(0, 280)}` : null;
      })
      .filter((item): item is string => Boolean(item));

    if (this.ai.isConfigured() && snippets.length > 0) {
      try {
        const analysis = await this.ai.analyzeDocument([
          `Write one short personal insight (2 sentences max) about what this person has been spending attention on recently. Be concrete. Do not invent facts.\n\nRecent memories:\n${snippets.join('\n')}`,
        ]);
        const body = analysis.summary.trim();
        if (body) {
          return {
            title: "Today's insight",
            body,
            generatedAt,
            observationCount: observations.length,
            empty: false,
          };
        }
      } catch {
        // Fall back to latest summary.
      }
    }

    const latest =
      snippets[0] ||
      observations[0].originalFilename ||
      'Recent captures are still settling.';
    return {
      title: "Today's insight",
      body: latest.replace(/^[A-Z_]+:\s*/, ''),
      generatedAt,
      observationCount: observations.length,
      empty: false,
    };
  }
}
