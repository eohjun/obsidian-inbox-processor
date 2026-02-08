import type { InboxNote } from '../../domain/entities/inbox-note';
import type { IInboxRepository } from '../../domain/interfaces/inbox-repository';

export class ScanInboxUseCase {
  constructor(private repository: IInboxRepository) {}

  async execute(): Promise<InboxNote[]> {
    return this.repository.getInboxNotes();
  }
}
