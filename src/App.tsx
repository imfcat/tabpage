import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { Dock } from './components/Dock';
import { SettingsDialog } from './components/Settings';
import { useAppStore } from './store/useAppStore';
import './App.css';

export const App: React.FC = () => {
    const [isCenterHovered, setIsCenterHovered] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSearchCompact, setIsSearchCompact] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const _hasHydrated = useAppStore((state) => state._hasHydrated);
    const bgType = useAppStore((state) => state.bgType);
    const bgColor = useAppStore((state) => state.bgColor);
    const bgGradient = useAppStore((state) => state.bgGradient);
    const bgBlobUrl = useAppStore((state) => state.bgBlobUrl);
    const bgBlobUrlOverlay = useAppStore((state) => state.bgBlobUrlOverlay);
    const completeBgTransition = useAppStore((state) => state.completeBgTransition);

    const [overlayVisible, setOverlayVisible] = useState(false);

    useEffect(() => {
        if (!bgBlobUrlOverlay) {
            setOverlayVisible(false);
            return;
        }

        setOverlayVisible(false);
        const frameId = requestAnimationFrame(() => {
            setOverlayVisible(true);
        });
        return () => cancelAnimationFrame(frameId);
    }, [bgBlobUrlOverlay]);

    const handleBgOverlayTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
        if (event.propertyName !== 'opacity' || !overlayVisible) return;
        completeBgTransition();
        setOverlayVisible(false);
    }, [overlayVisible, completeBgTransition]);

    const isSearchShown = isCenterHovered || isSearchOpen;

    const focusSearch = useCallback(() => {
        if (isSearchShown) {
            searchInputRef.current?.focus();
        }
    }, [isSearchShown]);

    const getBackgroundStyle = (): React.CSSProperties => {
        if (!_hasHydrated) return {};

        switch (bgType) {
            case 'color':
                return { backgroundColor: bgColor, backgroundImage: 'none' };
            case 'gradient':
                return { backgroundImage: bgGradient };
            case 'image':
                return {};
            case 'default':
            default:
                return {};
        }
    };

    const centerClassName = [
        'centerContainer',
        isSearchShown ? 'searchOpen' : '',
        isSearchCompact ? 'searchCompact' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const showBgLayers = _hasHydrated && bgType === 'image' && (bgBlobUrl || bgBlobUrlOverlay);

    return (
        <div className="appViewport" style={getBackgroundStyle()}>
            {showBgLayers && (
                <div className="appBgLayers" aria-hidden="true">
                    {bgBlobUrl && (
                        <div
                            className="appBgLayer"
                            style={{ backgroundImage: `url(${bgBlobUrl})` }}
                        />
                    )}
                    {bgBlobUrlOverlay && (
                        <div
                            className={`appBgLayer appBgLayerOverlay${overlayVisible ? ' visible' : ''}`}
                            style={{ backgroundImage: `url(${bgBlobUrlOverlay})` }}
                            onTransitionEnd={handleBgOverlayTransitionEnd}
                        />
                    )}
                </div>
            )}
            <div className="appContent">
                <div
                    className={centerClassName}
                    onMouseEnter={() => setIsCenterHovered(true)}
                    onMouseLeave={() => setIsCenterHovered(false)}
                    onClick={focusSearch}>
                    <Clock isCompact={isSearchCompact} />
                    <SearchBar
                        ref={searchInputRef}
                        isVisible={isCenterHovered}
                        isOpen={isSearchOpen}
                        onOpenChange={setIsSearchOpen}
                        onCompactChange={setIsSearchCompact}
                    />
                </div>

                <Dock />
                <SettingsDialog />
            </div>
        </div>
    );
};

export default App;
