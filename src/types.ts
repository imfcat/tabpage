export interface Tag {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
    color?: string;
    sortOrder?: number;
}

export interface Shortcut {
    id: string;
    name: string;
    url: string;
    icon?: string;
    ico?: Blob | null;
    isPinned: boolean;
    tagIds?: string[];
    categoryId?: string;
    comment?: string;
}

export interface DockItem {
    id: string;
    name: string;
    url: string;
    icon?: string;
}

export type BgType = 'default' | 'color' | 'gradient' | 'image';
export type BgImgType = 'upload' | 'url' | 'bing';

export type GradientType = 'linear' | 'radial';

export interface GradientConfig {
    type: GradientType;
    angle: number;
    colors: [string, string];
}

export interface AppSettings {
    searchEngine: string;
    timeFormat: string;
    bgType: BgType;
    bgColor: string;
    bgGradient: string;
    gradientConfig: GradientConfig;
    bgImgType: BgImgType;
    bgImgUrl: string;
    bingBgUhd: boolean;
}

export interface BackupBookmarks {
    shortcuts: Omit<Shortcut, 'ico'>[];
    tags: Tag[];
    categories: Category[];
}

export interface BackupFile {
    version: 1;
    exportedAt: string;
    bookmarks?: BackupBookmarks;
    settings?: AppSettings;
}

export interface SearchHistoryItem {
    query: string;
    updatedAt: number;
}

export interface BackupImportResult {
    settingsApplied: boolean;
    shortcutsAdded: number;
    shortcutsUpdated: number;
    shortcutsSkipped: number;
    tagsAdded: number;
    categoriesAdded: number;
}

export interface BrowserBookmarkImportResult {
    shortcutsAdded: number;
    shortcutsSkipped: number;
    tagsAdded: number;
}