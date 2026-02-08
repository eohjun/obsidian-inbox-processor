import { ItemView, WorkspaceLeaf, Notice, setIcon, debounce } from 'obsidian';
import type InboxProcessorPlugin from '../main';
import type { InboxNote } from '../core/domain/entities/inbox-note';
import { ScanInboxUseCase } from '../core/application/use-cases/scan-inbox';
import { BatchAnalyzeUseCase } from '../core/application/use-cases/batch-analyze';
import { AnalyzeNoteUseCase } from '../core/application/use-cases/analyze-note';
import { MoveNoteUseCase } from '../core/application/use-cases/move-note';
import { BatchMoveUseCase } from '../core/application/use-cases/batch-move';
import { KeywordExtractor } from '../core/application/services/keyword-extractor';
import { FolderPickerModal } from './folder-picker-modal';
import { BatchConfirmModal } from './batch-confirm-modal';

export const VIEW_TYPE_INBOX = 'inbox-processor-view';

export class InboxProcessorView extends ItemView {
  private plugin: InboxProcessorPlugin;
  private notes: InboxNote[] = [];
  private selectedPaths: Set<string> = new Set();
  private isLoading = false;

  constructor(leaf: WorkspaceLeaf, plugin: InboxProcessorPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_INBOX;
  }

  getDisplayText(): string {
    return 'Inbox Processor';
  }

  getIcon(): string {
    return 'inbox';
  }

  async onOpen(): Promise<void> {
    // Listen to vault events for auto-refresh
    const debouncedRefresh = debounce(() => this.refresh(), 1000, true);

    this.registerEvent(this.app.vault.on('create', debouncedRefresh));
    this.registerEvent(this.app.vault.on('delete', debouncedRefresh));
    this.registerEvent(this.app.vault.on('rename', debouncedRefresh));

    await this.refresh();
  }

  async onClose(): Promise<void> {
    this.notes = [];
    this.selectedPaths.clear();
    this.isLoading = false;
  }

  private async refresh(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Scan inbox
      const scanUseCase = new ScanInboxUseCase(this.plugin.repository);
      const rawNotes = await scanUseCase.execute();

      // Analyze all notes
      if (this.plugin.settings.autoAnalyze) {
        const analyzeUseCase = new AnalyzeNoteUseCase(
          this.plugin.classifier,
          new KeywordExtractor(),
        );
        const batchAnalyze = new BatchAnalyzeUseCase(analyzeUseCase);
        this.notes = await batchAnalyze.execute(rawNotes);
      } else {
        this.notes = rawNotes;
      }

      // Clean up selected paths for notes that no longer exist
      const existingPaths = new Set(this.notes.map((n) => n.path));
      for (const path of this.selectedPaths) {
        if (!existingPaths.has(path)) {
          this.selectedPaths.delete(path);
        }
      }
    } catch (error) {
      console.error('Inbox Processor: refresh failed', error);
      new Notice('Inbox Processor: Failed to scan inbox');
    } finally {
      this.isLoading = false;
    }

    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('inbox-processor-container');

    // Header
    this.renderHeader(container as HTMLElement);

    // Empty state
    if (this.notes.length === 0) {
      const empty = (container as HTMLElement).createDiv({
        cls: 'inbox-processor-empty',
      });
      empty.createEl('p', {
        text: 'No notes in Inbox.',
        cls: 'inbox-processor-empty-text',
      });
      return;
    }

    // Note list
    const list = (container as HTMLElement).createDiv({
      cls: 'inbox-processor-list',
    });
    for (const note of this.notes) {
      this.renderNoteCard(list, note);
    }

