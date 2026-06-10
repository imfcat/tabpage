import React, { useRef, useState } from 'react';
import { useAppStore } from '@store/useAppStore';
import type { BackupImportResult } from '@/types';
import { downloadBackupFile, readBackupFile } from '@/utils/backup';
import styles from './Panels.module.css';

export const BackupSettingsPanel: React.FC = () => {
    const buildBackup = useAppStore((state) => state.buildBackup);
    const importBackup = useAppStore((state) => state.importBackup);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [exportBookmarks, setExportBookmarks] = useState(true);
    const [exportSettings, setExportSettings] = useState(true);
    const [exportError, setExportError] = useState('');
    const [importError, setImportError] = useState('');
    const [importResult, setImportResult] = useState<BackupImportResult | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = () => {
        setExportError('');
        if (!exportBookmarks && !exportSettings) {
            setExportError('请至少选择一项导出内容');
            return;
        }

        const backup = buildBackup({
            includeBookmarks: exportBookmarks,
            includeSettings: exportSettings,
        });
        downloadBackupFile(backup);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setImportError('');
        setImportResult(null);
        setIsImporting(true);

        try {
            const backup = await readBackupFile(file);
            const result = await importBackup(backup);
            setImportResult(result);
        } catch (err) {
            setImportError(err instanceof Error ? err.message : '导入失败');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div>
            <h4 className={styles.panelTitle}>备份导出</h4>

            <section className={styles.backupSection}>
                <h5 className={styles.sectionHeading}>导出</h5>
                <p className={styles.sectionHint}>选择需要导出的内容，生成备份文件。</p>
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={exportBookmarks}
                            onChange={(e) => setExportBookmarks(e.target.checked)}
                        />
                        导出书签
                    </label>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={exportSettings}
                            onChange={(e) => setExportSettings(e.target.checked)}
                        />
                        导出设置
                    </label>
                </div>
                {exportError && <p className={styles.errorText}>{exportError}</p>}
                <button type="button" className={styles.primaryBtn} onClick={handleExport}>
                    导出备份
                </button>
            </section>

            <hr className={styles.divider} />

            <section className={styles.backupSection}>
                <h5 className={styles.sectionHeading}>导入</h5>
                <p className={styles.sectionHint}>
                    上传备份文件。设置项将覆盖当前配置，书签将增量导入。
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className={styles.fileInput}
                    onChange={handleImport}
                    disabled={isImporting}
                />
                {importError && <p className={styles.errorText}>{importError}</p>}
                {importResult && (
                    <p className={styles.successText}>
                        导入完成
                        {importResult.settingsApplied && '，设置已覆盖'}
                        {(importResult.shortcutsAdded > 0 || importResult.shortcutsUpdated > 0 || importResult.shortcutsSkipped > 0) && (
                            <>
                                ，书签新增 {importResult.shortcutsAdded} 条
                                {importResult.shortcutsUpdated > 0 && `、更新 ${importResult.shortcutsUpdated} 条`}
                                {importResult.shortcutsSkipped > 0 && `、跳过 ${importResult.shortcutsSkipped} 条`}
                                {importResult.tagsAdded > 0 && `，新增标签 ${importResult.tagsAdded} 个`}
                                {importResult.categoriesAdded > 0 && `，新增分类 ${importResult.categoriesAdded} 个`}
                            </>
                        )}
                        。
                    </p>
                )}
            </section>
        </div>
    );
};
