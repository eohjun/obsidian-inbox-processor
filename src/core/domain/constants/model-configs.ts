import type { AIProviderType } from '../../../adapters/llm/base-provider';

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: AIProviderType;
  inputCostPer1M: number;
  outputCostPer1M: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  isReasoning?: boolean;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'claude-sonnet-4.5': {
    id: 'claude-sonnet-4-5-20250929',
    displayName: 'Claude Sonnet 4.5',
    provider: 'claude',
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    maxInputTokens: 200000,
    maxOutputTokens: 16384,
  },
  'claude-haiku': {
    id: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    provider: 'claude',
    inputCostPer1M: 0.8,
    outputCostPer1M: 4.0,
    maxInputTokens: 200000,
    maxOutputTokens: 8192,
  },
  'gemini-2-flash': {
    id: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.3,
    maxInputTokens: 1000000,
    maxOutputTokens: 8192,
  },
  'gemini-3-flash': {
    id: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.5,
    outputCostPer1M: 3.0,
    maxInputTokens: 1000000,
    maxOutputTokens: 65536,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    maxInputTokens: 128000,
    maxOutputTokens: 16384,
  },
  'gpt-5.2': {
    id: 'gpt-5.2',
    displayName: 'GPT-5.2',
    provider: 'openai',
    inputCostPer1M: 1.75,
    outputCostPer1M: 14.0,
    maxInputTokens: 256000,
    maxOutputTokens: 32768,
    isReasoning: true,
  },
};

export function getModelsByProvider(provider: AIProviderType): ModelConfig[] {
  return Object.values(MODEL_CONFIGS).filter((m) => m.provider === provider);
}
