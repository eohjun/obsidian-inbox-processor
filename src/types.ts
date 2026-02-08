import type { AIProviderType } from './adapters/llm/base-provider';

export interface AISettings {
  provider: AIProviderType;
  apiKeys: Partial<Record<AIProviderType, string>>;
  model: string;
  classificationMode: 'rule' | 'hybrid' | 'llm';
}

export interface InboxProcessorSettings {
  inboxFolder: string;
  autoAnalyze: boolean;
  autoFixFrontmatter: boolean;
  showWarnings: boolean;
  maxRecommendations: number;
  ai: AISettings;
}

export const DEFAULT_SETTINGS: InboxProcessorSettings = {
  inboxFolder: '00_Inbox',
  autoAnalyze: true,
  autoFixFrontmatter: true,
  showWarnings: true,
  maxRecommendations: 3,
  ai: {
    provider: 'claude',
    apiKeys: {},
    model: '',
    classificationMode: 'hybrid',
  },
};
