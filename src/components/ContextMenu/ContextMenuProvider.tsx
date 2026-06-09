import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItem } from './types';

interface ContextMenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
}

interface ContextMenuContextValue {
    open: (event: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => void;
    close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export const ContextMenuProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [menuState, setMenuState] = useState<ContextMenuState | null>(null);

    const close = useCallback(() => setMenuState(null), []);

    const open = useCallback((event: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
        event.preventDefault();
        event.stopPropagation();
        setMenuState({
            x: event.clientX,
            y: event.clientY,
            items,
        });
    }, []);

    useEffect(() => {
        if (!menuState) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };

        const handleScroll = () => close();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [menuState, close]);

    return (
        <ContextMenuContext.Provider value={{ open, close }}>
            {children}
            {menuState && (
                <ContextMenu
                    x={menuState.x}
                    y={menuState.y}
                    items={menuState.items}
                    onClose={close}
                />
            )}
        </ContextMenuContext.Provider>
    );
};

export const useContextMenu = (): ContextMenuContextValue => {
    const context = useContext(ContextMenuContext);
    if (!context) {
        throw new Error('useContextMenu must be used within ContextMenuProvider');
    }
    return context;
};
