import type { InboxNote } from '../../domain/entities/inbox-note';
import type { IInboxRepository } from '../../domain/interfaces/inbox-repository';
import type { IAuditLogger } from '../services/audit-logger';

export class MoveNoteUseCase {
  constructor(
    private repository: IInboxRepository,
    private auditLogger: IAuditLogger,
  ) {}

  async execute(
    note: InboxNote,
    targetFolder: string,
    fixFrontmatter: boolean,
  ): Promise<void> {
    const from = note.path;

    // 1. Move the note
    await this.repository.moveNote(note, targetFolder);

    // 2. Fix frontmatter if requested
    let frontmatterUpdated = false;
    if (fixFrontmatter && note.analysis?.checklist) {
      const updates: Record<string, any> = {};
      if (!note.analysis.checklist.hasType) {
        updates.type = note.analysis.checklist.suggestedType;
      }
      if (!note.analysis.checklist.hasStatus) {
        updates.status = note.analysis.checklist.suggestedStatus;
      }
      if (Object.keys(updates).length > 0) {
        // Note path has changed after move; update using new path
        const movedNote: InboxNote = {
          ...note,
          path: `${targetFolder}/${note.basename}.md`,
        };
        await this.repository.updateFrontmatter(movedNote, updates);
        frontmatterUpdated = true;
      }
    }

    // 3. Audit log
    const to = `${targetFolder}/${note.basename}.md`;
    await this.auditLogger.logMoves([{ from, to, frontmatterUpdated }]);
  }
}
