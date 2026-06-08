import React, { useState } from 'react';
import { useAppStore } from '@store/useAppStore';
import { Plus } from '@components/Icon';
import { AddLinkModal } from '@components/AddLinkModal';
import styles from './AppsModal.module.css';

interface AppsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AppsModal: React.FC<AppsModalProps> = ({ isOpen, onClose }) => {
    const shortcuts = useAppStore((state) => state.shortcuts);
    const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>应用中心</h3>
                        <button className={styles.closeBtn} onClick={onClose}>✕</button>
                    </div>
                    
                    <div className={styles.gridContainer}>
                        {shortcuts.map((item) => (
                            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={styles.gridItem}>
                                <div className={styles.gridIconWrapper}>
                                    {item.ico ? (
                                        <img 
                                            src={URL.createObjectURL(item.ico)}
                                            alt={item.name} 
                                            className={styles.gridIconImg} 
                                            onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : item.icon ? (
                                        <img 
                                            src={item.icon}
                                            alt={item.name} 
                                            className={styles.gridIconImg} 
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className={styles.gridIconText}>{item.name.trim().charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <span className={styles.gridItemName}>{item.name}</span>
                            </a>
                        ))}

                        <div className={styles.gridItem} onClick={() => setIsAddLinkOpen(true)}>
                            <div className={`${styles.gridIconWrapper} ${styles.addButtonWrapper}`}>
                                <Plus size={28} className={styles.addIcon} />
                            </div>
                            <span className={`${styles.gridItemName} ${styles.addLinkName}`}>添加链接</span>
                        </div>
                    </div>
                </div>
            </div>

            <AddLinkModal isOpen={isAddLinkOpen} onClose={() => setIsAddLinkOpen(false)} />
        </>
    );
};