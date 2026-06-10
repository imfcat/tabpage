import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import { Search, Close } from '@components/Icon';
import { useAppStore } from '@store/useAppStore';
import type { Shortcut, Tag, Category } from '@/types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    isVisible: boolean;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCompactChange: (compact: boolean) => void;
}

interface BookmarkMatch {
    shortcut: Shortcut;
    tags: Tag[];
    category?: Category;
}

const ENGINE_MAP: Record<string, { action: string; name: string; placeholder: string }> = {
    bing: { action: 'https://www.bing.com/search', name: 'q', placeholder: '必应搜索...' },
    google: { action: 'https://www.google.com/search', name: 'q', placeholder: '谷歌搜索...' },
    baidu: { action: 'https://www.baidu.com/s', name: 'wd', placeholder: '百度一下...' },
};

const MAX_BOOKMARK_RESULTS = 8;

function searchBookmarks(
    query: string,
    shortcuts: Shortcut[],
    tags: Tag[],
    categories: Category[],
): BookmarkMatch[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return shortcuts
        .filter((shortcut) => {
            if (shortcut.name.toLowerCase().includes(q)) return true;
            if (shortcut.comment?.toLowerCase().includes(q)) return true;
            const category = categories.find((c) => c.id === shortcut.categoryId);
            if (category?.name.toLowerCase().includes(q)) return true;
            const shortcutTags = (shortcut.tagIds ?? [])
                .map((id) => tags.find((t) => t.id === id))
                .filter((t): t is Tag => !!t);
            if (shortcutTags.some((t) => t.name.toLowerCase().includes(q))) return true;
            return false;
        })
        .map((shortcut) => {
            const shortcutTags = (shortcut.tagIds ?? [])
                .map((id) => tags.find((t) => t.id === id))
                .filter((t): t is Tag => !!t);
            const category = categories.find((c) => c.id === shortcut.categoryId);
            return { shortcut, tags: shortcutTags, category };
        })
        .slice(0, MAX_BOOKMARK_RESULTS);
}

function openWebSearch(
    query: string,
    engine: { action: string; name: string },
) {
    const params = new URLSearchParams({ [engine.name]: query });
    window.open(`${engine.action}?${params}`, '_blank', 'noopener,noreferrer');
}

