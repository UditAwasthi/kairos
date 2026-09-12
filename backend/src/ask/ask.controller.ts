import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AskService } from './ask.service';
import type { AskRequestBody } from './ask.validation';

@Controller('ask')
@UseGuards(AuthGuard)
export class AskController {
  constructor(private readonly askService: AskService) {}

  @Post()
  @HttpCode(200)
  async ask(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AskRequestBody,
  ) {
    try {
      const data = await this.askService.ask(user.id, body ?? {});
      return { data };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
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
      if (/INVALID_AI_OUTPUT|grounded answer|answer must/i.test(message)) {
        throw new HttpException(
          {
            error: {
              code: 'ASK_INVALID_RESPONSE',
              message: 'Kairos could not produce a valid answer. Try again.',
            },
          },
          HttpStatus.BAD_GATEWAY,
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
