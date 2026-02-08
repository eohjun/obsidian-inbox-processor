import {
  BaseProvider,
  AIMessage,
  AIRequestOptions,
  AIProviderResponse,
  AIProviderType,
} from './base-provider';

interface OpenAIResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: { message: string; type: string };
}

export class OpenAIProvider extends BaseProvider {
  readonly id: AIProviderType = 'openai';
  readonly name = 'OpenAI';

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const model = this.config.defaultModel;
      const isReasoningModel =
        model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');

      const requestBody: Record<string, unknown> = {
        model,
        messages: [{ role: 'user', content: 'Hello' }],
      };

      if (isReasoningModel) {
        requestBody.max_completion_tokens = 10;
      } else {
        requestBody.max_tokens = 10;
      }

      const response = await this.makeRequest<OpenAIResponse>({
        url: `${this.config.endpoint}/chat/completions`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      return !response.error && response.choices && response.choices.length > 0;
    } catch {
      return false;
    }
  }

  async generateText(
    messages: AIMessage[],
    apiKey: string,
    options?: AIRequestOptions,
  ): Promise<AIProviderResponse> {
    const model = options?.model || this.config.defaultModel;
    const isReasoningModel =
      model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');

    const openaiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const requestBody: Record<string, unknown> = {
      model,
      messages: openaiMessages,
    };

    if (isReasoningModel) {
      requestBody.max_completion_tokens = options?.maxTokens ?? 4096;
    } else {
      requestBody.max_tokens = options?.maxTokens ?? 4096;
      requestBody.temperature = options?.temperature ?? 0.7;
    }

    try {
      const response = await this.makeRequest<OpenAIResponse>({
        url: `${this.config.endpoint}/chat/completions`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.error) {
        return {
          success: false,
          content: '',
          error: response.error.message,
          errorCode: response.error.type,
        };
      }

      if (!response.choices || response.choices.length === 0) {
        return { success: false, content: '', error: 'No response from model' };
      }

      return {
        success: true,
        content: response.choices[0].message.content,
        tokensUsed: response.usage
          ? response.usage.prompt_tokens + response.usage.completion_tokens
          : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
