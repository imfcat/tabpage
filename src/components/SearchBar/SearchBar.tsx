import React from 'react';
import { Search } from '@components/Icon'; 
import styles from './SearchBar.module.css';

interface SearchBarProps {
    isVisible: boolean;
    engine: string;
}

const ENGINE_MAP: Record<string, { action: string; name: string; placeholder: string }> = {
    bing: { action: 'https://www.bing.com/search', name: 'q', placeholder: '必应搜索...' },
    google: { action: 'https://www.google.com/search', name: 'q', placeholder: '谷歌搜索...' },
    baidu: { action: 'https://www.baidu.com/s', name: 'wd', placeholder: '百度一下...' },
};

export const SearchBar: React.FC<SearchBarProps> = ({ isVisible, engine }) => {
    const currentEngine = ENGINE_MAP[engine] || ENGINE_MAP.bing;

    return (
        <div className={`${styles.searchWrapper} ${isVisible ? styles.visible : ''}`}>
            <form action={currentEngine.action} method="get" target="_blank" rel="noopener noreferrer">
                <div className={styles.inputContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        name={currentEngine.name}
                        className={styles.searchInput}
                        placeholder={currentEngine.placeholder} 
                        autoComplete="off" 
                    />
                </div>
            </form>
        </div>
    );
};
