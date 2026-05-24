import React from 'react';
import { Settings } from '@components/Icon';
import { useAppStore } from '@store/useAppStore';
import styles from './Dock.module.css';

export const Dock: React.FC = () => {
    const dockItems = useAppStore((state) => state.dockItems);
    const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);

    return (
        <div className={styles.dockTriggerZone}>
            <div className={styles.dockContainer}>
                <div className={styles.dockLinks}>
                    {dockItems.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            className={styles.dockItem}
                            title={item.name}
                            target="_blank"
                            rel="noopener noreferrer">
                            {item.icon ? (
                                <img
                                    src={item.icon}
                                    alt={item.name}
                                    className={styles.dockIconImg}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const span = document.createElement('span');
                                        span.className = styles.dockIconText;
                                        span.innerText = item.name.trim().charAt(0);
                                        e.currentTarget.parentElement?.appendChild(span);
                                    }}
                                />
                            ) : (
                                <span className={styles.dockIconText}>{item.name.trim().charAt(0)}</span>
                            )}
                        </a>
                    ))}
                </div>
                <div className={styles.dockDivider}></div>
                <button
                    className={`${styles.dockItem} ${styles.openSettings}`}
                    title="设置"
                    onClick={() => setSettingsOpen(true)}>
                    <Settings size={28} />
                </button>
            </div>
        </div>
    );
};
