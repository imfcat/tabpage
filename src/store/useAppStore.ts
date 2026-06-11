import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    Shortcut,
    Tag,
    Category,
    BgType,
    BgImgType,
    GradientConfig,
    BackupFile,
    BackupImportResult,
    AppSettings,
    SearchHistoryItem,
    BrowserBookmarkImportResult,
} from '@/types';
import { BACKUP_FILE_VERSION } from '@/utils/backup';
import type { BrowserBookmarkEntry } from '@/utils/browserBookmarks';
import { getBingWallpaperUrl } from '@/utils/bingWallpaper';

interface AppState {
    _hasHydrated: boolean;
    setHydrated: (hydrated: boolean) => void;

    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;

    // IndexedDB
    shortcuts: Shortcut[];
    tags: Tag[];
    categories: Category[];
    loadShortcuts: () => Promise<void>;
    loadTags: () => Promise<void>;
    loadCategories: () => Promise<void>;
    addShortcut: (item: Omit<Shortcut, 'id'>) => Promise<void>;
    updateShortcut: (id: string, updates: Partial<Omit<Shortcut, 'id'>>) => Promise<void>;
    deleteShortcut: (id: string) => Promise<void>;
    toggleShortcutPin: (id: string) => Promise<void>;
    resolveOrCreateTags: (names: string[]) => Promise<string[]>;
    resolveOrCreateCategory: (name: string) => Promise<string | undefined>;
    addTag: (name: string) => Promise<Tag>;
    updateTag: (id: string, name: string) => Promise<void>;
    deleteTag: (id: string) => Promise<void>;
    addCategory: (name: string) => Promise<Category>;
    updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'sortOrder'>>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>; 

    // 配置localStorage
    searchEngine: string;
    setSearchEngine: (engine: string) => void;

    searchHistory: SearchHistoryItem[];
    addSearchHistory: (query: string) => void;
    removeSearchHistory: (query: string) => void;

    timeFormat: string;
    setTimeFormat: (format: string) => void;

    bgType: BgType;
    setBgType: (type: BgType) => void;

    bgColor: string;
    setBgColor: (color: string) => void;

    bgGradient: string;
    setBgGradient: (gradient: string) => void;

    gradientConfig: GradientConfig;
    setGradientConfig: (config: Partial<GradientConfig>) => void;

    bgImgType: BgImgType;
    setBgImgType: (type: BgImgType) => void;

    bgImgUrl: string;
    setBgImgUrl: (url: string) => void;

    bingBgUhd: boolean;
    setBingBgUhd: (uhd: boolean) => void;

    bgBlobUrl: string;
    bgBlobUrlOverlay: string;
    loadBgImage: () => Promise<void>;
    completeBgTransition: () => void;

    buildBackup: (options: { includeBookmarks: boolean; includeSettings: boolean }) => BackupFile;
    importBackup: (data: BackupFile) => Promise<BackupImportResult>;
    importBrowserBookmarks: (entries: BrowserBookmarkEntry[]) => Promise<BrowserBookmarkImportResult>;
}

const MAX_SEARCH_HISTORY = 20;

