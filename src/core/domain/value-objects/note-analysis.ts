import type { FolderRecommendation } from './folder-recommendation';
import type { FrontmatterChecklist } from './frontmatter-checklist';

export interface NoteAnalysis {
  keywords: string[];
  recommendations: FolderRecommendation[];
  checklist: FrontmatterChecklist;
  hasSummaryCallout: boolean;
}
