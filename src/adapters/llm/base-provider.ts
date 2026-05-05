import { requestUrl, RequestUrlParam } from 'obsidian';

export type AIProviderType = 'claude' | 'openai' | 'gemini';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProviderResponse {
  success: boolean;
  content: string;
  tokensUsed?: number;
  error?: string;
  errorCode?: string;
}

export interface AIProviderConfig {
  id: AIProviderType;
  name: string;
  displayName: string;
  defaultModel: string;
  endpoint: string;
}

export interface AIProvider {
  readonly id: AIProviderType;
  readonly name: string;
  readonly config: AIProviderConfig;
  testApiKey(apiKey: string): Promise<boolean>;
  generateText(
    messages: AIMessage[],
    apiKey: string,
    options?: AIRequestOptions,
  ): Promise<AIProviderResponse>;
}

export const AI_PROVIDERS: Record<AIProviderType, AIProviderConfig> = {
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    displayName: 'Claude',
    defaultModel: 'claude-sonnet-4-6',
    endpoint: 'https://api.anthropic.com/v1',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    displayName: 'Gemini',
    defaultModel: 'gemini-3.1-flash-lite-preview',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    defaultModel: 'gpt-5.4-nano',
    endpoint: 'https://api.openai.com/v1',
  },
};

export abstract class BaseProvider implements AIProvider {
  abstract readonly id: AIProviderType;
  abstract readonly name: string;

  get config(): AIProviderConfig {
    return AI_PROVIDERS[this.id];
  }

  protected async makeRequest<T>(options: RequestUrlParam): Promise<T> {
    try {
      const response = await requestUrl(options);
      return response.json as T;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  protected handleError(error: unknown): AIProviderResponse {
    const normalized = this.normalizeError(error);
    return {
      success: false,
      content: '',
      error: normalized.message,
      errorCode: normalized.code,
    };
  }

  private normalizeError(error: unknown): { message: string; code: string } {
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('rate')) {
        return { message: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT' };
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        return { message: 'Invalid API key or unauthorized access.', code: 'AUTH_ERROR' };
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return { message: 'Request timed out. Please try again.', code: 'TIMEOUT' };
      }
      return { message: error.message, code: 'UNKNOWN' };
    }
    return { message: 'An unknown error occurred', code: 'UNKNOWN' };
  }

  abstract testApiKey(apiKey: string): Promise<boolean>;
  abstract generateText(
    messages: AIMessage[],
    apiKey: string,
    options?: AIRequestOptions,
  ): Promise<AIProviderResponse>;
}
