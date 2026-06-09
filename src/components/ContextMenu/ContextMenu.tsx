import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { calcMenuPosition } from './calcMenuPosition';
import { isContextMenuDivider } from './types';
import type { ContextMenuItem } from './types';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y, left: x });

    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;

        const rect = menu.getBoundingClientRect();
        setPosition(calcMenuPosition(x, y, rect.width, rect.height));
    }, [x, y, items]);

    const handleItemClick = (item: ContextMenuItem) => {
        if (isContextMenuDivider(item) || item.disabled) return;
        item.onClick?.();
        onClose();
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
            <div
                ref={menuRef}
                className={styles.menu}
                style={{ top: position.top, left: position.left }}
                role="menu"
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item, index) => {
                    if (isContextMenuDivider(item)) {
                        return <div key={`divider-${index}`} className={styles.divider} role="separator" />;
                    }

                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
                            disabled={item.disabled}
                            onClick={() => handleItemClick(item)}
                        >
                            {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
                            <span className={styles.menuItemLabel}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>,
        document.body,
    );
};
