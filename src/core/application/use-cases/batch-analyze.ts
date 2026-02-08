import type { InboxNote } from '../../domain/entities/inbox-note';
import { AnalyzeNoteUseCase } from './analyze-note';

export class BatchAnalyzeUseCase {
  constructor(private analyzeNote: AnalyzeNoteUseCase) {}

  async execute(notes: InboxNote[]): Promise<InboxNote[]> {
    const results: InboxNote[] = [];
    for (const note of notes) {
      const analysis = await this.analyzeNote.execute(note);
      results.push({ ...note, analysis });
    }
    return results;
  }
}
