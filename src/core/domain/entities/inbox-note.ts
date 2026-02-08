import type { NoteAnalysis } from '../value-objects/note-analysis';

export interface InboxNote {
  path: string;
  basename: string;
  content: string;
  mtime: number;
  frontmatter: Record<string, any> | null;
  analysis?: NoteAnalysis;
}
