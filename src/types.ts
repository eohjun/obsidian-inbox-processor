export interface InboxProcessorSettings {
  inboxFolder: string;
  autoAnalyze: boolean;
  autoFixFrontmatter: boolean;
  showWarnings: boolean;
  maxRecommendations: number;
}

export const DEFAULT_SETTINGS: InboxProcessorSettings = {
  inboxFolder: '00_Inbox',
  autoAnalyze: true,
  autoFixFrontmatter: true,
  showWarnings: true,
  maxRecommendations: 3,
};
