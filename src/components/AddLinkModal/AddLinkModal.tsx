import React, { useState, useEffect } from 'react';
import { useAppStore } from '@store/useAppStore';
import styles from './AddLinkModal.module.css';

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose }) => {
    const addShortcut = useAppStore((state) => state.addShortcut);

    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    const [isDock, setIsDock] = useState(true);
    const [icoBlob, setIcoBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (!isOpen) return null;

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

        addShortcut({
            name: name.trim(),
            url: url.trim(),
            icon: finalIconStr,
            ico: finalIco,
            isPinned: isDock,
        });

        setUrl('');
        setName('');
        setRemoteUrl('');
        setIcoBlob(null);
        setPreviewUrl('');
        setIsDock(true);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>添加新快捷链接</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>

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

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                    <button type="submit" className={styles.submitBtn}>
                        确认保存至应用中心
                    </button>
                </form>
            </div>
        </div>
    );
};