const BookmarkIcon: React.FC<{ shortcut: Shortcut }> = ({ shortcut }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!shortcut.ico) return;
        const url = URL.createObjectURL(shortcut.ico);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [shortcut.ico]);

    if (blobUrl) {
        return (
            <img
                src={blobUrl}
                alt=""
                className={styles.bookmarkIcon}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        );
    }

    if (shortcut.icon) {
        return (
            <img
                src={shortcut.icon}
                alt=""
                className={styles.bookmarkIcon}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        );
    }

    return (
        <span className={styles.bookmarkIconFallback}>
            {shortcut.name.trim().charAt(0).toUpperCase()}
        </span>
    );
};

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
    { isVisible, isOpen, onOpenChange, onCompactChange },
    ref,
) {
    const searchEngine = useAppStore((state) => state.searchEngine);
    const searchHistory = useAppStore((state) => state.searchHistory);
    const addSearchHistory = useAppStore((state) => state.addSearchHistory);
    const removeSearchHistory = useAppStore((state) => state.removeSearchHistory);
    const shortcuts = useAppStore((state) => state.shortcuts);
    const tags = useAppStore((state) => state.tags);
    const categories = useAppStore((state) => state.categories);

    const currentEngine = ENGINE_MAP[searchEngine] || ENGINE_MAP.bing;

    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const trimmedQuery = inputValue.trim();
    const hasQuery = trimmedQuery.length > 0;

    const bookmarkMatches = useMemo(
        () => searchBookmarks(trimmedQuery, shortcuts, tags, categories),
        [trimmedQuery, shortcuts, tags, categories],
    );

    const filteredHistory = useMemo(() => {
        if (!hasQuery) return searchHistory;
        const lower = trimmedQuery.toLowerCase();
        return searchHistory.filter((item) => item.query.toLowerCase().includes(lower));
    }, [searchHistory, trimmedQuery, hasQuery]);

    const isShown = isVisible || isOpen;

    const showDropdown =
        isShown &&
        isDropdownOpen &&
        (hasQuery ? bookmarkMatches.length > 0 || filteredHistory.length > 0 : filteredHistory.length > 0);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.key === 'Escape' && isShown) {
                setInputValue('');
                setIsDropdownOpen(false);
                onOpenChange(false);
                onCompactChange(false);
                if (typeof ref !== 'function') {
                    ref?.current?.blur();
                }
                return;
            }

            const inputFocused = typeof ref !== 'function' && ref?.current === document.activeElement;
            if (!inputFocused && e.key.length === 1) {
                e.preventDefault();
                onOpenChange(true);
                setInputValue(e.key);
                setIsDropdownOpen(true);
                requestAnimationFrame(() => {
                    if (typeof ref === 'function') return;
                    ref?.current?.focus();
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isShown, onOpenChange, onCompactChange, ref]);

    const handleBlur = () => {
        window.setTimeout(() => {
            if (wrapperRef.current?.contains(document.activeElement)) return;
            setIsDropdownOpen(false);
            onCompactChange(false);
            if (!inputValue.trim()) {
                onOpenChange(false);
            }
        }, 150);
    };

    const performWebSearch = (query: string) => {
        const q = query.trim();
        if (!q) return;
        addSearchHistory(q);
        openWebSearch(q, currentEngine);
        setIsDropdownOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performWebSearch(inputValue);
    };

    const handleHistoryClick = (query: string) => {
        setInputValue(query);
        performWebSearch(query);
    };

    const handleDeleteHistory = (e: React.MouseEvent, query: string) => {
        e.stopPropagation();
        removeSearchHistory(query);
    };

    const handleBookmarkClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsDropdownOpen(false);
    };

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            ref={wrapperRef}
            className={`${styles.searchWrapper} ${isVisible ? styles.visible : ''} ${isOpen ? styles.open : ''} ${showDropdown ? styles.expanded : ''}`}
            onClick={stopPropagation}>
            <div className={styles.glassPanel}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputContainer}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            ref={ref}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => {
                                onOpenChange(true);
                                onCompactChange(true);
                                setIsDropdownOpen(true);
                            }}
                            onBlur={handleBlur}
                            className={styles.searchInput}
                            placeholder={currentEngine.placeholder}
                            autoComplete="off"
                        />
                    </div>
                </form>

                {showDropdown && (
                    <div className={styles.dropdown}>
                        {hasQuery && bookmarkMatches.length > 0 && (
                            <div className={styles.dropdownSection}>
                                <div className={styles.sectionLabel}>书签</div>
                                <ul className={styles.dropdownList}>
                                    {bookmarkMatches.map(({ shortcut, tags: bookmarkTags, category }) => (
                                        <li key={shortcut.id}>
                                            <button
                                                type="button"
                                                className={styles.dropdownItem}
                                                onClick={() => handleBookmarkClick(shortcut.url)}>
                                                <div className={styles.bookmarkIconWrapper}>
                                                    <BookmarkIcon shortcut={shortcut} />
                                                </div>
                                                <div className={styles.bookmarkInfo}>
                                                    <span className={styles.bookmarkName}>{shortcut.name}</span>
                                                    {(category || shortcut.comment) && (
                                                        <span className={styles.bookmarkMeta}>
                                                            {[category?.name, shortcut.comment]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </span>
                                                    )}
                                                    {bookmarkTags.length > 0 && (
                                                        <div className={styles.tagList}>
                                                            {bookmarkTags.map((tag) => (
                                                                <span key={tag.id} className={styles.tagChip}>
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {filteredHistory.length > 0 && (
                            <div className={styles.dropdownSection}>
                                <div className={styles.sectionLabel}>
                                    {hasQuery ? '搜索历史' : '最近搜索'}
                                </div>
                                <ul className={styles.dropdownList}>
                                    {filteredHistory.map((item) => (
                                        <li key={item.query} className={styles.historyItem}>
                                            <button
                                                type="button"
                                                className={styles.dropdownItem}
                                                onClick={() => handleHistoryClick(item.query)}>
                                                <Search size={14} className={styles.historyIcon} />
                                                <span className={styles.historyQuery}>{item.query}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.historyDeleteBtn}
                                                aria-label={`删除搜索记录「${item.query}」`}
                                                onClick={(e) => handleDeleteHistory(e, item.query)}>
                                                <Close size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
