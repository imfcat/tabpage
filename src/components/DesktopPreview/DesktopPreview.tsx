import React from 'react';
import { useAppStore } from '@store/useAppStore';
import styles from './DesktopPreview.module.css';
import { Search } from '@components/Icon'; 

export const DesktopPreview: React.FC = () => {
    const _hasHydrated = useAppStore((state) => state._hasHydrated);
    const bgType = useAppStore((state) => state.bgType);
    const bgColor = useAppStore((state) => state.bgColor);
    const bgGradient = useAppStore((state) => state.bgGradient);
    const bgBlobUrl = useAppStore((state) => state.bgBlobUrl);

    const getPreviewStyle = (): React.CSSProperties => {
        if (!_hasHydrated) {
            return { backgroundColor: '#14161d', backgroundImage: 'none' };
        }

        switch (bgType) {
            case 'color':
                return { backgroundColor: bgColor, backgroundImage: 'none' };
            case 'gradient':
                return { backgroundImage: bgGradient };
            case 'image': {
                return {
                    backgroundColor: '#14161d',
                    backgroundImage: bgBlobUrl ? `url(${bgBlobUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transition: 'background-image 0.4s ease-in-out',
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
