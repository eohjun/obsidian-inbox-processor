import type {
  AIProvider,
  AIProviderType,
  AIMessage,
  AIRequestOptions,
  AIProviderResponse,
} from '../../../adapters/llm/base-provider';
import { ClaudeProvider } from '../../../adapters/llm/claude-provider';
import { GeminiProvider } from '../../../adapters/llm/gemini-provider';
import { OpenAIProvider } from '../../../adapters/llm/openai-provider';

export interface AISettings {
  provider: AIProviderType;
  apiKeys: Partial<Record<AIProviderType, string>>;
  model: string;
  classificationMode: 'rule' | 'hybrid' | 'llm';
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'claude',
  apiKeys: {},
  model: '',
  classificationMode: 'hybrid',
};

export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('claude', new ClaudeProvider());
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('openai', new OpenAIProvider());
  }

  updateSettings(settings: AISettings): void {
    this.settings = settings;
  }

  getCurrentProvider(): AIProvider | undefined {
    return this.providers.get(this.settings.provider);
  }

  getCurrentApiKey(): string | undefined {
    return this.settings.apiKeys[this.settings.provider];
  }

  async testCurrentApiKey(): Promise<boolean> {
    const provider = this.getCurrentProvider();
    const apiKey = this.getCurrentApiKey();
    if (!provider || !apiKey) return false;
    return provider.testApiKey(apiKey);
  }

  async generateText(
    messages: AIMessage[],
    options?: AIRequestOptions,
  ): Promise<AIProviderResponse> {
    const provider = this.getCurrentProvider();
    const apiKey = this.getCurrentApiKey();

    if (!provider) {
      return { success: false, content: '', error: 'No provider selected' };
    }
    if (!apiKey) {
      return { success: false, content: '', error: 'No API key configured' };
    }

    const mergedOptions: AIRequestOptions = {
      model: this.settings.model || undefined,
      ...options,
    };

    return provider.generateText(messages, apiKey, mergedOptions);
  }

  async simpleGenerate(
    userPrompt: string,
    systemPrompt?: string,
    options?: AIRequestOptions,
  ): Promise<AIProviderResponse> {
    const messages: AIMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });
    return this.generateText(messages, options);
  }
}
