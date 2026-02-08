import type { InboxNote } from '../entities/inbox-note';

export interface IInboxRepository {
  getInboxNotes(): Promise<InboxNote[]>;
  moveNote(note: InboxNote, targetFolder: string): Promise<void>;
  updateFrontmatter(note: InboxNote, updates: Record<string, any>): Promise<void>;
  getFolderList(): string[];
}
