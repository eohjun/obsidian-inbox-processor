import type { InboxNote } from '../../domain/entities/inbox-note';
import type { NoteAnalysis } from '../../domain/value-objects/note-analysis';
import type { FrontmatterChecklist } from '../../domain/value-objects/frontmatter-checklist';
import type { IFolderClassifier } from '../../domain/interfaces/folder-classifier';
import { SUMMARY_CALLOUT_PATTERNS } from '../../domain/constants/patterns';
import { KeywordExtractor } from '../services/keyword-extractor';

export class AnalyzeNoteUseCase {
  constructor(
    private classifier: IFolderClassifier,
    private keywordExtractor: KeywordExtractor,
  ) {}

  execute(note: InboxNote): NoteAnalysis {
    // 1. Extract keywords
    const keywords = this.keywordExtractor.extract(
      note.basename,
      note.content,
      note.frontmatter,
    );

    // 2. Classify → folder recommendations
    const recommendations = this.classifier.classify(note);

    // 3. Build frontmatter checklist
    const checklist = this.buildChecklist(note.frontmatter);

    // 4. Check summary callout existence
    const hasSummaryCallout = SUMMARY_CALLOUT_PATTERNS.some((p) =>
      p.test(note.content),
    );

    return { keywords, recommendations, checklist, hasSummaryCallout };
  }

  private buildChecklist(
    frontmatter: Record<string, any> | null,
  ): FrontmatterChecklist {
    const fm = frontmatter ?? {};
    const hasType =
      typeof fm.type === 'string' && fm.type.trim().length > 0;
    const hasStatus =
      typeof fm.status === 'string' && fm.status.trim().length > 0;
    const hasTags = Array.isArray(fm.tags) && fm.tags.length > 0;

    return {
      hasType,
      hasStatus,
      hasTags,
      suggestedType: 'literature',
      suggestedStatus: 'refined',
    };
  }
}
