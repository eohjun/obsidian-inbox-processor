export interface MoveRecord {
  from: string;
  to: string;
  frontmatterUpdated: boolean;
}

export interface IAuditLogger {
  logMoves(moves: MoveRecord[]): Promise<void>;
}
