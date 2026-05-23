import React, { useRef, useEffect, useState } from 'react';
import type { DockItem } from '@/types';
import { BasicSettingsPanel } from './panels/BasicSettingsPanel';
import { LinkManagementPanel } from './panels/LinkManagementPanel';
import styles from './SettingsDialog.module.css';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    dockItems: DockItem[];
    onAddItem: (item: Omit<DockItem, 'id'>) => void;
    onDeleteItem: (id: string) => void;
    searchEngine: string;
    onEngineChange: (val: string) => void;
    timeFormat: string;
    onTimeFormatChange: (val: string) => void;
}

type TabId = 'basic' | 'links';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    dockItems,
    onAddItem,
    onDeleteItem,
    searchEngine,
    onEngineChange,
    timeFormat,
    onTimeFormatChange
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeTab, setActiveTab] = useState<TabId>('basic');

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isOpen) {
            if (!dialog.open) dialog.showModal();
        } else {
            if (dialog.open) dialog.close();
        }
    }, [isOpen]);

    return (
        <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} onClick={(e) => e.target === dialogRef.current && onClose()}>
            <div className={styles.modalContainer}>
                <button className={styles.absoluteCloseBtn} onClick={onClose} title="关闭设置">
                    &times;
                </button>

                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>设置</h3>
                    </div>
                    <nav className={styles.sidebarNav}>
                        <button className={`${styles.navItem} ${activeTab === 'basic' ? styles.activeNav : ''}`} onClick={() => setActiveTab('basic')}>基础设置</button>
                        <button className={`${styles.navItem} ${activeTab === 'links' ? styles.activeNav : ''}`} onClick={() => setActiveTab('links')}>导航链接</button>
                    </nav>
                </aside>

                <main className={styles.contentArea}>
                    {activeTab === 'basic' && (
                        <BasicSettingsPanel 
                            searchEngine={searchEngine}
                            onEngineChange={onEngineChange}
                            timeFormat={timeFormat}
                            onTimeFormatChange={onTimeFormatChange}
                        />
                    )}
                    {activeTab === 'links' && (
                        <LinkManagementPanel dockItems={dockItems} onAddItem={onAddItem} onDeleteItem={onDeleteItem} />
                    )}
                </main>
            </div>
        </dialog>
    );
};
