import { Plugin } from 'obsidian';
import type { InboxProcessorSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import type { IInboxRepository } from './core/domain/interfaces/inbox-repository';
import type { IFolderClassifier } from './core/domain/interfaces/folder-classifier';
import type { IAuditLogger } from './core/application/services/audit-logger';
import { AIService } from './core/application/services/ai-service';
import { ObsidianInboxRepository } from './adapters/obsidian-inbox-repository';
import { RuleBasedFolderClassifier } from './adapters/rule-based-folder-classifier';
import { HybridFolderClassifier } from './adapters/llm/hybrid-folder-classifier';
import { ObsidianAuditLogger } from './adapters/obsidian-audit-logger';
import { InboxProcessorView, VIEW_TYPE_INBOX } from './views/inbox-view';
import { InboxProcessorSettingTab } from './views/settings/inbox-processor-setting-tab';

export default class InboxProcessorPlugin extends Plugin {
  settings!: InboxProcessorSettings;
  repository!: IInboxRepository;
  classifier!: IFolderClassifier;
  auditLogger!: IAuditLogger;
  aiService: AIService | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize adapters
    this.repository = new ObsidianInboxRepository(
      this.app,
      this.settings.inboxFolder,
    );
    this.auditLogger = new ObsidianAuditLogger(this.app);

    // Initialize AI service and classifier based on mode
    this.initializeClassifier();

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
    (this as any).repository = null;
    (this as any).classifier = null;
    (this as any).auditLogger = null;
    this.aiService = null;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Ensure nested ai object has all defaults
    this.settings.ai = Object.assign({}, DEFAULT_SETTINGS.ai, this.settings.ai);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // Re-initialize adapters with updated settings
    this.repository = new ObsidianInboxRepository(
      this.app,
      this.settings.inboxFolder,
    );
    this.initializeClassifier();
  }

  private initializeClassifier(): void {
    const ruleClassifier = new RuleBasedFolderClassifier(
      this.app,
      this.settings.maxRecommendations,
    );

    const mode = this.settings.ai.classificationMode;

    if (mode === 'rule') {
      this.classifier = ruleClassifier;
      this.aiService = null;
      return;
    }

    // For hybrid and llm modes, set up AI service
    this.aiService = new AIService(this.settings.ai);

    if (mode === 'hybrid') {
      this.classifier = new HybridFolderClassifier(
        ruleClassifier,
        this.aiService,
        this.repository,
        this.settings.maxRecommendations,
      );
    } else {
      // 'llm' mode: use hybrid with threshold set so LLM always runs
      // by passing a classifier that always returns empty results
      this.classifier = new HybridFolderClassifier(
        { async classify() { return []; } },
        this.aiService,
        this.repository,
        this.settings.maxRecommendations,
      );
    }
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
