import { Plugin } from 'obsidian';

export default class InboxProcessorPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('Loading Inbox Processor Plugin');
  }

  async onunload(): Promise<void> {
    console.log('Unloading Inbox Processor Plugin');
  }
}
