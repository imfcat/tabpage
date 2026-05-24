import React from 'react';
import { useAppStore } from '@store/useAppStore';
import styles from './Panels.module.css';

export const LinkManagementPanel: React.FC = () => {
    const dockItems = useAppStore((state) => state.dockItems);
    const addDockItem = useAppStore((state) => state.addDockItem);
    const deleteDockItem = useAppStore((state) => state.deleteDockItem);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const name = (formData.get('name') as string).trim();
        const url = (formData.get('url') as string).trim();
        const remoteUrl = (formData.get('remoteUrl') as string).trim();

        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        let icon: string | undefined = undefined;

        try {
            if (file) {
                icon = await fileToBase64(file);
            } else if (remoteUrl) {
                icon = remoteUrl;
            }
        } catch (err) {
            console.error('图片读取解析失败:', err);
            alert('图片文件读取失败，请重试');
            return;
        }

        if (name && url) {
            addDockItem({ name, url, icon });
            form.reset();
        }
    };

    return (
        <div>
            <h4 className={styles.panelTitle}>链接管理</h4>
            <form className={styles.settingsForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <input type="text" name="name" placeholder="网站名称" required />
                </div>
                <div className={styles.formGroup}>
                    <input type="url" name="url" placeholder="网址" required />
                </div>
                <div className={styles.formGroup}>
                    <input type="url" name="remoteUrl" placeholder="远程图片地址（可选）" />
                </div>
                <div className={styles.formGroup}>
                    <label>上传本地图片（可选）：</label>
                    <input type="file" className={styles.fileInput} accept="image/*" />
                </div>
                <button type="submit" className={styles.primaryBtn}>添加至 Dock 栏</button>
            </form>

            <hr className={styles.divider} />

            <h4 className={styles.panelTitle} style={{ fontSize: '1rem' }}>链接管理</h4>
            <div className={styles.manageLinksList}>
                {dockItems.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>暂无自定义链接</div>
                ) : (
                    dockItems.map((item) => (
                        <div className={styles.manageItem} key={item.id}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                {item.icon ? (
                                    <img src={item.icon} alt="" style={{ width: '18px', height: '18px', marginRight: '8px', borderRadius: '4px', objectFit: 'cover' }} />
                                ) : (
                                    <b style={{ marginRight: '10px', color: 'var(--accent-color)' }}>{item.name.trim().charAt(0).toUpperCase()}</b>
                                )}
                                {item.name}
                            </span>
                            <button className={styles.deleteBtn} onClick={() => deleteDockItem(item.id)}>删除</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};