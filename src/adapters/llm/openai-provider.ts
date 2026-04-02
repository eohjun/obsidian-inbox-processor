/**
 * OpenAI Provider — 공유 빌더/파서 사용
 *
 * 수정된 버그: temperature가 reasoning 모델에도 전송되던 문제 해결
 */

import {
  BaseProvider,
  AIMessage,
  AIRequestOptions,
  AIProviderResponse,
  AIProviderType,
} from './base-provider';
import { buildOpenAIBody, parseOpenAIResponse } from 'obsidian-llm-shared';

export class OpenAIProvider extends BaseProvider {
  readonly id: AIProviderType = 'openai';
  readonly name = 'OpenAI';

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const json = await this.makeRequest<{ data?: unknown[] }>({
        url: `${this.config.endpoint}/models`,
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return Array.isArray(json?.data);
    } catch {
      return false;
    }
  }

  async generateText(
    messages: AIMessage[],
    apiKey: string,
    options?: AIRequestOptions,
  ): Promise<AIProviderResponse> {
    try {
      const model = options?.model || this.config.defaultModel;
      const body = buildOpenAIBody(messages, model, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      });

      const json = await this.makeRequest<Record<string, unknown>>({
        url: `${this.config.endpoint}/chat/completions`,
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = parseOpenAIResponse(json);
      if (!result.success) {
        return { success: false, content: '', error: result.error, errorCode: 'API_ERROR' };
      }

      return {
        success: true,
        content: result.text,
        tokensUsed: result.usage.totalTokens,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
