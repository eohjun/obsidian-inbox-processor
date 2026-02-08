import { App, TFile, TFolder, normalizePath } from 'obsidian';
import type { InboxNote } from '../core/domain/entities/inbox-note';
import type { IInboxRepository } from '../core/domain/interfaces/inbox-repository';

export class ObsidianInboxRepository implements IInboxRepository {
  constructor(
    private app: App,
    private inboxFolder: string,
  ) {}

  async getInboxNotes(): Promise<InboxNote[]> {
    const prefix = normalizePath(this.inboxFolder);
    const files = this.app.vault.getMarkdownFiles().filter((f) =>
      f.path.startsWith(prefix + '/'),
    );

    const notes: InboxNote[] = [];
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      const cache = this.app.metadataCache.getFileCache(file);
      notes.push({
        path: file.path,
        basename: file.basename,
        content,
        mtime: file.stat.mtime,
        frontmatter: cache?.frontmatter ?? null,
      });
    }

    // Sort by mtime descending (newest first)
    notes.sort((a, b) => b.mtime - a.mtime);
    return notes;
  }

  async moveNote(note: InboxNote, targetFolder: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(
      normalizePath(note.path),
    );
    if (!(file instanceof TFile)) {
      throw new Error(`File not found: ${note.path}`);
    }

    // Ensure target folder exists
    const targetPath = normalizePath(targetFolder);
    const folder = this.app.vault.getAbstractFileByPath(targetPath);
    if (!(folder instanceof TFolder)) {
      try {
        await this.app.vault.createFolder(targetPath);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.toLowerCase().includes('already exists')) {
          throw error;
        }
      }
    }

    const newPath = normalizePath(`${targetFolder}/${file.name}`);
    // renameFile guarantees wikilink auto-update
    await this.app.fileManager.renameFile(file, newPath);
  }

  async updateFrontmatter(
    note: InboxNote,
    updates: Record<string, any>,
  ): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(
      normalizePath(note.path),
    );
    if (!(file instanceof TFile)) {
      throw new Error(`File not found for frontmatter update: ${note.path}`);
    }

    await this.app.fileManager.processFrontMatter(file, (fm) => {
      for (const [key, value] of Object.entries(updates)) {
        fm[key] = value;
      }
    });
  }

  getFolderList(): string[] {
    const folders: string[] = [];
    const allFiles = this.app.vault.getAllLoadedFiles();
    for (const f of allFiles) {
      if (f instanceof TFolder && f.path !== '/') {
        folders.push(f.path);
      }
    }
    folders.sort();
    return folders;
  }
}
