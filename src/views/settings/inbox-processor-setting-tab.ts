import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type InboxProcessorPlugin from '../../main';
import type { AIProviderType } from '../../adapters/llm/base-provider';
import { AI_PROVIDERS } from '../../adapters/llm/base-provider';
import { getModelsByProvider } from '../../core/domain/constants/model-configs';

export class InboxProcessorSettingTab extends PluginSettingTab {
  plugin: InboxProcessorPlugin;

  constructor(app: App, plugin: InboxProcessorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Inbox Processor Settings' });

    // ── General Settings ──
    containerEl.createEl('h3', { text: 'General' });

    new Setting(containerEl)
      .setName('Inbox folder')
      .setDesc('Folder to scan for inbox notes')
      .addText((text) =>
        text
          .setPlaceholder('00_Inbox')
          .setValue(this.plugin.settings.inboxFolder)
          .onChange(async (value) => {
            this.plugin.settings.inboxFolder = value || '00_Inbox';
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Auto-analyze')
      .setDesc('Automatically analyze notes when inbox view opens')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoAnalyze)
          .onChange(async (value) => {
            this.plugin.settings.autoAnalyze = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Auto-fix frontmatter')
      .setDesc(
        'Automatically set type/status in frontmatter when moving notes',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoFixFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.autoFixFrontmatter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Show warnings')
      .setDesc(
        'Show warning badges for missing summary callout, type, or status',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showWarnings)
          .onChange(async (value) => {
            this.plugin.settings.showWarnings = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Max recommendations')
      .setDesc('Maximum number of folder recommendations per note (1-5)')
      .addSlider((slider) =>
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.maxRecommendations)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxRecommendations = value;
            await this.plugin.saveSettings();
          }),
      );

    // ── AI Classification Settings ──
    containerEl.createEl('h3', { text: 'AI Classification' });

    new Setting(containerEl)
      .setName('Classification mode')
      .setDesc(
        'Rule Only: keywords only. Hybrid: rules first, LLM fallback. LLM Only: always use AI.',
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption('rule', 'Rule Only')
          .addOption('hybrid', 'Hybrid (Recommended)')
          .addOption('llm', 'LLM Only')
          .setValue(this.plugin.settings.ai.classificationMode)
          .onChange(async (value) => {
            this.plugin.settings.ai.classificationMode = value as 'rule' | 'hybrid' | 'llm';
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    // Only show AI settings if mode uses LLM
    if (this.plugin.settings.ai.classificationMode !== 'rule') {
      this.renderAISettings(containerEl);
    }
  }

  private renderAISettings(containerEl: HTMLElement): void {
    const ai = this.plugin.settings.ai;

    new Setting(containerEl)
      .setName('AI provider')
      .setDesc('Select the LLM provider for classification')
      .addDropdown((dropdown) => {
        for (const [key, config] of Object.entries(AI_PROVIDERS)) {
          dropdown.addOption(key, config.displayName);
        }
        dropdown.setValue(ai.provider).onChange(async (value) => {
          ai.provider = value as AIProviderType;
          ai.model = '';
          await this.plugin.saveSettings();
          this.display();
        });
      });

    // API Key
    new Setting(containerEl)
      .setName('API key')
      .setDesc(`API key for ${AI_PROVIDERS[ai.provider].displayName}`)
      .addText((text) => {
        text.inputEl.type = 'password';
        text.inputEl.style.width = '300px';
        text
          .setPlaceholder('Enter API key...')
          .setValue(ai.apiKeys[ai.provider] ?? '')
          .onChange(async (value) => {
            if (value.trim()) {
              ai.apiKeys[ai.provider] = value.trim();
            } else {
              delete ai.apiKeys[ai.provider];
            }
            await this.plugin.saveSettings();
          });
      })
      .addButton((btn) =>
        btn.setButtonText('Test').onClick(async () => {
          if (!ai.apiKeys[ai.provider]) {
            new Notice('No API key entered');
            return;
          }
          btn.setButtonText('Testing...');
          btn.setDisabled(true);
          try {
            const isValid = await this.plugin.aiService?.testCurrentApiKey();
            new Notice(isValid ? 'API key is valid!' : 'API key is invalid');
          } catch {
            new Notice('API key test failed');
          } finally {
            btn.setButtonText('Test');
            btn.setDisabled(false);
          }
        }),
      );

    // Model selection
    const providerModels = getModelsByProvider(ai.provider);
    if (providerModels.length > 0) {
      new Setting(containerEl)
        .setName('Model')
        .setDesc('Select the model to use (leave empty for provider default)')
        .addDropdown((dropdown) => {
          dropdown.addOption('', `Default (${AI_PROVIDERS[ai.provider].defaultModel})`);
          for (const model of providerModels) {
            const cost = `$${model.inputCostPer1M}/$${model.outputCostPer1M} per 1M tokens`;
            dropdown.addOption(model.id, `${model.displayName} (${cost})`);
          }
          dropdown.setValue(ai.model).onChange(async (value) => {
            ai.model = value;
            await this.plugin.saveSettings();
          });
        });
    }
  }
}
