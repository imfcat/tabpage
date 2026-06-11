import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useAppStore } from '@store/useAppStore';
import { Plus, Close } from '@components/Icon';
import { AddLinkModal } from '@components/AddLinkModal';
import { AddCategoryModal } from '@components/AddLinkModal/AddCategoryModal';
import { ContextMenuTrigger } from '@components/ContextMenu';
import type { ContextMenuItem } from '@components/ContextMenu';
import { Modal } from '@components/Modal';
import type { Shortcut, Category } from '@/types';
import styles from './AppsModal.module.css';

interface AppsModalProps {
    isOpen: boolean;

    onClose: () => void;
}

export const AppsModal: React.FC<AppsModalProps> = ({ isOpen, onClose }) => {
    const shortcuts = useAppStore((state) => state.shortcuts);
    const categories = useAppStore((state) => state.categories);
    const toggleShortcutPin = useAppStore((state) => state.toggleShortcutPin);
    const deleteShortcut = useAppStore((state) => state.deleteShortcut);
    const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
    const [deletingShortcut, setDeletingShortcut] = useState<Shortcut | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState('all');
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, transform: 'translateX(0px)' });

    const updateIndicator = useCallback(() => {
        const container = tabsContainerRef.current;
        const activeTab = tabButtonRefs.current[activeCategoryId];
        if (!container || !activeTab) {
            setIndicatorStyle({ width: 0, transform: 'translateX(0px)' });
            return;
        }
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setIndicatorStyle({
            width: tabRect.width,
            transform: `translateX(${tabRect.left - containerRect.left + container.scrollLeft}px)`,
        });
    }, [activeCategoryId]);

    useEffect(() => {
        if (isOpen) setActiveCategoryId('all');
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isOpen || categories.length === 0) return;
        updateIndicator();
        const container = tabsContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(updateIndicator);
        resizeObserver.observe(container);
        Array.from(container.querySelectorAll('button')).forEach((btn) => resizeObserver.observe(btn));

        return () => resizeObserver.disconnect();
    }, [isOpen, categories, activeCategoryId, updateIndicator]);

    if (!isOpen) return null;

    const filteredShortcuts =
        activeCategoryId === 'all' ? shortcuts : shortcuts.filter((item) => item.categoryId === activeCategoryId);

    const getCategoryContextMenuItems = (category: Category): ContextMenuItem[] => [
        {
            id: 'edit-category',
            label: '编辑',
            onClick: () => setEditingCategory(category),
        },
    ];

    const getContextMenuItems = (item: Shortcut): ContextMenuItem[] => [
        {
            id: 'edit',
            label: '编辑',
            onClick: () => setEditingShortcut(item),
        },
        {
            id: 'pin',
            label: item.isPinned ? '从 Dock 移除' : '添加到 Dock',
            onClick: () => toggleShortcutPin(item.id),
        },
        { type: 'divider' },
        {
            id: 'delete',
            label: '删除',
            danger: true,
            onClick: () => setDeletingShortcut(item),
        },
    ];

    const handleConfirmDelete = async () => {
        if (!deletingShortcut) return;

        await deleteShortcut(deletingShortcut.id);

        setDeletingShortcut(null);
    };

    return (
        <>
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>书签夹</h3>

                        <button className={styles.closeBtn} onClick={onClose}>
                            <Close size={18} />
                        </button>
                    </div>

                    <div className={styles.gridContainer}>
                        {filteredShortcuts.map((item) => (
                            <ContextMenuTrigger
                                key={item.id}
                                className={styles.gridItem}
                                items={getContextMenuItems(item)}>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.gridItemLink}>
                                    <div className={styles.gridIconWrapper}>
                                        {item.ico ? (
                                            <img
                                                src={URL.createObjectURL(item.ico)}
                                                alt={item.name}
                                                className={styles.gridIconImg}
                                                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : item.icon ? (
                                            <img
                                                src={item.icon}
                                                alt={item.name}
                                                className={styles.gridIconImg}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span className={styles.gridIconText}>
                                                {item.name.trim().charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <span className={styles.gridItemName}>{item.name}</span>
                                </a>
                            </ContextMenuTrigger>
                        ))}

                        <div
                            className={`${styles.gridItem} ${styles.addGridItem}`}
                            onClick={() => setIsAddLinkOpen(true)}>
                            <div className={`${styles.gridIconWrapper} ${styles.addButtonWrapper}`}>
                                <Plus size={28} className={styles.addIcon} />
                            </div>

                            <span className={`${styles.gridItemName} ${styles.addLinkName}`}>添加链接</span>
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <div className={styles.categoryTabsWrapper}>
                            <div
                                className={styles.categoryTabs}
                                ref={tabsContainerRef}
                                onScroll={updateIndicator}>
                                <span
                                    className={styles.categoryIndicator}
                                    style={indicatorStyle}
                                    aria-hidden
                                />
                                <button
                                    type="button"
                                    ref={(el) => { tabButtonRefs.current.all = el; }}
                                    className={`${styles.categoryTab} ${activeCategoryId === 'all' ? styles.categoryTabActive : ''}`}
                                    onClick={() => setActiveCategoryId('all')}>
                                    全部
                                </button>
                                {categories.map((cat) => (
                                    <ContextMenuTrigger
                                        key={cat.id}
                                        className={styles.categoryTabWrapper}
                                        items={getCategoryContextMenuItems(cat)}>
                                        <button
                                            type="button"
                                            ref={(el) => { tabButtonRefs.current[cat.id] = el; }}
                                            className={`${styles.categoryTab} ${activeCategoryId === cat.id ? styles.categoryTabActive : ''}`}
                                            onClick={() => setActiveCategoryId(cat.id)}>
                                            {cat.name}
                                        </button>
                                    </ContextMenuTrigger>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AddLinkModal isOpen={isAddLinkOpen} onClose={() => setIsAddLinkOpen(false)} />

            <AddLinkModal
                isOpen={!!editingShortcut}
                onClose={() => setEditingShortcut(null)}
                shortcut={editingShortcut ?? undefined}
            />

            <AddCategoryModal
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                category={editingCategory ?? undefined}
            />

            <Modal
                isOpen={!!deletingShortcut}
                onClose={() => setDeletingShortcut(null)}
                title="确认删除"
                zIndex={10002}
                maxWidth={400}
                footer={
                    <>
                        <button
                            type="button"
                            className={styles.confirmCancelBtn}
                            onClick={() => setDeletingShortcut(null)}>
                            取消
                        </button>

                        <button type="button" className={styles.confirmDeleteBtn} onClick={handleConfirmDelete}>
                            删除
                        </button>
                    </>
                }>
                <p className={styles.confirmText}>确定要删除「{deletingShortcut?.name}」吗？此操作无法撤销。</p>
            </Modal>
        </>
    );
};
