import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Shortcut, BgType, BgImgType, GradientConfig } from '@/types';

interface AppState {
    _hasHydrated: boolean;
    setHydrated: (hydrated: boolean) => void;

    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;

    // IndexedDB
    shortcuts: Shortcut[];
    loadShortcuts: () => Promise<void>; 
    addShortcut: (item: Omit<Shortcut, 'id'>) => Promise<void>; 
    deleteShortcut: (id: string) => Promise<void>; 
    toggleShortcutPin: (id: string) => Promise<void>; 

    // 配置localStorage
    searchEngine: string;
    setSearchEngine: (engine: string) => void;

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

    bgBlobUrl: string;
    loadBgImage: () => Promise<void>;
}

const SEED_SHORTCUTS: Shortcut[] = [
    { id: '1', name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico', isPinned: true },
    { id: '2', name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon-dark.svg', isPinned: true },
];

const DB_NAME = 'TabPage_AppDB';
const SHORTCUTS_STORE = 'shortcuts_store';
const CACHE_STORE = 'bg_cache_store';
const DB_VERSION = 1;

// 建立数据库连接
const getIDBConnection = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(SHORTCUTS_STORE)) {
                db.createObjectStore(SHORTCUTS_STORE, { keyPath: 'id' });
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

const idbGetBgCache = async (): Promise<{ id: string; blob: Blob; date: string; targetUrl: string } | null> => {
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
        const request = store.put({ id: 'current_bg', blob, date, targetUrl });
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

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            shortcuts: [],
            isSettingsOpen: false,
            searchEngine: 'bing',
            timeFormat: '24',
            bgType: 'default',
            bgColor: '#14161d',
            bgGradient: 'linear-gradient(135deg, #232528 0%, #0f111a 100%)',
            bgImgType: 'bing',
            bgImgUrl: '',
            bgBlobUrl: '',
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

            loadBgImage: async () => {
                const { bgType, bgImgType, bgImgUrl } = get();
                if (bgType !== 'image') return;

                const targetUrl = bgImgType === 'bing' 
                    ? 'https://bing.biturl.top/?resolution=1920&format=image' 
                    : bgImgUrl;

                if (!targetUrl) return;

                const todayStr = new Date().toDateString();

                try {
                    const cached = await idbGetBgCache();
                    
                    if (cached && cached.targetUrl === targetUrl) {
                        if (bgImgType !== 'bing' || cached.date === todayStr) {
                            const localUrl = URL.createObjectURL(cached.blob);
                            set({ bgBlobUrl: localUrl });
                            return;
                        }
                    }

                    if (cached) {
                        set({ bgBlobUrl: URL.createObjectURL(cached.blob) });
                    }

                    const response = await fetch(targetUrl);
                    if (!response.ok) throw new Error('Network response was not ok');
                    const freshBlob = await response.blob();

                    // 更新缓存
                    await idbSetBgCache(freshBlob, todayStr, targetUrl);

                    const prevBlobUrl = get().bgBlobUrl;
                    if (prevBlobUrl && prevBlobUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(prevBlobUrl);
                    }

                    set({ bgBlobUrl: URL.createObjectURL(freshBlob) });
                } catch (err) {
                    console.error('Cache failed:', err);
                    set({ bgBlobUrl: targetUrl });
                }
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
        }),
        {
            name: 'dashboard-preferences',
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                searchEngine: state.searchEngine,
                timeFormat: state.timeFormat,
                bgType: state.bgType,
                bgColor: state.bgColor,
                bgGradient: state.bgGradient,
                gradientConfig: state.gradientConfig,
                bgImgType: state.bgImgType,
                bgImgUrl: state.bgImgUrl,
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
                state?.loadShortcuts(); 
                state?.loadBgImage();
            },
        },
    ),
);
