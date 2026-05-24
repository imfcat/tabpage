import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { DockItem, BgType, BgImgType, GradientConfig } from '@/types';

interface AppState {
    _hasHydrated: boolean;
    setHydrated: (hydrated: boolean) => void;

    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;

    dockItems: DockItem[];
    addDockItem: (item: Omit<DockItem, 'id'>) => void;
    deleteDockItem: (id: string) => void;

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
}

const DEFAULT_LINKS: DockItem[] = [
    { id: '1', name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico' },
    { id: '2', name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon-dark.svg' },
];

const adaptiveStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            const data = (await chrome.storage.local.get(name)) as Record<string, string | null | undefined>;
            return data[name] || null;
        }
        return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            await chrome.storage.local.set({ [name]: value });
        } else {
            localStorage.setItem(name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            await chrome.storage.local.remove(name);
        } else {
            localStorage.removeItem(name);
        }
    },
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            _hasHydrated: false,
            dockItems: DEFAULT_LINKS,
            isSettingsOpen: false,
            searchEngine: 'bing',
            timeFormat: '24',
            bgType: 'default',
            bgColor: '#14161d',
            bgGradient: 'linear-gradient(135deg, #232528 0%, #0f111a 100%)',
            bgImgType: 'bing',
            bgImgUrl: '',

            setHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
            setSettingsOpen: (open) => set({ isSettingsOpen: open }),
            addDockItem: (item) =>
                set((state) => ({
                    dockItems: [...state.dockItems, { id: Date.now().toString(), ...item }],
                })),
            deleteDockItem: (id) =>
                set((state) => ({
                    dockItems: state.dockItems.filter((item) => item.id !== id),
                })),
            setSearchEngine: (engine) => set({ searchEngine: engine }),
            setTimeFormat: (format) => set({ timeFormat: format }),
            setBgType: (type) => set({ bgType: type }),
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
            setBgImgType: (type) => set({ bgImgType: type }),
            setBgImgUrl: (url) => set({ bgImgUrl: url }),gradientConfig: {
                type: 'linear',
                angle: 135,
                colors: ['#232528', '#0f111a'],
            },
        }),
        {
            name: 'app-dashboard-settings',
            storage: createJSONStorage(() => adaptiveStorage),

            partialize: (state) => ({
                dockItems: state.dockItems,
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
            },
        },
    ),
);
