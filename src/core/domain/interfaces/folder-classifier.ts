import type { InboxNote } from '../entities/inbox-note';
import type { FolderRecommendation } from '../value-objects/folder-recommendation';

export interface IFolderClassifier {
  classify(note: InboxNote): Promise<FolderRecommendation[]>;
}
