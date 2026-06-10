import React, { useState, useEffect } from 'react';
import { Close, Plus } from '@components/Icon';
import { Modal } from '@components/Modal';
import { useAppStore } from '@store/useAppStore';
import type { Shortcut } from '@/types';
import { AddCategoryModal } from './AddCategoryModal';
import styles from './AddLinkModal.module.css';

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcut?: Shortcut;
}

const resetFormState = () => ({
    url: '',
    name: '',
    remoteUrl: '',
    isDock: true,
    icoBlob: null as Blob | null,
    previewUrl: '',
    selectedTagNames: [] as string[],
    tagSearchInput: '',
    showTagSuggestions: false,
    categoryId: '',
    comment: '',
});

export const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, shortcut }) => {
    const isEditMode = !!shortcut;
    const addShortcut = useAppStore((state) => state.addShortcut);
    const updateShortcut = useAppStore((state) => state.updateShortcut);
    const tags = useAppStore((state) => state.tags);
    const categories = useAppStore((state) => state.categories);
    const resolveOrCreateTags = useAppStore((state) => state.resolveOrCreateTags);

    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    const [isDock, setIsDock] = useState(true);
    const [icoBlob, setIcoBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
    const [tagSearchInput, setTagSearchInput] = useState('');
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [categoryId, setCategoryId] = useState('');
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [comment, setComment] = useState('');

    const filteredTags = tags.filter((tag) => {
        const keyword = tagSearchInput.trim().toLowerCase();
        if (!keyword) return false;
        const isSelected = selectedTagNames.some(
            (name) => name.toLowerCase() === tag.name.toLowerCase(),
        );
        return !isSelected && tag.name.toLowerCase().includes(keyword);
    });

    const canCreateTag = (() => {
        const keyword = tagSearchInput.trim();
        if (!keyword) return false;
        const existsInSelected = selectedTagNames.some(
            (name) => name.toLowerCase() === keyword.toLowerCase(),
        );
        const existsInTags = tags.some(
            (tag) => tag.name.toLowerCase() === keyword.toLowerCase(),
        );
        return !existsInSelected && !existsInTags;
    })();

    const addTagByName = (tagName: string) => {
        const trimmed = tagName.trim();
        if (!trimmed) return;
        const alreadySelected = selectedTagNames.some(
            (name) => name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (alreadySelected) return;
        setSelectedTagNames((prev) => [...prev, trimmed]);
        setTagSearchInput('');
        setShowTagSuggestions(false);
    };

    const removeTag = (tagName: string) => {
        setSelectedTagNames((prev) =>
            prev.filter((name) => name.toLowerCase() !== tagName.toLowerCase()),
        );
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = tagSearchInput.trim();
            if (!keyword) return;
            const matched = tags.find(
                (tag) => tag.name.toLowerCase() === keyword.toLowerCase(),
            );
            addTagByName(matched ? matched.name : keyword);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (!isOpen) return;

        if (shortcut) {
            setUrl(shortcut.url);
            setName(shortcut.name);
            setRemoteUrl(shortcut.icon ?? '');
            setIsDock(shortcut.isPinned);
            setIcoBlob(shortcut.ico ?? null);
            if (shortcut.ico) {
                setPreviewUrl(URL.createObjectURL(shortcut.ico));
            } else {
                setPreviewUrl(shortcut.icon ?? '');
            }
            const tagNames = (shortcut.tagIds ?? [])
                .map((id) => tags.find((tag) => tag.id === id)?.name)
                .filter((name): name is string => !!name);
            setSelectedTagNames(tagNames);
            setTagSearchInput('');
            setShowTagSuggestions(false);
            setCategoryId(shortcut.categoryId ?? '');
            setComment(shortcut.comment ?? '');
            return;
        }

        const initial = resetFormState();
        setUrl(initial.url);
        setName(initial.name);
        setRemoteUrl(initial.remoteUrl);
        setIsDock(initial.isDock);
        setIcoBlob(initial.icoBlob);
        setPreviewUrl(initial.previewUrl);
        setSelectedTagNames(initial.selectedTagNames);
        setTagSearchInput(initial.tagSearchInput);
        setShowTagSuggestions(initial.showTagSuggestions);
        setCategoryId(initial.categoryId);
        setComment(initial.comment);
    }, [isOpen, shortcut, tags]);

    const fetchFaviconWithFallback = async (domain: string): Promise<{ blob: Blob; sourceUrl: string }> => {
        const providers = [
            { name: 'DuckDuckGo', url: `https://icons.duckduckgo.com/ip3/${domain}.ico` },
            { name: 'FaviconKit', url: `https://api.faviconkit.com/${domain}/64` },
            { name: 'Google', url: `https://www.google.com/s2/favicons?sz=128&domain=${domain}` },
        ];

        for (const provider of providers) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);

                const res = await fetch(provider.url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const blob = await res.blob();
                    if (blob.type.startsWith('image/')) {
                        return { blob, sourceUrl: provider.url };
                    }
                }
            } catch {
                console.warn(`Get Err: ${provider.name}`);
            }
        }
        throw new Error('所有公用图标服务皆不可用');
    };

    const handleFetchWebsiteData = async () => {
        if (!url.trim()) {
            alert('请先输入网站地址');
            return;
        }

        setIsFetching(false);
        setIsFetching(true);
        let targetUrl = url.trim();

        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
            setUrl(targetUrl);
        }

        try {
            const urlObj = new URL(targetUrl);
            const domain = urlObj.hostname;

            try {
                const result = await fetchFaviconWithFallback(domain);
                setIcoBlob(result.blob);
                setPreviewUrl(URL.createObjectURL(result.blob));
                setRemoteUrl(result.sourceUrl);
            } catch (iconErr) {
                console.error('get err:', iconErr);
            }

            try {
                const htmlResponse = await fetch(targetUrl);
                const htmlText = await htmlResponse.text();
                const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    setName(titleMatch[1].trim());
                } else {
                    setName(domain);
                }
            } catch {
                const fallbackName = domain.replace('www.', '').split('.')[0];
                setName(fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1));
            }
        } catch {
            alert('网址解析失败');
        } finally {
            setIsFetching(false);
        }
    };

    // 图片上传校验
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 500 * 1024;
        if (file.size > MAX_SIZE) {
            alert('上传图标不能超过 500KB');
            e.target.value = '';
            return;
        }

        setIcoBlob(file);
        setPreviewUrl(URL.createObjectURL(file));
        setRemoteUrl('');
    };

    // 提交存储
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) return;

        let finalIco: Blob | null = icoBlob;
        let finalIconStr: string | undefined = undefined;

        if (remoteUrl.trim() && !icoBlob) {
            try {
                const res = await fetch(remoteUrl.trim());
                if (res.ok) {
                    finalIco = await res.blob();
                } else {
                    finalIconStr = remoteUrl.trim();
                }
            } catch {
                finalIconStr = remoteUrl.trim();
            }
        }

        const tagIds = await resolveOrCreateTags(selectedTagNames);
        const payload = {
            name: name.trim(),
            url: url.trim(),
            icon: finalIconStr,
            ico: finalIco,
            isPinned: isDock,
            tagIds: tagIds.length > 0 ? tagIds : undefined,
            categoryId: categoryId || undefined,
            comment: comment.trim() || undefined,
        };

        if (isEditMode && shortcut) {
            await updateShortcut(shortcut.id, payload);
        } else {
            await addShortcut(payload);
        }

        onClose();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={isEditMode ? '编辑快捷链接' : '添加新快捷链接'}
                maxWidth={480}
                zIndex={10000}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <input
                            type="text"
                            placeholder="输入网址"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className={`${styles.input} ${styles.urlInput}`}
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={handleFetchWebsiteData}
                            disabled={isFetching}
                            className={styles.fetchBtn}>
                            {isFetching ? '获取中...' : '自动获取'}
                        </button>
                    </div>

                    <div className={styles.interactiveFlex}>
                        <div className={styles.previewBox}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="预览" className={styles.previewImg} />
                            ) : remoteUrl ? (
                                <img
                                    src={remoteUrl}
                                    alt="远程预览"
                                    className={styles.previewImg}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span className={styles.previewTextPlaceholder}>
                                    {name ? name.trim().charAt(0).toUpperCase() : '?'}
                                </span>
                            )}
                        </div>

                        <div className={styles.fieldColumn}>
                            <input
                                type="text"
                                placeholder="网站名称"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className={styles.input}
                                autoComplete="off"
                            />

                            <input
                                type="url"
                                placeholder="图标地址"
                                value={remoteUrl}
                                onChange={(e) => {
                                    setRemoteUrl(e.target.value);
                                    setIcoBlob(null);
                                    setPreviewUrl(e.target.value);
                                }}
                                className={styles.input}
                                autoComplete="off"
                            />

                            <div >
                                <label className={styles.fileLabel}>上传本地图片 (最大 500KB)：</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={styles.fileInput}
                                />
                            </div>

                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={isDock}
                                    onChange={(e) => setIsDock(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                固定至Dock栏
                            </label>
                        </div>
                    </div>

                    <div className={styles.metaSection}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>标签</label>
                            {selectedTagNames.length > 0 && (
                                <div className={styles.tagChips}>
                                    {selectedTagNames.map((tagName) => (
                                        <span key={tagName} className={styles.tagChip}>
                                            {tagName}
                                            <button
                                                type="button"
                                                className={styles.tagChipRemove}
                                                onClick={() => removeTag(tagName)}
                                                title="移除标签">
                                                <Close size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className={styles.tagInputWrapper}>
                                <input
                                    type="text"
                                    placeholder="搜索或输入标签，回车添加"
                                    value={tagSearchInput}
                                    onChange={(e) => {
                                        setTagSearchInput(e.target.value);
                                        setShowTagSuggestions(true);
                                    }}
                                    onFocus={() => setShowTagSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                                    onKeyDown={handleTagInputKeyDown}
                                    className={styles.input}
                                    autoComplete="off"
                                />
                                {showTagSuggestions && tagSearchInput.trim() && (filteredTags.length > 0 || canCreateTag) && (
                                    <ul className={styles.tagSuggestions}>
                                        {filteredTags.map((tag) => (
                                            <li key={tag.id}>
                                                <button
                                                    type="button"
                                                    className={styles.tagSuggestionItem}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => addTagByName(tag.name)}>
                                                    {tag.name}
                                                </button>
                                            </li>
                                        ))}
                                        {canCreateTag && (
                                            <li>
                                                <button
                                                    type="button"
                                                    className={`${styles.tagSuggestionItem} ${styles.tagSuggestionCreate}`}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => addTagByName(tagSearchInput)}>
                                                    创建标签「{tagSearchInput.trim()}」
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>分类</label>
                            <div className={styles.categoryRow}>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className={styles.select}>
                                    <option value="">无分类</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className={styles.addCategoryBtn}
                                    onClick={() => setIsAddCategoryOpen(true)}
                                    title="添加分类">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <textarea
                            placeholder="注释"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className={styles.textarea}
                            rows={2}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        {isEditMode ? '保存修改' : '确认保存至应用中心'}
                    </button>
                </form>
            </Modal>

            <AddCategoryModal
                isOpen={isAddCategoryOpen}
                onClose={() => setIsAddCategoryOpen(false)}
                onAdded={(id) => setCategoryId(id)}
            />
        </>
    );
};