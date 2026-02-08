import type { InboxNote } from '../../domain/entities/inbox-note';
import type { IInboxRepository } from '../../domain/interfaces/inbox-repository';
import type { IAuditLogger, MoveRecord } from '../services/audit-logger';

export class BatchMoveUseCase {
  constructor(
    private repository: IInboxRepository,
    private auditLogger: IAuditLogger,
  ) {}

  async execute(
    moves: Array<{ note: InboxNote; targetFolder: string }>,
    fixFrontmatter: boolean,
  ): Promise<void> {
    const records: MoveRecord[] = [];

    // Sequential moves to avoid race conditions
    for (const { note, targetFolder } of moves) {
      const from = note.path;
      await this.repository.moveNote(note, targetFolder);

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
          const movedNote: InboxNote = {
            ...note,
            path: `${targetFolder}/${note.basename}.md`,
          };
          await this.repository.updateFrontmatter(movedNote, updates);
          frontmatterUpdated = true;
        }
      }

      const to = `${targetFolder}/${note.basename}.md`;
      records.push({ from, to, frontmatterUpdated });
    }

    // Single audit log entry for all moves
    if (records.length > 0) {
      await this.auditLogger.logMoves(records);
    }
  }
}
