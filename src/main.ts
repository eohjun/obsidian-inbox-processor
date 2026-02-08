import { Plugin } from 'obsidian';
import type { InboxProcessorSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import type { IInboxRepository } from './core/domain/interfaces/inbox-repository';
import type { IFolderClassifier } from './core/domain/interfaces/folder-classifier';
import type { IAuditLogger } from './core/application/services/audit-logger';
import { ObsidianInboxRepository } from './adapters/obsidian-inbox-repository';
import { RuleBasedFolderClassifier } from './adapters/rule-based-folder-classifier';
import { ObsidianAuditLogger } from './adapters/obsidian-audit-logger';
import { InboxProcessorView, VIEW_TYPE_INBOX } from './views/inbox-view';
import { InboxProcessorSettingTab } from './views/settings/inbox-processor-setting-tab';

export default class InboxProcessorPlugin extends Plugin {
  settings!: InboxProcessorSettings;
  repository!: IInboxRepository;
  classifier!: IFolderClassifier;
  auditLogger!: IAuditLogger;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize adapters
    this.repository = new ObsidianInboxRepository(
      this.app,
      this.settings.inboxFolder,
    );
    this.classifier = new RuleBasedFolderClassifier(
      this.app,
      this.settings.maxRecommendations,
    );
    this.auditLogger = new ObsidianAuditLogger(this.app);

    // Register sidebar view
    this.registerView(VIEW_TYPE_INBOX, (leaf) =>
      new InboxProcessorView(leaf, this),
    );

    // Command: open inbox processor
    this.addCommand({
      id: 'open-inbox-processor',
      name: 'Open Inbox Processor',
      callback: () => this.activateView(),
    });

    // Ribbon icon
    this.addRibbonIcon('inbox', 'Inbox Processor', () =>
      this.activateView(),
    );

    // Settings tab
    this.addSettingTab(new InboxProcessorSettingTab(this.app, this));
  }

  async onunload(): Promise<void> {
    // Null cleanup to prevent memory leaks
    (this as any).repository = null;
    (this as any).classifier = null;
    (this as any).auditLogger = null;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // Re-initialize adapters with updated settings
    this.repository = new ObsidianInboxRepository(
      this.app,
      this.settings.inboxFolder,
    );
    this.classifier = new RuleBasedFolderClassifier(
      this.app,
      this.settings.maxRecommendations,
    );
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_INBOX)[0];
    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (!rightLeaf) return;
      leaf = rightLeaf;
      await leaf.setViewState({ type: VIEW_TYPE_INBOX, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}
