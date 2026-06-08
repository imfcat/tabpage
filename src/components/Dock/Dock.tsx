import React, { useState } from 'react';
import { Settings, Apps } from '@components/Icon';
import { useAppStore } from '@store/useAppStore';
import { AppsModal } from '@components/AppsModal';
import styles from './Dock.module.css';

export const Dock: React.FC = () => {
    const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
    const [isAppsOpen, setIsAppsOpen] = useState(false);

    const shortcuts = useAppStore((state) => state.shortcuts);
    const pinnedShortcuts = shortcuts.filter((item) => item.isPinned);

    const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>, name: string) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent && !parent.querySelector(`.${styles.dockIconText}`)) {
            const span = document.createElement('span');
            span.className = styles.dockIconText;
            span.innerText = name.trim().charAt(0).toUpperCase();
            parent.appendChild(span);
        }
    };

    return (
        <div className={styles.dockTriggerZone}>
            <div className={styles.dockContainer}>
                <button
                    className={`${styles.dockItem} ${styles.openApps}`}
                    title="应用中心"
                    onClick={() => setIsAppsOpen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Apps size={28} />
                </button>
                
                <div className={styles.dockLinks}>
                    {pinnedShortcuts.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            className={`${styles.dockItem} ${styles.dockItemAnime}`}
                            title={item.name}
                            target="_blank"
                            rel="noopener noreferrer">
                            
                            {item.ico ? (
                                <img
                                    src={URL.createObjectURL(item.ico)}
                                    alt={item.name}
                                    className={styles.dockIconImg}
                                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                    onError={(e) => handleImgError(e, item.name)}
                                />
                            ) : item.icon ? (
                                <img
                                    src={item.icon}
                                    alt={item.name}
                                    className={styles.dockIconImg}
                                    onError={(e) => handleImgError(e, item.name)}
                                />
                            ) : (
                                <span className={styles.dockIconText}>{item.name.trim().charAt(0).toUpperCase()}</span>
                            )}
                        </a>
                    ))}
                </div>
                
                <div className={styles.dockDivider}></div>
                
                <button
                    className={`${styles.dockItem} ${styles.openSettings} ${styles.dockItemAnime}`}
                    title="设置"
                    onClick={() => setSettingsOpen(true)}>
                    <Settings size={28} />
                </button>
            </div>
            <AppsModal isOpen={isAppsOpen} onClose={() => setIsAppsOpen(false)} />
        </div>
    );
};
