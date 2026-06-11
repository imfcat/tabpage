import React, { useRef, useEffect, useState } from 'react';
import { Close } from '@components/Icon';
import { useAppStore } from '@store/useAppStore';
import { BasicSettingsPanel } from './panels/BasicSettingsPanel';
import { BackgroundSettingsPanel } from './panels/BackgroundSettingsPanel';
import { BackupSettingsPanel } from './panels/BackupSettingsPanel';
import { BrowserBookmarkImportPanel } from './panels/BrowserBookmarkImportPanel';
import styles from './SettingsDialog.module.css';

type TabId = 'basic' | 'background' | 'browserImport' | 'backup';

export const SettingsDialog: React.FC = () => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeTab, setActiveTab] = useState<TabId>('basic');
    
    const isOpen = useAppStore((state) => state.isSettingsOpen);
    const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isOpen) {
            if (!dialog.open) dialog.showModal();
        } else {
            if (dialog.open) dialog.close();
        }
    }, [isOpen]);

    const handleClose = () => setSettingsOpen(false);

    return (
        <dialog ref={dialogRef} className={styles.dialog} onClose={handleClose} onClick={(e) => e.target === dialogRef.current && handleClose()}>
            <div className={styles.modalContainer}>
                <button className={styles.absoluteCloseBtn} onClick={handleClose} title="关闭设置">
                    <Close size={24} />
                </button>

                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>设置</h3>
                    </div>
                    <nav className={styles.sidebarNav}>
                        <button className={`${styles.navItem} ${activeTab === 'basic' ? styles.activeNav : ''}`} onClick={() => setActiveTab('basic')}>基础设置</button>
                        <button className={`${styles.navItem} ${activeTab === 'background' ? styles.activeNav : ''}`} onClick={() => setActiveTab('background')}>背景设置</button>
                        <button className={`${styles.navItem} ${activeTab === 'browserImport' ? styles.activeNav : ''}`} onClick={() => setActiveTab('browserImport')}>导入书签</button>
                        <button className={`${styles.navItem} ${activeTab === 'backup' ? styles.activeNav : ''}`} onClick={() => setActiveTab('backup')}>备份导出</button>
                    </nav>
                </aside>

                <main className={styles.contentArea}>
                    {activeTab === 'basic' && <BasicSettingsPanel />}
                    {activeTab === 'background' && <BackgroundSettingsPanel />}
                    {activeTab === 'browserImport' && <BrowserBookmarkImportPanel />}
                    {activeTab === 'backup' && <BackupSettingsPanel />}
                </main>
            </div>
        </dialog>
    );
};
