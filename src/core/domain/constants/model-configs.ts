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
  'claude-sonnet-4.6': {
    id: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'claude',
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    maxInputTokens: 200000,
    maxOutputTokens: 64000,
  },
  'claude-haiku-4.5': {
    id: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    provider: 'claude',
    inputCostPer1M: 1.0,
    outputCostPer1M: 5.0,
    maxInputTokens: 200000,
    maxOutputTokens: 64000,
  },
  'gemini-2-flash': {
    id: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    maxInputTokens: 1000000,
    maxOutputTokens: 8192,
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.3,
    outputCostPer1M: 2.5,
    maxInputTokens: 1000000,
    maxOutputTokens: 65536,
  },
  'gpt-5-nano': {
    id: 'gpt-5-nano',
    displayName: 'GPT-5 Nano',
    provider: 'openai',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.4,
    maxInputTokens: 400000,
    maxOutputTokens: 128000,
    isReasoning: true,
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    displayName: 'GPT-5 Mini',
    provider: 'openai',
    inputCostPer1M: 0.25,
    outputCostPer1M: 2.0,
    maxInputTokens: 400000,
    maxOutputTokens: 128000,
    isReasoning: true,
  },
};

export function getModelsByProvider(provider: AIProviderType): ModelConfig[] {
  return Object.values(MODEL_CONFIGS).filter((m) => m.provider === provider);
}
