import { App, PluginSettingTab, Setting } from 'obsidian';
import type InboxProcessorPlugin from '../../main';

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
  }
}
