const VIEWPORT_PADDING = 8;

export interface MenuPosition {
    top: number;
    left: number;
}

export const calcMenuPosition = (
    x: number,
    y: number,
    menuWidth: number,
    menuHeight: number,
): MenuPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (left + menuWidth + VIEWPORT_PADDING > viewportWidth) {
        left = viewportWidth - menuWidth - VIEWPORT_PADDING;
    }
    if (top + menuHeight + VIEWPORT_PADDING > viewportHeight) {
        top = viewportHeight - menuHeight - VIEWPORT_PADDING;
    }
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
    if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;

    return { left, top };
};
