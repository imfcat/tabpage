import React, { useState } from 'react';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { Dock } from './components/Dock';
import { SettingsDialog } from './components/Settings';
import { useAppStore } from './store/useAppStore';
import './App.css';

export const App: React.FC = () => {
    const [isCenterHovered, setIsCenterHovered] = useState<boolean>(false);

    const _hasHydrated = useAppStore((state) => state._hasHydrated);
    const bgType = useAppStore((state) => state.bgType);
    const bgColor = useAppStore((state) => state.bgColor);
    const bgGradient = useAppStore((state) => state.bgGradient);
    const bgImgType = useAppStore((state) => state.bgImgType);
    const bgImgUrl = useAppStore((state) => state.bgImgUrl);

    const getBackgroundStyle = (): React.CSSProperties => {
        if (!_hasHydrated) return {};

        switch (bgType) {
            case 'color':
                return { backgroundColor: bgColor, backgroundImage: 'none' };
            case 'gradient':
                return { backgroundImage: bgGradient };
            case 'image': {
                const finalUrl = bgImgType === 'bing' 
                    ? 'https://bing.biturl.top/?resolution=1920&format=image' 
                    : bgImgUrl;
                return {
                    backgroundImage: finalUrl ? `url(${finalUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                };
            }
            case 'default':
            default:
                return {};
        }
    };

    return (
        <div className="appViewport" style={getBackgroundStyle()}>
            <div
                className="centerContainer"
                onMouseEnter={() => setIsCenterHovered(true)}
                onMouseLeave={() => setIsCenterHovered(false)}
            >
                <Clock />
                <SearchBar isVisible={isCenterHovered} />
            </div>

            <Dock />
            <SettingsDialog />
        </div>
    );
};

export default App;