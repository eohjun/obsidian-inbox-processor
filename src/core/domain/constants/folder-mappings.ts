/**
 * Folder mapping rules ported from inbox-helper.ts L232~357.
 * Priority: Projects > Areas > Resources > Zettelkasten
 */

export interface FolderMapping {
  pattern: RegExp;
  folder: string;
  label: string;
}

export const PROJECT_MAPPINGS: FolderMapping[] = [
  {
    pattern: /lms|노션|notion|학습\s*관리/i,
    folder: '01_Projects/2025_LMS 구축_notion/research',
    label: 'LMS 프로젝트',
  },
  {
    pattern: /second\s*brain|세컨드\s*브레인|옵시디언|obsidian|pkm|지식\s*관리/i,
    folder: '01_Projects/2025_Second Brain 구축_obsidian/research',
    label: 'Second Brain',
  },
  {
    pattern: /n8n|자동화|automation|워크플로우|workflow/i,
    folder: '01_Projects/2025_업무 자동화 전문가_n8n/research',
    label: '업무 자동화',
  },
];

export const AREA_MAPPINGS: FolderMapping[] = [
  {
    pattern: /ai|클로드|claude|skill|스킬|mcp|llm|gpt|rag|graphrag|온톨로지|ontology/i,
    folder: '02_Areas/AI_Technology',
    label: 'AI Technology',
  },
  {
    pattern: /건강|health|운동|exercise|식단|diet|수면|sleep|웰빙|wellness/i,
    folder: '02_Areas/Health',
    label: 'Health',
  },
  {
    pattern: /재정|finance|투자|investment|예산|budget|저축|saving/i,
    folder: '02_Areas/Finance',
    label: 'Finance',
  },
  {
    pattern: /학습|learning|교육|education|강의|course|스터디|study/i,
    folder: '02_Areas/Learning',
    label: 'Learning',
  },
];

export const RESOURCE_MAPPINGS: FolderMapping[] = [
  {
    pattern: /youtube|yt\s*-|유튜브|영상|video/i,
    folder: '03_Resources/Media/YouTube',
    label: 'YouTube',
  },
  {
    pattern: /책|book|독서|reading|저자|author/i,
    folder: '03_Resources/Literature_Notes',
    label: 'Literature',
  },
  {
    pattern: /기사|article|뉴스|news|블로그|blog/i,
    folder: '03_Resources/Articles',
    label: 'Articles',
  },
  {
    pattern: /팟캐스트|podcast|라디오|audio/i,
    folder: '03_Resources/Media/Podcasts',
    label: 'Podcasts',
  },
];

export const DEFAULT_FALLBACKS = ['03_Resources/Literature_Notes', '04_Zettelkasten'];

/** Confidence levels by mapping tier */
export const CONFIDENCE = {
  PROJECT: 0.9,
  AREA: 0.7,
  RESOURCE: 0.6,
  FALLBACK: 0.3,
} as const;
