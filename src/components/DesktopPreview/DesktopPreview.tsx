import React from 'react';
import { useAppStore } from '@store/useAppStore';
import styles from './DesktopPreview.module.css';
import { Search } from '@components/Icon'; 

export const DesktopPreview: React.FC = () => {
    const bgType = useAppStore((state) => state.bgType);
    const bgColor = useAppStore((state) => state.bgColor);
    const bgGradient = useAppStore((state) => state.bgGradient);
    const bgImgType = useAppStore((state) => state.bgImgType);
    const bgImgUrl = useAppStore((state) => state.bgImgUrl);

    const getPreviewStyle = (): React.CSSProperties => {
        switch (bgType) {
            case 'color':
                return { backgroundColor: bgColor, backgroundImage: 'none' };
            case 'gradient':
                return { backgroundImage: bgGradient };
            case 'image': {
                const finalUrl =
                    bgImgType === 'bing' ? 'https://bing.biturl.top/?resolution=1920&format=image' : bgImgUrl;
                return {
                    backgroundImage: finalUrl ? `url(${finalUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                };
            }
            case 'default':
            default:
                return { backgroundImage: 'radial-gradient(circle at center, #232528 0%, #0f111a 100%)' };
        }
    };

    return (
        <div className={styles.previewContainer}>
            <div className={styles.previewBox} style={getPreviewStyle()}>
                <div className={styles.mockClock}>12:00</div>
                <div className={styles.mockSearch}>
                    <Search size={6} className={styles.searchIcon} />
                </div>
                <div className={styles.mockDock}>
                    <span className={styles.mockDockDot}></span>
                    <span className={styles.mockDockDot}></span>
                    <span className={styles.mockDockDot}></span>
                </div>
            </div>
        </div>
    );
};
