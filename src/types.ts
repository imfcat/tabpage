export interface Shortcut {
    id: string;
    name: string;
    url: string;
    icon?: string;
    ico?: Blob | null;
    isPinned: boolean;
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