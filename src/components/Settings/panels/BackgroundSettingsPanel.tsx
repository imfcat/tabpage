import React from 'react';
import { useAppStore } from '@store/useAppStore';
import type { BgType, BgImgType } from '@/types';
import styles from './Panels.module.css';
import { DesktopPreview } from '@components/DesktopPreview';

export const BackgroundSettingsPanel: React.FC = () => {
    const {
        bgType,
        setBgType,
        bgColor,
        setBgColor,
        bgImgType,
        setBgImgType,
        bgImgUrl,
        setBgImgUrl,
        bingBgUhd,
        setBingBgUhd,
        gradientConfig,
        setGradientConfig,
    } = useAppStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setBgImgUrl(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleColorChange = (index: number, value: string) => {
        const newColors = [...gradientConfig.colors] as [string, string];
        newColors[index] = value;
        setGradientConfig({ colors: newColors });
    };

    return (
        <div>
            <h4 className={styles.panelTitle}>背景设置</h4>
            <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                    <label>背景模式</label>
                    <select value={bgType} onChange={(e) => setBgType(e.target.value as BgType)}>
                        <option value="default">默认背景</option>
                        <option value="color">纯色背景</option>
                        <option value="gradient">渐变背景</option>
                        <option value="image">图片背景</option>
                    </select>
                </div>

                {bgType === 'color' && (
                    <div className={styles.formGroup}>
                        <label>选择颜色</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                style={{
                                    width: '45px',
                                    height: '38px',
                                    padding: '0',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                }}
                            />
                            <input
                                type="text"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                placeholder="#14161d"
                            />
                        </div>
                    </div>
                )}

                {bgType === 'gradient' && (
                    <div className={styles.gradientEditor}>
                        <div className={styles.formGroup}>
                            <label>渐变类型</label>
                            <div className={styles.tabGroup}>
                                <button
                                    className={gradientConfig.type === 'linear' ? styles.activeTab : ''}
                                    onClick={() => setGradientConfig({ type: 'linear' })}>
                                    线性渐变
                                </button>
                                <button
                                    className={gradientConfig.type === 'radial' ? styles.activeTab : ''}
                                    onClick={() => setGradientConfig({ type: 'radial' })}>
                                    中心径向
                                </button>
                            </div>
                        </div>

                        {gradientConfig.type === 'linear' && (
                            <div className={styles.formGroup}>
                                <label>渐变角度: {gradientConfig.angle}°</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={gradientConfig.angle}
                                    onChange={(e) => setGradientConfig({ angle: parseInt(e.target.value) })}
                                    className={styles.rangeInput}
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>渐变颜色</label>
                            <div className={styles.colorPickerRow}>
                                <div className={styles.colorTool}>
                                    <span>从</span>
                                    <input
                                        type="color"
                                        value={gradientConfig.colors[0]}
                                        onChange={(e) => handleColorChange(0, e.target.value)}
                                    />
                                </div>
                                <div className={styles.colorTool}>
                                    <span>至</span>
                                    <input
                                        type="color"
                                        value={gradientConfig.colors[1]}
                                        onChange={(e) => handleColorChange(1, e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {bgType === 'image' && (
                    <>
                        <div className={styles.formGroup}>
                            <label>图片来源</label>
                            <select value={bgImgType} onChange={(e) => setBgImgType(e.target.value as BgImgType)}>
                                <option value="bing">Bing 每日图片</option>
                                <option value="url">远程图片地址</option>
                                <option value="upload">本地图片上传</option>
                            </select>
                        </div>

                        {bgImgType === 'url' && (
                            <div className={styles.formGroup}>
                                <label>图片 URL 地址</label>
                                <input
                                    type="url"
                                    value={bgImgUrl}
                                    onChange={(e) => setBgImgUrl(e.target.value)}
                                    placeholder="https://example.com/background.jpg"
                                />
                            </div>
                        )}

                        {bgImgType === 'upload' && (
                            <div className={styles.formGroup}>
                                <label>上传图片</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={styles.fileInput}
                                    onChange={handleFileUpload}
                                />
                                {bgImgUrl.startsWith('data:image') && (
                                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#10b981' }}>
                                        载入成功
                                    </div>
                                )}
                            </div>
                        )}

                        {bgImgType === 'bing' && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={bingBgUhd}
                                            onChange={(e) => setBingBgUhd(e.target.checked)}
                                        />
                                        使用高清壁纸
                                    </label>
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        color: '#94a3b8',
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        lineHeight: '1.5',
                                    }}>
                                    将自动同步获取 Bing 官方每日壁纸作为背景
                                </div>
                            </>
                        )}
                    </>
                )}
                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                    <label>效果预览</label>
                    <DesktopPreview />
                </div>
            </div>
        </div>
    );
};
