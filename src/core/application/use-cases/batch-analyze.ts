import type { InboxNote } from '../../domain/entities/inbox-note';
import { AnalyzeNoteUseCase } from './analyze-note';

export class BatchAnalyzeUseCase {
  constructor(private analyzeNote: AnalyzeNoteUseCase) {}

  execute(notes: InboxNote[]): InboxNote[] {
    return notes.map((note) => ({
      ...note,
      analysis: this.analyzeNote.execute(note),
    }));
  }
}
