import React from 'react';
import { useAppStore } from '@store/useAppStore';
import styles from './Panels.module.css';

export const BasicSettingsPanel: React.FC = () => {
    const searchEngine = useAppStore((state) => state.searchEngine);
    const setSearchEngine = useAppStore((state) => state.setSearchEngine);
    const timeFormat = useAppStore((state) => state.timeFormat);
    const setTimeFormat = useAppStore((state) => state.setTimeFormat);

    return (
        <div>
            <h4 className={styles.panelTitle}>基础设置</h4>
            <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                    <label>默认搜索引擎</label>
                    <select value={searchEngine} onChange={(e) => setSearchEngine(e.target.value)}>
                        <option value="bing">必应 (Bing)</option>
                        <option value="google">谷歌 (Google)</option>
                        <option value="baidu">百度 (Baidu)</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>时间显示格式</label>
                    <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}>
                        <option value="24">24 小时制 (hh:mm)</option>
                        <option value="12">12 小时制 (am/pm)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};