const SEED_SHORTCUTS: Shortcut[] = [
    { id: '1', name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico', isPinned: true },
    { id: '2', name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon-dark.svg', isPinned: true },
];

const DB_NAME = 'TabPage_AppDB';
const SHORTCUTS_STORE = 'shortcuts_store';
const TAGS_STORE = 'tags_store';
const CATEGORIES_STORE = 'categories_store';
const CACHE_STORE = 'bg_cache_store';
const DB_VERSION = 2;
const BING_BG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface BgCacheRecord {
    id: string;
    blob: Blob;
    date: string;
    targetUrl: string;
    cachedAt: number;
}

const revokeBlobUrl = (url: string) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
};

// 建立数据库连接
const getIDBConnection = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(SHORTCUTS_STORE)) {
                db.createObjectStore(SHORTCUTS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(TAGS_STORE)) {
                db.createObjectStore(TAGS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
                db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(CACHE_STORE)) {
                db.createObjectStore(CACHE_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const idbUpsertShortcut = async (item: Shortcut): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SHORTCUTS_STORE, 'readwrite');
        const store = tx.objectStore(SHORTCUTS_STORE);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbDeleteShortcut = async (id: string): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SHORTCUTS_STORE, 'readwrite');
        const store = tx.objectStore(SHORTCUTS_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbGetBgCache = async (): Promise<BgCacheRecord | null> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE, 'readonly');
        const store = tx.objectStore(CACHE_STORE);
        const request = store.get('current_bg');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

const idbSetBgCache = async (blob: Blob, date: string, targetUrl: string): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE, 'readwrite');
        const store = tx.objectStore(CACHE_STORE);
        const request = store.put({ id: 'current_bg', blob, date, targetUrl, cachedAt: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbGetAllShortcuts = async (): Promise<Shortcut[]> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SHORTCUTS_STORE, 'readonly');
        const store = tx.objectStore(SHORTCUTS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

const idbUpsertTag = async (item: Tag): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TAGS_STORE, 'readwrite');
        const store = tx.objectStore(TAGS_STORE);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbDeleteTag = async (id: string): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TAGS_STORE, 'readwrite');
        const store = tx.objectStore(TAGS_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbGetAllTags = async (): Promise<Tag[]> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TAGS_STORE, 'readonly');
        const store = tx.objectStore(TAGS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

const idbUpsertCategory = async (item: Category): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CATEGORIES_STORE, 'readwrite');
        const store = tx.objectStore(CATEGORIES_STORE);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbDeleteCategory = async (id: string): Promise<void> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CATEGORIES_STORE, 'readwrite');
        const store = tx.objectStore(CATEGORIES_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbGetAllCategories = async (): Promise<Category[]> => {
    const db = await getIDBConnection();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CATEGORIES_STORE, 'readonly');
        const store = tx.objectStore(CATEGORIES_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            shortcuts: [],
            tags: [],
            categories: [],
            isSettingsOpen: false,
            searchEngine: 'bing',
            searchHistory: [],
            timeFormat: '24',
            bgType: 'default',
            bgColor: '#14161d',
            bgGradient: 'linear-gradient(135deg, #232528 0%, #0f111a 100%)',
            bgImgType: 'bing',
            bgImgUrl: '',
            bingBgUhd: false,
            bgBlobUrl: '',
            bgBlobUrlOverlay: '',
            gradientConfig: {
                type: 'linear',
                angle: 135,
                colors: ['#232528', '#0f111a'],
            },

            setHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
            setSettingsOpen: (open) => set({ isSettingsOpen: open }),

            loadShortcuts: async () => {
                try {
                    let items = await idbGetAllShortcuts();
                    if (items.length === 0) {
                        for (const seed of SEED_SHORTCUTS) {
                            await idbUpsertShortcut(seed);
                        }
                        items = SEED_SHORTCUTS;
                    }
                    set({ shortcuts: items });
                } catch (err) {
                    console.error('初始化快捷方式库失败:', err);
                }
            },

            loadTags: async () => {
                try {
                    const items = await idbGetAllTags();
                    set({ tags: items });
                } catch (err) {
                    console.error('初始化标签库失败:', err);
                }
            },

            loadCategories: async () => {
                try {
                    const items = await idbGetAllCategories();
                    set({ categories: items });
                } catch (err) {
                    console.error('初始化分类库失败:', err);
                }
            },

            resolveOrCreateTags: async (names) => {
                const normalized = [...new Set(
                    names.map((n) => n.trim()).filter(Boolean),
                )];
                if (normalized.length === 0) return [];

                const { tags } = get();
                const tagIds: string[] = [];
                const newTags: Tag[] = [];

                for (const name of normalized) {
                    const existing = tags.find(
                        (t) => t.name.toLowerCase() === name.toLowerCase(),
                    );
                    if (existing) {
                        tagIds.push(existing.id);
                    } else {
                        const newTag: Tag = { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), name };
                        await idbUpsertTag(newTag);
                        tagIds.push(newTag.id);
                        newTags.push(newTag);
                    }
                }

                if (newTags.length > 0) {
                    set((state) => ({ tags: [...state.tags, ...newTags] }));
                }
                return tagIds;
            },

            resolveOrCreateCategory: async (name) => {
                const trimmed = name.trim();
                if (!trimmed) return undefined;

                const { categories } = get();
                const existing = categories.find(
                    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
                );
                if (existing) return existing.id;

                const newCategory: Category = {
                    id: Date.now().toString(),
                    name: trimmed,
                };
                await idbUpsertCategory(newCategory);
                set((state) => ({ categories: [...state.categories, newCategory] }));
                return newCategory.id;
            },

            addTag: async (name) => {
                const trimmed = name.trim();
                if (!trimmed) throw new Error('标签名称不能为空');

                const existing = get().tags.find(
                    (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
                );
                if (existing) return existing;

                const newTag: Tag = { id: Date.now().toString(), name: trimmed };
                await idbUpsertTag(newTag);
                set((state) => ({ tags: [...state.tags, newTag] }));
                return newTag;
            },

            updateTag: async (id, name) => {
                const trimmed = name.trim();
                if (!trimmed) return;

                const target = get().tags.find((t) => t.id === id);
                if (!target) return;

                const updated = { ...target, name: trimmed };
                await idbUpsertTag(updated);
                set((state) => ({
                    tags: state.tags.map((t) => (t.id === id ? updated : t)),
                }));
            },

            deleteTag: async (id) => {
                await idbDeleteTag(id);
                const updatedShortcuts: Shortcut[] = [];
                for (const shortcut of get().shortcuts) {
                    if (shortcut.tagIds?.includes(id)) {
                        const updated = {
                            ...shortcut,
                            tagIds: shortcut.tagIds.filter((tid) => tid !== id),
                        };
                        await idbUpsertShortcut(updated);
                        updatedShortcuts.push(updated);
                    } else {
                        updatedShortcuts.push(shortcut);
                    }
                }
                set((state) => ({
                    tags: state.tags.filter((t) => t.id !== id),
                    shortcuts: updatedShortcuts,
                }));
            },

            addCategory: async (name) => {
                const trimmed = name.trim();
                if (!trimmed) throw new Error('分类名称不能为空');

                const existing = get().categories.find(
                    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
                );
                if (existing) return existing;

                const newCategory: Category = { id: Date.now().toString(), name: trimmed };
                await idbUpsertCategory(newCategory);
                set((state) => ({ categories: [...state.categories, newCategory] }));
                return newCategory;
            },

            updateCategory: async (id, updates) => {
                const target = get().categories.find((c) => c.id === id);
                if (!target) return;

                const updated = { ...target, ...updates };
                await idbUpsertCategory(updated);
                set((state) => ({
                    categories: state.categories.map((c) => (c.id === id ? updated : c)),
                }));
            },

            deleteCategory: async (id) => {
                await idbDeleteCategory(id);
                const updatedShortcuts: Shortcut[] = [];
                for (const shortcut of get().shortcuts) {
                    if (shortcut.categoryId === id) {
                        const updated = { ...shortcut, categoryId: undefined };
                        await idbUpsertShortcut(updated);
                        updatedShortcuts.push(updated);
                    } else {
                        updatedShortcuts.push(shortcut);
                    }
                }
                set((state) => ({
                    categories: state.categories.filter((c) => c.id !== id),
                    shortcuts: updatedShortcuts,
                }));
            },

            loadBgImage: async () => {
                const { bgType, bgImgType, bgImgUrl, bingBgUhd } = get();

                const clearBgUrls = () => {
                    const { bgBlobUrl, bgBlobUrlOverlay } = get();
                    revokeBlobUrl(bgBlobUrl);
                    revokeBlobUrl(bgBlobUrlOverlay);
                    set({ bgBlobUrl: '', bgBlobUrlOverlay: '' });
                };

                if (bgType !== 'image') {
                    clearBgUrls();
                    return;
                }

                const targetUrl = bgImgType === 'bing'
                    ? getBingWallpaperUrl(bingBgUhd)
                    : bgImgUrl;

                if (!targetUrl) {
                    clearBgUrls();
                    return;
                }

                const todayStr = new Date().toDateString();

                const isBingCacheExpired = (cached: BgCacheRecord) =>
                    cached.date !== todayStr
                    || Date.now() - (cached.cachedAt ?? 0) >= BING_BG_CACHE_TTL_MS;

                try {
                    const cached = await idbGetBgCache();
                    let hasStaleCache = false;

                    if (cached && cached.targetUrl === targetUrl) {
                        const staleUrl = URL.createObjectURL(cached.blob);
                        const { bgBlobUrl, bgBlobUrlOverlay } = get();
                        revokeBlobUrl(bgBlobUrl);
                        revokeBlobUrl(bgBlobUrlOverlay);
                        set({ bgBlobUrl: staleUrl, bgBlobUrlOverlay: '' });

                        const cacheValid = bgImgType !== 'bing' || !isBingCacheExpired(cached);
                        if (cacheValid) return;

                        hasStaleCache = true;
                    }

                    const response = await fetch(targetUrl);
                    if (!response.ok) throw new Error('Network response was not ok');
                    const freshBlob = await response.blob();

                    await idbSetBgCache(freshBlob, todayStr, targetUrl);

                    const freshUrl = URL.createObjectURL(freshBlob);

                    if (hasStaleCache) {
                        set({ bgBlobUrlOverlay: freshUrl });
                    } else {
                        const { bgBlobUrl, bgBlobUrlOverlay } = get();
                        revokeBlobUrl(bgBlobUrl);
                        revokeBlobUrl(bgBlobUrlOverlay);
                        set({ bgBlobUrl: freshUrl, bgBlobUrlOverlay: '' });
                    }
                } catch (err) {
                    console.error('Cache failed:', err);
                    if (!get().bgBlobUrl) {
                        set({ bgBlobUrl: targetUrl, bgBlobUrlOverlay: '' });
                    }
                }
            },

            completeBgTransition: () => {
                const { bgBlobUrl, bgBlobUrlOverlay } = get();
                if (!bgBlobUrlOverlay) return;
                revokeBlobUrl(bgBlobUrl);
                set({ bgBlobUrl: bgBlobUrlOverlay, bgBlobUrlOverlay: '' });
            },

            addShortcut: async (item) => {
                const newItem: Shortcut = { id: Date.now().toString(), ...item };
                try {
                    await idbUpsertShortcut(newItem);
                    set((state) => ({ shortcuts: [...state.shortcuts, newItem] }));
                } catch (err) {
                    console.error('添加快捷方式失败:', err);
                }
            },

            updateShortcut: async (id, updates) => {
                const target = get().shortcuts.find((item) => item.id === id);
                if (!target) return;

                const updated: Shortcut = { ...target, ...updates };
                try {
                    await idbUpsertShortcut(updated);
                    set((state) => ({
                        shortcuts: state.shortcuts.map((item) => (item.id === id ? updated : item)),
                    }));
                } catch (err) {
                    console.error('更新快捷方式失败:', err);
                }
            },

            deleteShortcut: async (id) => {
                try {
                    await idbDeleteShortcut(id);
                    set((state) => ({ shortcuts: state.shortcuts.filter((item) => item.id !== id) }));
                } catch (err) {
                    console.error('删除快捷方式失败:', err);
                }
            },

            toggleShortcutPin: async (id) => {
                const target = get().shortcuts.find((item) => item.id === id);
                if (!target) return;

                const updated = { ...target, isPinned: !target.isPinned };
                try {
                    await idbUpsertShortcut(updated);
                    set((state) => ({
                        shortcuts: state.shortcuts.map((item) => item.id === id ? updated : item),
                    }));
                } catch (err) {
                    console.error('修改快捷方式置顶状态失败:', err);
                }
            },

            setSearchEngine: (engine) => set({ searchEngine: engine }),

            addSearchHistory: (query) => {
                const trimmed = query.trim();
                if (!trimmed) return;
                const lower = trimmed.toLowerCase();
                set((state) => {
                    const filtered = state.searchHistory.filter(
                        (item) => item.query.toLowerCase() !== lower,
                    );
                    return {
                        searchHistory: [
                            { query: trimmed, updatedAt: Date.now() },
                            ...filtered,
                        ].slice(0, MAX_SEARCH_HISTORY),
                    };
                });
            },

            removeSearchHistory: (query) => {
                const lower = query.toLowerCase();
                set((state) => ({
                    searchHistory: state.searchHistory.filter(
                        (item) => item.query.toLowerCase() !== lower,
                    ),
                }));
            },
            setTimeFormat: (format) => set({ timeFormat: format }),
            
            setBgType: (type) => {
                set({ bgType: type });
                get().loadBgImage();
            },
            setBgColor: (color) => set({ bgColor: color }),
            setBgGradient: (gradient) => set({ bgGradient: gradient }),
            setGradientConfig: (config) => set((state) => {
                const newConfig = { ...state.gradientConfig, ...config };
                const { type, angle, colors } = newConfig;
                const bgGradient = type === 'linear' 
                    ? `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 100%)`
                    : `radial-gradient(circle at center, ${colors[0]} 0%, ${colors[1]} 100%)`;
                
                return { gradientConfig: newConfig, bgGradient };
            }),
            setBgImgType: (type) => {
                set({ bgImgType: type });
                get().loadBgImage();
            },
            setBgImgUrl: (url) => {
                set({ bgImgUrl: url });
                get().loadBgImage();
            },
            setBingBgUhd: (uhd) => {
                set({ bingBgUhd: uhd });
                get().loadBgImage();
            },

            buildBackup: ({ includeBookmarks, includeSettings }) => {
                const state = get();
                const backup: BackupFile = {
                    version: BACKUP_FILE_VERSION,
                    exportedAt: new Date().toISOString(),
                };

                if (includeBookmarks) {
                    backup.bookmarks = {
                        shortcuts: state.shortcuts.map(({ ico: _ico, ...rest }) => rest),
                        tags: state.tags,
                        categories: state.categories,
                    };
                }

                if (includeSettings) {
                    backup.settings = {
                        searchEngine: state.searchEngine,
                        timeFormat: state.timeFormat,
                        bgType: state.bgType,
                        bgColor: state.bgColor,
                        bgGradient: state.bgGradient,
                        gradientConfig: state.gradientConfig,
                        bgImgType: state.bgImgType,
                        bgImgUrl: state.bgImgUrl,
                        bingBgUhd: state.bingBgUhd,
                    };
                }

                return backup;
            },

            importBackup: async (data) => {
                const result: BackupImportResult = {
                    settingsApplied: false,
                    shortcutsAdded: 0,
                    shortcutsUpdated: 0,
                    shortcutsSkipped: 0,
                    tagsAdded: 0,
                    categoriesAdded: 0,
                };

                if (data.settings) {
                    const settings: AppSettings = data.settings;
                    set({
                        searchEngine: settings.searchEngine,
                        timeFormat: settings.timeFormat,
                        bgType: settings.bgType,
                        bgColor: settings.bgColor,
                        bgGradient: settings.bgGradient,
                        gradientConfig: settings.gradientConfig,
                        bgImgType: settings.bgImgType,
                        bgImgUrl: settings.bgImgUrl,
                        bingBgUhd: settings.bingBgUhd ?? false,
                    });
                    await get().loadBgImage();
                    result.settingsApplied = true;
                }

                if (!data.bookmarks) {
                    return result;
                }

                const { shortcuts, tags, categories } = data.bookmarks;
                let currentTags = [...get().tags];
                let currentCategories = [...get().categories];
                let currentShortcuts = [...get().shortcuts];

                const tagIdMap = new Map<string, string>();
                for (const tag of tags) {
                    const existingByName = currentTags.find(
                        (item) => item.name.toLowerCase() === tag.name.toLowerCase(),
                    );
                    if (existingByName) {
                        tagIdMap.set(tag.id, existingByName.id);
                        continue;
                    }

                    const idTaken = currentTags.some((item) => item.id === tag.id);
                    const newTag: Tag = idTaken
                        ? { ...tag, id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}` }
                        : tag;
                    await idbUpsertTag(newTag);
                    tagIdMap.set(tag.id, newTag.id);
                    currentTags.push(newTag);
                    result.tagsAdded += 1;
                }

                const categoryIdMap = new Map<string, string>();
                for (const category of categories) {
                    const existingByName = currentCategories.find(
                        (item) => item.name.toLowerCase() === category.name.toLowerCase(),
                    );
                    if (existingByName) {
                        categoryIdMap.set(category.id, existingByName.id);
                        continue;
                    }

                    const idTaken = currentCategories.some((item) => item.id === category.id);
                    const newCategory: Category = idTaken
                        ? { ...category, id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}` }
                        : category;
                    await idbUpsertCategory(newCategory);
                    categoryIdMap.set(category.id, newCategory.id);
                    currentCategories.push(newCategory);
                    result.categoriesAdded += 1;
                }

                for (const shortcut of shortcuts) {
                    const remapped: Shortcut = {
                        ...shortcut,
                        tagIds: shortcut.tagIds?.map((id) => tagIdMap.get(id) ?? id),
                        categoryId: shortcut.categoryId
                            ? categoryIdMap.get(shortcut.categoryId) ?? shortcut.categoryId
                            : undefined,
                    };

                    const existingByUrl = currentShortcuts.find(
                        (item) => item.url.toLowerCase() === remapped.url.toLowerCase(),
                    );
                    const existingById = currentShortcuts.find((item) => item.id === remapped.id);

                    if (existingByUrl && existingByUrl.id !== remapped.id) {
                        result.shortcutsSkipped += 1;
                        continue;
                    }

                    if (existingById) {
                        const updated = { ...existingById, ...remapped, id: existingById.id };
                        await idbUpsertShortcut(updated);
                        currentShortcuts = currentShortcuts.map((item) =>
                            item.id === existingById.id ? updated : item,
                        );
                        result.shortcutsUpdated += 1;
                        continue;
                    }

                    const idTaken = currentShortcuts.some((item) => item.id === remapped.id);
                    const newShortcut: Shortcut = idTaken
                        ? { ...remapped, id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}` }
                        : remapped;
                    await idbUpsertShortcut(newShortcut);
                    currentShortcuts.push(newShortcut);
                    result.shortcutsAdded += 1;
                }

                set({
                    tags: currentTags,
                    categories: currentCategories,
                    shortcuts: currentShortcuts,
                });

                return result;
            },

            importBrowserBookmarks: async (entries) => {
                const result: BrowserBookmarkImportResult = {
                    shortcutsAdded: 0,
                    shortcutsSkipped: 0,
                    tagsAdded: 0,
                };

                const tagsCountBefore = get().tags.length;
                const seenUrls = new Set(
                    get().shortcuts.map((item) => item.url.toLowerCase()),
                );

                for (const entry of entries) {
                    const normalizedUrl = entry.url.toLowerCase();
                    if (seenUrls.has(normalizedUrl)) {
                        result.shortcutsSkipped += 1;
                        continue;
                    }

                    let tagIds: string[] | undefined;
                    if (entry.tagNames.length > 0) {
                        tagIds = await get().resolveOrCreateTags(entry.tagNames);
                    }

                    await get().addShortcut({
                        name: entry.name,
                        url: entry.url,
                        icon: entry.icon,
                        isPinned: false,
                        tagIds: tagIds?.length ? tagIds : undefined,
                    });

                    seenUrls.add(normalizedUrl);
                    result.shortcutsAdded += 1;
                }

                result.tagsAdded = get().tags.length - tagsCountBefore;
                return result;
            },
        }),
        {
            name: 'dashboard-preferences',
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                searchEngine: state.searchEngine,
                searchHistory: state.searchHistory,
                timeFormat: state.timeFormat,
                bgType: state.bgType,
                bgColor: state.bgColor,
                bgGradient: state.bgGradient,
                gradientConfig: state.gradientConfig,
                bgImgType: state.bgImgType,
                bgImgUrl: state.bgImgUrl,
                bingBgUhd: state.bingBgUhd,
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
                state?.loadShortcuts();
                state?.loadTags();
                state?.loadCategories();
                state?.loadBgImage();
            },
        },
    ),
);
