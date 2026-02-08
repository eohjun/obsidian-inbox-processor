import { App, Modal } from 'obsidian';
import type { InboxNote } from '../core/domain/entities/inbox-note';

interface MovePlan {
  note: InboxNote;
  targetFolder: string;
}

export class BatchConfirmModal extends Modal {
  private moves: MovePlan[];
  private onConfirm: () => Promise<void>;

  constructor(app: App, moves: MovePlan[], onConfirm: () => Promise<void>) {
    super(app);
    this.moves = moves;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass('inbox-processor-batch-modal');

    contentEl.createEl('h3', { text: 'Confirm Batch Move' });
    contentEl.createEl('p', {
      text: `Moving ${this.moves.length} notes:`,
      cls: 'inbox-processor-batch-summary',
    });

    // Move plan table
    const table = contentEl.createEl('table', {
      cls: 'inbox-processor-batch-table',
    });
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'Note' });
    headerRow.createEl('th', { text: 'Destination' });

    const tbody = table.createEl('tbody');
    for (const move of this.moves) {
      const row = tbody.createEl('tr');
      row.createEl('td', { text: move.note.basename });
      row.createEl('td', { text: move.targetFolder });
    }

    // Buttons
    const btnRow = contentEl.createDiv({ cls: 'inbox-processor-batch-buttons' });

    const confirmBtn = btnRow.createEl('button', {
      text: 'Move',
      cls: 'mod-cta',
    });
    confirmBtn.addEventListener('click', async () => {
      this.close();
      await this.onConfirm();
    });

    const cancelBtn = btnRow.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
