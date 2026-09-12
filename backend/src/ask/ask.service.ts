import { Inject, Injectable, Logger } from '@nestjs/common';
import { AI_PROVIDER, type AIProvider } from '../ai/ai.types';
import { SearchService } from '../search/search.service';
import { type AskRequestBody, validateAskRequest } from './ask.validation';
import { resolveCitations, type AskCitation } from './citation.resolver';
import { RagContextBuilder } from './rag-context.builder';

export const NO_CONTEXT_ANSWER =
  "I couldn't find anything relevant in your Kairos memories.";

export type AskResponseData = {
  question: string;
  answer: string;
  citations: AskCitation[];
  insufficientEvidence: boolean;
};

@Injectable()
export class AskService {
  private readonly logger = new Logger(AskService.name);

  constructor(
    private readonly search: SearchService,
    private readonly contextBuilder: RagContextBuilder,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  async ask(
    clerkUserId: string,
    body: AskRequestBody,
  ): Promise<AskResponseData> {
    const started = Date.now();
    const request = validateAskRequest(body);

    if (!this.ai.isConfigured()) {
      throw new Error('AI provider is not configured');
    }

    const retrievalStarted = Date.now();
    const searchResult = await this.search.search(clerkUserId, {
      query: request.question,
      limit: request.limit,
      filters: {
        from: request.filters.from?.toISOString(),
        to: request.filters.to?.toISOString(),
        observationType: request.filters.observationType,
        mimeType: request.filters.mimeType,
        topicId: request.filters.topicId,
      },
    });
    const retrievalMs = Date.now() - retrievalStarted;

    const contextStarted = Date.now();
    const context = this.contextBuilder.build(searchResult.results, {
      maxChunks: request.limit,
    });
    const contextMs = Date.now() - contextStarted;

    if (context.length === 0) {
      this.logger.log(
        JSON.stringify({
          event: 'ask_kairos',
          result: 'no_context',
          retrievalMs,
          contextMs,
          totalMs: Date.now() - started,
          citationCount: 0,
        }),
      );
      return {
        question: request.question,
        answer: NO_CONTEXT_ANSWER,
        citations: [],
        insufficientEvidence: true,
      };
    }

    const llmStarted = Date.now();
    const grounded = await this.ai.generateGroundedAnswer({
      question: request.question,
      context,
    });
    const llmMs = Date.now() - llmStarted;

    const citations = resolveCitations(grounded.citationRefs, context);
    const insufficientEvidence =
      citations.length === 0 ||
      /couldn'?t find|not (enough|sufficient)|no (relevant|supporting)|do not have enough|unable to (find|answer)/i.test(
        grounded.answer,
      );

    this.logger.log(
      JSON.stringify({
        event: 'ask_kairos',
        result: 'ok',
        retrievalMs,
        contextMs,
        llmMs,
        totalMs: Date.now() - started,
        contextItems: context.length,
        citationCount: citations.length,
        insufficientEvidence,
        model: grounded.model,
      }),
    );

    return {
      question: request.question,
      answer: grounded.answer,
      citations,
      insufficientEvidence,
    };
  }
}
