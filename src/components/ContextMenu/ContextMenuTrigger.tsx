import React from 'react';
import { useContextMenu } from './ContextMenuProvider';
import type { ContextMenuItem } from './types';

interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLElement> {
    items: ContextMenuItem[] | ((event: React.MouseEvent<HTMLElement>) => ContextMenuItem[]);
    as?: 'div' | 'span';
    children: React.ReactNode;
}

export const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({
    items,
    as: Tag = 'div',
    children,
    onContextMenu,
    ...rest
}) => {
    const { open } = useContextMenu();

    const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
        onContextMenu?.(event);
        if (event.defaultPrevented) return;

        const menuItems = typeof items === 'function' ? items(event) : items;
        if (menuItems.length === 0) return;

        open(event, menuItems);
    };

    return (
        <Tag {...rest} onContextMenu={handleContextMenu}>
            {children}
        </Tag>
    );
};
