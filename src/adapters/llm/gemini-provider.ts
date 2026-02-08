import {
  BaseProvider,
  AIMessage,
  AIRequestOptions,
  AIProviderResponse,
  AIProviderType,
} from './base-provider';

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  error?: { message: string; code: number };
}

export class GeminiProvider extends BaseProvider {
  readonly id: AIProviderType = 'gemini';
  readonly name = 'Google Gemini';

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const model = this.config.defaultModel;
      const url = `${this.config.endpoint}/models/${model}:generateContent?key=${apiKey}`;

      const response = await this.makeRequest<GeminiResponse>({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      return !response.error && !!response.candidates && response.candidates.length > 0;
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
    const url = `${this.config.endpoint}/models/${model}:generateContent?key=${apiKey}`;

    const { contents, systemInstruction } = this.convertMessages(messages);

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    try {
      const response = await this.makeRequest<GeminiResponse>({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.error) {
        return {
          success: false,
          content: '',
          error: response.error.message,
          errorCode: String(response.error.code),
        };
      }

      if (!response.candidates || response.candidates.length === 0) {
        return { success: false, content: '', error: 'No response from model' };
      }

      const text = response.candidates[0].content.parts
        .map((p) => p.text)
        .join('');

      return {
        success: true,
        content: text,
        tokensUsed: response.usageMetadata
          ? response.usageMetadata.promptTokenCount + response.usageMetadata.candidatesTokenCount
          : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private convertMessages(messages: AIMessage[]): {
    contents: { role: string; parts: { text: string }[] }[];
    systemInstruction: string | null;
  } {
    const contents: { role: string; parts: { text: string }[] }[] = [];
    let systemInstruction: string | null = null;

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    return { contents, systemInstruction };
  }
}
