import { Injectable, Logger } from '@nestjs/common';
import {
  validateDocumentAnalysis,
  validateEntities,
  validateGroundedAnswerPayload,
  validateSummary,
  validateTopics,
} from './ai-output.validation';
import type {
  AIProvider,
  DocumentAnalysis,
  ExtractedEntity,
  ExtractedTopic,
  GroundedAnswerResult,
  GroundedContextItem,
  ConversationHistoryTurn,
} from './ai.types';
import { RAG_SYSTEM_PROMPT } from './rag.prompt';
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable()
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';
  private readonly logger = new Logger(OpenAICompatibleProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY?.trim() || '';
    this.baseUrl = (
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1'
    ).replace(/\/+$/, '');
    this.model = process.env.AI_MODEL?.trim() || 'gpt-4o-mini';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async summarize(text: string): Promise<string> {
    const analysis = await this.analyzeDocument([text]);
    return analysis.summary;
  }

  async extractTopics(text: string): Promise<ExtractedTopic[]> {
    const analysis = await this.analyzeDocument([text]);
    return analysis.topics;
  }

  async extractEntities(text: string): Promise<ExtractedEntity[]> {
    const analysis = await this.analyzeDocument([text]);
    return analysis.entities;
  }

  async analyzeDocument(chunks: string[]): Promise<DocumentAnalysis> {
    if (!this.isConfigured()) {
      throw new Error('AI provider is not configured');
    }
    if (chunks.length === 0) {
      throw new Error('No content available for analysis');
    }

    const limitedChunks = chunks.slice(0, 12);
    const chunkSummaries: string[] = [];

    for (const [index, chunk] of limitedChunks.entries()) {
      const partial = await this.chatJson([
        {
          role: 'system',
          content:
            'You summarize document excerpts for a personal memory app. Return strict JSON only: {"summary":"..."}. Be concise and factual. Do not invent facts.',
        },
        {
          role: 'user',
          content: `Chunk ${index + 1}/${limitedChunks.length}:\n${chunk.slice(0, 6000)}`,
        },
      ]);
      chunkSummaries.push(validateSummary(partial.summary));
    }

    const combined = await this.chatJson([
      {
        role: 'system',
        content: `You analyze personal documents. Return strict JSON only with this shape:
{"summary":"string","topics":[{"name":"string","confidence":0.0}],"entities":[{"name":"string","type":"PERSON|ORGANIZATION|TECHNOLOGY|PRODUCT|LOCATION|CONCEPT","confidence":0.0}]}
Rules:
- Be conservative. Do not hallucinate.
- Topics should be short labels (2-4 words).
- Entities must use only the allowed types.
- Prefer precision over recall.`,
      },
      {
        role: 'user',
        content: `Combine these chunk summaries into one analysis:\n${chunkSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      },
    ]);

    return validateDocumentAnalysis(combined, {
      provider: this.name,
      model: this.model,
    });
  }

  async generateGroundedAnswer(params: {
    question: string;
    context: GroundedContextItem[];
    conversationHistory?: ConversationHistoryTurn[];
  }): Promise<GroundedAnswerResult> {
    if (!this.isConfigured()) {
      throw new Error('AI provider is not configured');
    }
    if (params.context.length === 0) {
      throw new Error('No context available for grounded answer');
    }

    const allowedRefs = new Set(params.context.map((item) => item.ref));
    const contextBlock = params.context
      .map(
        (item) =>
          `[${item.ref}]\nfilename: ${item.title}\ndate: ${item.createdAt}\ncontent: ${item.content}`,
      )
      .join('\n\n');

    const history = params.conversationHistory ?? [];
    const historyBlock =
      history.length === 0
        ? 'None.'
        : history.map((turn) => `${turn.role}: ${turn.content}`).join('\n');

    const payload = await this.chatJson([
      { role: 'system', content: RAG_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Recent conversation (for resolving references only; not a knowledge source):\n${historyBlock}\n\nCurrent question:\n${params.question}\n\nRetrieved Kairos context (source of truth):\n${contextBlock}`,
      },
    ]);

    const validated = validateGroundedAnswerPayload(payload, allowedRefs);
    return {
      answer: validated.answer,
      citationRefs: validated.citationRefs,
      provider: this.name,
      model: this.model,
    };
  }

  private async chatJson(
    messages: ChatMessage[],
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages,
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new Error('AI rate limit exceeded');
      }
      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }

      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI returned empty content');
      }

      const parsed = JSON.parse(content) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI returned non-object JSON');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI request timed out');
      }
      this.logger.warn(
        `AI call failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Re-export validators for unit tests that don't need the provider.
export { validateTopics, validateEntities, validateSummary };
