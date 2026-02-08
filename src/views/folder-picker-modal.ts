import { App, FuzzySuggestModal } from 'obsidian';

export class FolderPickerModal extends FuzzySuggestModal<string> {
  private folders: string[];
  private onChoose: (folder: string) => void;

  constructor(
    app: App,
    folders: string[],
    onChoose: (folder: string) => void,
  ) {
    super(app);
    this.folders = folders;
    this.onChoose = onChoose;
    this.setPlaceholder('Type to search folders...');
  }

  getItems(): string[] {
    return this.folders;
  }

  getItemText(item: string): string {
    return item;
  }

  onChooseItem(item: string): void {
    this.onChoose(item);
  }
}
