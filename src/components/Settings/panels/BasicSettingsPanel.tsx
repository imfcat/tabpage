import React from 'react';
import styles from './Panels.module.css';

interface BasicSettingsPanelProps {
    searchEngine: string;
    onEngineChange: (val: string) => void;
    timeFormat: string;
    onTimeFormatChange: (val: string) => void;
}

export const BasicSettingsPanel: React.FC<BasicSettingsPanelProps> = ({
    searchEngine,
    onEngineChange,
    timeFormat,
    onTimeFormatChange
}) => {
    return (
        <div>
            <h4 className={styles.panelTitle}>基础设置</h4>
            <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                    <label>默认搜索引擎</label>
                    <select value={searchEngine} onChange={(e) => onEngineChange(e.target.value)}>
                        <option value="bing">必应 (Bing)</option>
                        <option value="google">谷歌 (Google)</option>
                        <option value="baidu">百度 (Baidu)</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>时间显示格式</label>
                    <select value={timeFormat} onChange={(e) => onTimeFormatChange(e.target.value)}>
                        <option value="24">24 小时制 (hh:mm)</option>
                        <option value="12">12 小时制 (am/pm)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};