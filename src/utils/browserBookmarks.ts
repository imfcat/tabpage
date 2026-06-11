export interface BrowserBookmarkEntry {
    name: string;
    url: string;
    icon?: string;
    tagNames: string[];
}

const SKIP_URL_PREFIXES = ['javascript:', 'place:', 'chrome:', 'edge:', 'about:'];

const isImportableUrl = (url: string): boolean => {
    const normalized = url.trim().toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://');
};

const getDirectChild = (parent: Element, tagName: string): Element | null => {
    for (const child of parent.children) {
        if (child.tagName === tagName) return child;
    }
    return null;
};

const walkBookmarkNode = (
    node: Element,
    folderPath: string[],
    results: BrowserBookmarkEntry[],
    createTagsFromFolders: boolean,
): void => {
    for (const child of node.children) {
        if (child.tagName !== 'DT') continue;

        const folder = getDirectChild(child, 'H3');
        const link = getDirectChild(child, 'A');
        const nestedList = getDirectChild(child, 'DL');

        if (folder) {
            const folderName = folder.textContent?.trim() ?? '';
            const isToolbarFolder = folder.getAttribute('PERSONAL_TOOLBAR_FOLDER') === 'true';
            const nextPath = createTagsFromFolders && folderName && !isToolbarFolder
                ? [...folderPath, folderName]
                : folderPath;

            if (nestedList) {
                walkBookmarkNode(nestedList, nextPath, results, createTagsFromFolders);
            }
            continue;
        }

        if (!link) continue;

        const url = link.getAttribute('HREF')?.trim() ?? '';
        if (!url || SKIP_URL_PREFIXES.some((prefix) => url.toLowerCase().startsWith(prefix))) {
            continue;
        }
        if (!isImportableUrl(url)) continue;

        const name = link.textContent?.trim() || url;
        const icon = link.getAttribute('ICON')?.trim() || undefined;

        results.push({
            name,
            url,
            icon,
            tagNames: createTagsFromFolders ? [...folderPath] : [],
        });
    }
};

export const parseBrowserBookmarkHtml = (
    html: string,
    createTagsFromFolders: boolean,
): BrowserBookmarkEntry[] => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rootList = doc.querySelector('DL');
    if (!rootList) {
        throw new Error('无法识别书签文件格式');
    }

    const results: BrowserBookmarkEntry[] = [];
    walkBookmarkNode(rootList, [], results, createTagsFromFolders);

    if (results.length === 0) {
        throw new Error('未找到可导入的书签链接');
    }

    return results;
};

export const readBrowserBookmarkFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file);
    });
};