    // Action bar
    this.renderActionBar(container as HTMLElement);
  }

  private renderHeader(container: HTMLElement): void {
    const header = container.createDiv({ cls: 'inbox-processor-header' });

    const titleRow = header.createDiv({ cls: 'inbox-processor-title-row' });
    titleRow.createEl('h4', { text: 'Inbox Processor' });

    const count = titleRow.createEl('span', {
      cls: 'inbox-processor-count',
      text: `${this.notes.length}`,
    });
    count.setAttribute('aria-label', `${this.notes.length} notes`);

    const actions = header.createDiv({ cls: 'inbox-processor-header-actions' });

    // Refresh button
    const refreshBtn = actions.createEl('button', {
      cls: 'inbox-processor-btn-icon',
      attr: { 'aria-label': 'Refresh' },
    });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.addEventListener('click', () => this.refresh());

    // Select All checkbox
    const selectAllLabel = actions.createEl('label', {
      cls: 'inbox-processor-select-all',
    });
    const selectAllCb = selectAllLabel.createEl('input', {
      type: 'checkbox',
    }) as HTMLInputElement;
    selectAllLabel.createSpan({ text: 'Select All' });
    selectAllCb.checked =
      this.notes.length > 0 &&
      this.selectedPaths.size === this.notes.length;
    selectAllCb.addEventListener('change', () => {
      if (selectAllCb.checked) {
        this.notes.forEach((n) => this.selectedPaths.add(n.path));
      } else {
        this.selectedPaths.clear();
      }
      this.render();
    });
  }

  private renderNoteCard(container: HTMLElement, note: InboxNote): void {
    const card = container.createDiv({ cls: 'inbox-processor-card' });
    const isSelected = this.selectedPaths.has(note.path);
    if (isSelected) card.addClass('is-selected');

    // Top row: checkbox + title
    const topRow = card.createDiv({ cls: 'inbox-processor-card-top' });

    const checkbox = topRow.createEl('input', {
      type: 'checkbox',
    }) as HTMLInputElement;
    checkbox.checked = isSelected;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        this.selectedPaths.add(note.path);
      } else {
        this.selectedPaths.delete(note.path);
      }
      this.render();
    });

    const titleEl = topRow.createEl('span', {
      text: note.basename,
      cls: 'inbox-processor-card-title',
    });
    titleEl.addEventListener('click', () => {
      // Open note in Obsidian
      const file = this.app.vault.getAbstractFileByPath(note.path);
      if (file) {
        this.app.workspace.getLeaf(false).openFile(file as any);
      }
    });

    // Recommendations
    if (note.analysis?.recommendations && note.analysis.recommendations.length > 0) {
      const recsEl = card.createDiv({ cls: 'inbox-processor-recs' });
      for (const rec of note.analysis.recommendations) {
        const recBtn = recsEl.createEl('button', {
          cls: 'inbox-processor-rec-btn',
          attr: { 'aria-label': `Move to ${rec.folder}` },
        });
        const icon = recBtn.createSpan({ cls: 'inbox-processor-rec-icon' });
        setIcon(icon, 'folder-input');
        recBtn.createSpan({ text: rec.folder, cls: 'inbox-processor-rec-text' });

        // Confidence badge
        const confCls =
          rec.confidence >= 0.8
            ? 'high'
            : rec.confidence >= 0.6
              ? 'medium'
              : 'low';
        recBtn.createSpan({
          text: rec.matchedRule,
          cls: `inbox-processor-rec-badge ${confCls}`,
        });

        recBtn.addEventListener('click', async () => {
          await this.moveSingleNote(note, rec.folder);
        });
      }
    }

    // Manual folder picker
    const manualBtn = card.createEl('button', {
      cls: 'inbox-processor-manual-btn',
      text: 'Choose folder...',
    });
    manualBtn.addEventListener('click', () => {
      const modal = new FolderPickerModal(
        this.app,
        this.plugin.repository.getFolderList(),
        async (folder) => {
          await this.moveSingleNote(note, folder);
        },
      );
      modal.open();
    });

    // Warnings
    if (this.plugin.settings.showWarnings && note.analysis) {
      const warnings: string[] = [];
      if (!note.analysis.hasSummaryCallout) {
        warnings.push('Summary callout missing');
      }
      if (!note.analysis.checklist.hasType) {
        warnings.push('type missing');
      }
      if (!note.analysis.checklist.hasStatus) {
        warnings.push('status missing');
      }

      if (warnings.length > 0) {
        const warningEl = card.createDiv({ cls: 'inbox-processor-warnings' });
        const warnIcon = warningEl.createSpan({ cls: 'inbox-processor-warn-icon' });
        setIcon(warnIcon, 'alert-triangle');
        warningEl.createSpan({ text: warnings.join(' | ') });
      }
    }
  }

  private renderActionBar(container: HTMLElement): void {
    const selectedCount = this.selectedPaths.size;
    if (selectedCount === 0) return;

    const bar = container.createDiv({ cls: 'inbox-processor-action-bar' });

    bar.createSpan({
      text: `${selectedCount} selected`,
      cls: 'inbox-processor-selected-count',
    });

    // Batch move with top recommendation
    const batchMoveBtn = bar.createEl('button', {
      cls: 'inbox-processor-batch-btn',
      text: 'Batch Move (recommended)',
    });
    batchMoveBtn.addEventListener('click', () => this.batchMoveRecommended());

    // Batch move with folder picker
    const batchPickBtn = bar.createEl('button', {
      cls: 'inbox-processor-batch-pick-btn',
      text: 'Choose folder...',
    });
    batchPickBtn.addEventListener('click', () => {
      const modal = new FolderPickerModal(
        this.app,
        this.plugin.repository.getFolderList(),
        async (folder) => {
          await this.batchMoveToFolder(folder);
        },
      );
      modal.open();
    });
  }

  private async moveSingleNote(
    note: InboxNote,
    targetFolder: string,
  ): Promise<void> {
    try {
      const moveUseCase = new MoveNoteUseCase(
        this.plugin.repository,
        this.plugin.auditLogger,
      );
      await moveUseCase.execute(
        note,
        targetFolder,
        this.plugin.settings.autoFixFrontmatter,
      );
      new Notice(`Moved ${note.basename} → ${targetFolder}`);
      this.selectedPaths.delete(note.path);
      await this.refresh();
    } catch (error) {
      console.error('Inbox Processor: move failed', error);
      new Notice(`Failed to move ${note.basename}`);
    }
  }

  private async batchMoveRecommended(): Promise<void> {
    const selectedNotes = this.notes.filter((n) =>
      this.selectedPaths.has(n.path),
    );
    const moves: Array<{ note: InboxNote; targetFolder: string }> = [];

    for (const note of selectedNotes) {
      const topRec = note.analysis?.recommendations?.[0];
      if (topRec) {
        moves.push({ note, targetFolder: topRec.folder });
      }
    }

    if (moves.length === 0) {
      new Notice('No recommendations available for selected notes');
      return;
    }

    // Show confirmation modal
    const modal = new BatchConfirmModal(this.app, moves, async () => {
      await this.executeBatchMove(moves);
    });
    modal.open();
  }

  private async batchMoveToFolder(folder: string): Promise<void> {
    const selectedNotes = this.notes.filter((n) =>
      this.selectedPaths.has(n.path),
    );
    const moves = selectedNotes.map((note) => ({
      note,
      targetFolder: folder,
    }));

    const modal = new BatchConfirmModal(this.app, moves, async () => {
      await this.executeBatchMove(moves);
    });
    modal.open();
  }

  private async executeBatchMove(
    moves: Array<{ note: InboxNote; targetFolder: string }>,
  ): Promise<void> {
    try {
      const batchMoveUseCase = new BatchMoveUseCase(
        this.plugin.repository,
        this.plugin.auditLogger,
      );
      await batchMoveUseCase.execute(
        moves,
        this.plugin.settings.autoFixFrontmatter,
      );
      new Notice(`Moved ${moves.length} notes`);
      this.selectedPaths.clear();
      await this.refresh();
    } catch (error) {
      console.error('Inbox Processor: batch move failed', error);
      new Notice('Batch move failed');
    }
  }
}
