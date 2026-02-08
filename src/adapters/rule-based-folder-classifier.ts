import { App, TFolder, normalizePath } from 'obsidian';
import type { InboxNote } from '../core/domain/entities/inbox-note';
import type { FolderRecommendation } from '../core/domain/value-objects/folder-recommendation';
import type { IFolderClassifier } from '../core/domain/interfaces/folder-classifier';
import {
  PROJECT_MAPPINGS,
  AREA_MAPPINGS,
  RESOURCE_MAPPINGS,
  DEFAULT_FALLBACKS,
  CONFIDENCE,
} from '../core/domain/constants/folder-mappings';

export class RuleBasedFolderClassifier implements IFolderClassifier {
  constructor(
    private app: App,
    private maxRecommendations: number,
  ) {}

  classify(note: InboxNote): FolderRecommendation[] {
    const text = `${note.basename} ${note.content.slice(0, 500)}`;
    const results: FolderRecommendation[] = [];
    const seen = new Set<string>();

    const addResult = (
      folder: string,
      confidence: number,
      label: string,
    ): void => {
      if (seen.has(folder)) return;
      // Only include folders that exist in vault
      if (!this.folderExists(folder)) return;
      seen.add(folder);
      results.push({ folder, confidence, matchedRule: label });
    };

    // 1. Project mappings (highest priority)
    for (const mapping of PROJECT_MAPPINGS) {
      if (mapping.pattern.test(text)) {
        addResult(mapping.folder, CONFIDENCE.PROJECT, mapping.label);
      }
    }

    // 2. Area mappings
    for (const mapping of AREA_MAPPINGS) {
      if (mapping.pattern.test(text)) {
        addResult(mapping.folder, CONFIDENCE.AREA, mapping.label);
      }
    }

    // 3. Resource mappings
    for (const mapping of RESOURCE_MAPPINGS) {
      if (mapping.pattern.test(text)) {
        addResult(mapping.folder, CONFIDENCE.RESOURCE, mapping.label);
      }
    }

    // 4. Fallbacks if nothing matched
    if (results.length === 0) {
      for (const fallback of DEFAULT_FALLBACKS) {
        if (this.folderExists(fallback)) {
          addResult(fallback, CONFIDENCE.FALLBACK, 'Default');
        }
      }
    }

    return results.slice(0, this.maxRecommendations);
  }

  private folderExists(folderPath: string): boolean {
    const normalized = normalizePath(folderPath);
    const abstractFile = this.app.vault.getAbstractFileByPath(normalized);
    return abstractFile instanceof TFolder;
  }
}
