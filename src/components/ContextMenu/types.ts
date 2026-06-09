import type { ReactNode } from 'react';

export type ContextMenuActionItem = {
    id: string;
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
    danger?: boolean;
    onClick?: () => void;
};

export type ContextMenuDividerItem = {
    type: 'divider';
};

export type ContextMenuItem = ContextMenuActionItem | ContextMenuDividerItem;

export const isContextMenuDivider = (
    item: ContextMenuItem,
): item is ContextMenuDividerItem => 'type' in item && item.type === 'divider';
