import type { InboxNote } from '../../core/domain/entities/inbox-note';
import type { FolderRecommendation } from '../../core/domain/value-objects/folder-recommendation';
import type { IFolderClassifier } from '../../core/domain/interfaces/folder-classifier';
import type { AIService } from '../../core/application/services/ai-service';
import type { IInboxRepository } from '../../core/domain/interfaces/inbox-repository';

const SYSTEM_PROMPT = `You are a note classifier for a personal knowledge management (PKM) vault.
Given a note's title and content excerpt, and a list of available folders, suggest the best 1-3 folders where this note should be filed.

Respond ONLY with a JSON array. Each element must have:
- "folder": exact folder path from the provided list
- "confidence": number between 0.5 and 0.95
- "matchedRule": brief reason (max 20 chars)

Example response:
[{"folder":"02_Areas/AI_Technology","confidence":0.85,"matchedRule":"AI content"}]

Rules:
- Only suggest folders from the provided list
- Confidence should reflect how well the note fits
- If unsure, return fewer suggestions with lower confidence
- Respond with valid JSON only, no markdown fences`;

const CONFIDENCE_THRESHOLD = 0.6;

export class HybridFolderClassifier implements IFolderClassifier {
  constructor(
    private ruleClassifier: IFolderClassifier,
    private aiService: AIService | null,
    private repository: IInboxRepository,
    private maxRecommendations: number,
  ) {}

  async classify(note: InboxNote): Promise<FolderRecommendation[]> {
    // 1. Try rule-based first
    const ruleResults = await this.ruleClassifier.classify(note);

    // 2. If any result has confidence >= threshold, use rules
    if (ruleResults.some((r) => r.confidence >= CONFIDENCE_THRESHOLD)) {
      return ruleResults;
    }

    // 3. No AI service or no API key → return rule results as-is
    if (!this.aiService || !this.aiService.getCurrentApiKey()) {
      return ruleResults;
    }

    // 4. LLM fallback for uncertain cases
    try {
      const llmResults = await this.classifyWithLLM(note);
      return llmResults.length > 0 ? llmResults : ruleResults;
    } catch (error) {
      console.warn('Inbox Processor: LLM classification failed, using rules', error);
      return ruleResults;
    }
  }

  private async classifyWithLLM(note: InboxNote): Promise<FolderRecommendation[]> {
    const folders = this.repository.getFolderList();
    const contentExcerpt = note.content.slice(0, 500);

    const userPrompt = `Note title: ${note.basename}
Content excerpt: ${contentExcerpt}

Available folders:
${folders.join('\n')}`;

    const response = await this.aiService!.simpleGenerate(
      userPrompt,
      SYSTEM_PROMPT,
      { maxTokens: 256, temperature: 0.3 },
    );

    if (!response.success || !response.content) {
      return [];
    }

    return this.parseResponse(response.content, folders);
  }

  private parseResponse(
    content: string,
    validFolders: string[],
  ): FolderRecommendation[] {
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) return [];

      const folderSet = new Set(validFolders);
      const results: FolderRecommendation[] = [];

      for (const item of parsed) {
        if (
          typeof item.folder === 'string' &&
          typeof item.confidence === 'number' &&
          typeof item.matchedRule === 'string' &&
          folderSet.has(item.folder) &&
          item.confidence >= 0.3 &&
          item.confidence <= 1.0
        ) {
          results.push({
            folder: item.folder,
            confidence: item.confidence,
            matchedRule: `AI: ${item.matchedRule}`,
          });
        }
      }

      return results.slice(0, this.maxRecommendations);
    } catch {
      return [];
    }
  }
}
