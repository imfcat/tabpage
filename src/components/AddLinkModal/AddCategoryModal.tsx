import React, { useState, useEffect } from 'react';
import { Modal } from '@components/Modal';
import { useAppStore } from '@store/useAppStore';
import type { Category } from '@/types';
import styles from './AddCategoryModal.module.css';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdded?: (categoryId: string) => void;
    category?: Category;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
    isOpen,
    onClose,
    onAdded,
    category,
}) => {
    const isEditMode = !!category;
    const addCategory = useAppStore((state) => state.addCategory);
    const updateCategory = useAppStore((state) => state.updateCategory);
    const [name, setName] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setName(category?.name ?? '');
    }, [isOpen, category]);

    const handleClose = () => {
        setName('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        if (isEditMode && category) {
            await updateCategory(category.id, { name: trimmed });
            handleClose();
            return;
        }

        try {
            const newCategory = await addCategory(trimmed);
            setName('');
            onAdded?.(newCategory.id);
            onClose();
        } catch {
            alert('分类名称不能为空');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditMode ? '编辑分类' : '添加分类'}
            maxWidth={360}
            zIndex={10001}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    placeholder="分类名称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    autoComplete="off"
                    autoFocus
                />
                <button type="submit" className={styles.submitBtn} disabled={!name.trim()}>
                    {isEditMode ? '保存修改' : '确认添加'}
                </button>
            </form>
        </Modal>
    );
};
