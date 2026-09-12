import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AskService } from './ask.service';
import type { AskRequestBody } from './ask.validation';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly askService: AskService,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { title?: unknown },
  ) {
    const title =
      typeof body?.title === 'string'
        ? body.title.trim().slice(0, 120)
        : undefined;
    const data = await this.conversations.createForClerkUser(user.id, title);
    return { data };
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const data = await this.conversations.listForClerkUser(user.id, {
      limit: Number.isFinite(limit) ? limit : undefined,
      cursor: cursor || undefined,
    });
    return { data };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('limit') limitRaw?: string,
    @Query('before') before?: string,
  ) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const data = await this.conversations.getForClerkUser(user.id, id, {
      limit: Number.isFinite(limit) ? limit : undefined,
      before: before || undefined,
    });
    return { data };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.conversations.deleteForClerkUser(user.id, id);
  }

  @Post(':id/ask')
  @HttpCode(200)
  async ask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: AskRequestBody,
  ) {
    try {
      const data = await this.askService.ask(user.id, {
        ...(body ?? {}),
        conversationId: id,
      });
      return { data };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Ask failed';
      if (/not configured/i.test(message)) {
        throw new HttpException(
          {
            error: {
              code: 'ASK_UNAVAILABLE',
              message: 'Ask Kairos is temporarily unavailable.',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      if (/rate limit/i.test(message)) {
        throw new HttpException(
          {
            error: {
              code: 'AI_RATE_LIMITED',
              message: 'Kairos is busy right now. Try again in a moment.',
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (/timed out/i.test(message)) {
        throw new HttpException(
          {
            error: {
              code: 'AI_TIMEOUT',
              message: 'Kairos took too long to answer. Try again.',
            },
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      throw new HttpException(
        {
          error: {
            code: 'ASK_FAILED',
            message: 'Could not answer from your memories. Try again.',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
