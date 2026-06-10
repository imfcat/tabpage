import React, { useState } from 'react';
import { Modal } from '@components/Modal';
import { useAppStore } from '@store/useAppStore';
import styles from './AddCategoryModal.module.css';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdded: (categoryId: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onAdded }) => {
    const addCategory = useAppStore((state) => state.addCategory);
    const [name, setName] = useState('');

    const handleClose = () => {
        setName('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            const category = await addCategory(trimmed);
            setName('');
            onAdded(category.id);
            onClose();
        } catch {
            alert('分类名称不能为空');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="添加分类"
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
                    确认添加
                </button>
            </form>
        </Modal>
    );
};
