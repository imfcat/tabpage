import type { BackupFile } from '@/types';

export const BACKUP_FILE_VERSION = 1 as const;

export const isBackupFile = (data: unknown): data is BackupFile => {
    if (!data || typeof data !== 'object') return false;
    const file = data as Record<string, unknown>;
    return file.version === BACKUP_FILE_VERSION && typeof file.exportedAt === 'string';
};

export const downloadBackupFile = (backup: BackupFile): void => {
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pagetab-backup-${date}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
};

export const readBackupFile = (file: File): Promise<BackupFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed: unknown = JSON.parse(String(reader.result));
                if (!isBackupFile(parsed)) {
                    reject(new Error('无效的备份文件格式'));
                    return;
                }
                if (!parsed.bookmarks && !parsed.settings) {
                    reject(new Error('备份文件中未包含书签或设置数据'));
                    return;
                }
                resolve(parsed);
            } catch {
                reject(new Error('无法解析备份文件'));
            }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file);
    });
};
