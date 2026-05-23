import React, { useState, useEffect } from 'react';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { Dock } from './components/Dock';
import { SettingsDialog } from './components/Settings';
import type { DockItem } from './types';
import './App.css';

const DEFAULT_LINKS: DockItem[] = [
    {
        id: '1',
        name: '必应',
        url: 'https://cn.bing.com',
        icon: 'https://www.bing.com/favicon.ico',
    },
    {
        id: '2',
        name: 'GitHub',
        url: 'https://github.com',
        icon: 'https://github.githubassets.com/favicons/favicon-dark.svg',
    },
];

export const App: React.FC = () => {
    const [dockItems, setDockItems] = useState<DockItem[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isCenterHovered, setIsCenterHovered] = useState<boolean>(false);

    // 全局状态
    const [searchEngine, setSearchEngine] = useState<string>('bing');
    const [timeFormat, setTimeFormat] = useState<string>('24');

    useEffect(() => {
        const loadStorageData = async () => {
            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                const data = await chrome.storage.local.get(['dockItems']) as { dockItems?: DockItem[] };
                setDockItems(data.dockItems || DEFAULT_LINKS);
            } else {
                const localData = localStorage.getItem('dockItems');
                setDockItems(localData ? JSON.parse(localData) : DEFAULT_LINKS);
            }

            // 加载基础设置
            setSearchEngine(localStorage.getItem('searchEngine') || 'bing');
            setTimeFormat(localStorage.getItem('timeFormat') || '24');
        };
        loadStorageData();
    }, []);

    const saveDockItems = async (newItems: DockItem[]) => {
        setDockItems(newItems);
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            await chrome.storage.local.set({ dockItems: newItems });
        } else {
            localStorage.setItem('dockItems', JSON.stringify(newItems));
        }
    };

    return (
        <div className="appViewport">
            <div 
                className="centerContainer"
                onMouseEnter={() => setIsCenterHovered(true)}
                onMouseLeave={() => setIsCenterHovered(false)}
            >
                <Clock timeFormat={timeFormat} />
                <SearchBar isVisible={isCenterHovered} engine={searchEngine} />
            </div>

            <Dock items={dockItems} onOpenSettings={() => setIsSettingsOpen(true)} />

            <SettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                dockItems={dockItems}
                onAddItem={(item) => saveDockItems([...dockItems, { id: Date.now().toString(), ...item }])}
                onDeleteItem={(id) => saveDockItems(dockItems.filter(item => item.id !== id))}
                searchEngine={searchEngine}
                onEngineChange={(val) => { setSearchEngine(val); localStorage.setItem('searchEngine', val); }}
                timeFormat={timeFormat}
                onTimeFormatChange={(val) => { setTimeFormat(val); localStorage.setItem('timeFormat', val); }}
            />
        </div>
    );
};

export default App;
