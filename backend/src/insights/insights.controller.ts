import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { InsightsService, type TodayInsight } from './insights.service';

@Controller('insights')
@UseGuards(AuthGuard)
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get('today')
  async today(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: TodayInsight }> {
    return { data: await this.insights.todayForClerkUser(user.id) };
  }
}
