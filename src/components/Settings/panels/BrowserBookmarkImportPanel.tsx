import React, { useState } from 'react';
import { useAppStore } from '@store/useAppStore';
import type { BrowserBookmarkImportResult } from '@/types';
import { parseBrowserBookmarkHtml, readBrowserBookmarkFile } from '@/utils/browserBookmarks';
import styles from './Panels.module.css';

export const BrowserBookmarkImportPanel: React.FC = () => {
    const importBrowserBookmarks = useAppStore((state) => state.importBrowserBookmarks);

    const [createTags, setCreateTags] = useState(false);
    const [importError, setImportError] = useState('');
    const [importResult, setImportResult] = useState<BrowserBookmarkImportResult | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setImportError('');
        setImportResult(null);
        setIsImporting(true);

        try {
            const html = await readBrowserBookmarkFile(file);
            const entries = parseBrowserBookmarkHtml(html, createTags);
            const result = await importBrowserBookmarks(entries);
            setImportResult(result);
        } catch (err) {
            setImportError(err instanceof Error ? err.message : '导入失败');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div>
            <h4 className={styles.panelTitle}>导入书签</h4>

            <section className={styles.backupSection}>
                <p className={styles.sectionHint}>
                    上传浏览器导出的HTML书签文件
                </p>
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel} title='将书签所在文件夹解析为标签并绑定'>
                        <input
                            type="checkbox"
                            checked={createTags}
                            onChange={(e) => setCreateTags(e.target.checked)}
                            disabled={isImporting}
                        />
                        创建标签
                    </label>
                </div>
                <input
                    type="file"
                    accept=".html,.htm,text/html"
                    className={styles.fileInput}
                    onChange={handleImport}
                    disabled={isImporting}
                />
                {importError && <p className={styles.errorText}>{importError}</p>}
                {importResult && (
                    <p className={styles.successText}>
                        导入完成，新增 {importResult.shortcutsAdded} 条书签
                        {importResult.shortcutsSkipped > 0 && `，跳过 ${importResult.shortcutsSkipped} 条重复链接`}
                        {importResult.tagsAdded > 0 && `，新增标签 ${importResult.tagsAdded} 个`}
                        。
                    </p>
                )}
            </section>
        </div>
    );
};
