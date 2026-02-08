import { App, normalizePath } from 'obsidian';
import type { IAuditLogger, MoveRecord } from '../core/application/services/audit-logger';

export class ObsidianAuditLogger implements IAuditLogger {
  constructor(private app: App) {}

  async logMoves(moves: MoveRecord[]): Promise<void> {
    if (moves.length === 0) return;

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 15) + 'Z';
    const logPath = normalizePath(
      `logs/maintenance/${timestamp}-inbox-processing.md`,
    );

    const lines: string[] = [];
    lines.push(`# ${now.toISOString()} — Inbox Processor`);
    lines.push('');
    lines.push(`- Moved: ${moves.length} notes`);
    lines.push('');
    lines.push('## Move Log');
    lines.push('');

    for (const move of moves) {
      lines.push(`- \`${move.from}\` → \`${move.to}\``);
      if (move.frontmatterUpdated) {
        lines.push('  - Frontmatter updated (type/status)');
      }
    }
    lines.push('');

    // Ensure logs/maintenance/ folder exists
    const folderPath = normalizePath('logs/maintenance');
    try {
      const exists = await this.app.vault.adapter.exists(folderPath);
      if (!exists) {
        await this.app.vault.createFolder(folderPath);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.toLowerCase().includes('already exists')) {
        console.error('Inbox Processor: Failed to create log folder', error);
        return;
      }
    }

    try {
      await this.app.vault.adapter.write(logPath, lines.join('\n'));
    } catch (error) {
      console.error('Inbox Processor: Failed to write audit log', error);
    }
  }
}
