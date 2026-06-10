import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Close } from '@components/Icon';
import styles from './Modal.module.css';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: React.ReactNode;
    footer?: React.ReactNode;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    lockScroll?: boolean;
    centered?: boolean;
    className?: string;
    overlayClassName?: string;
    contentClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;
    width?: string | number;
    maxWidth?: string | number;
    zIndex?: number;
}

const toCssSize = (value?: string | number) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? `${value}px` : value;
};

const ModalRoot: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    footer,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    lockScroll = true,
    centered = true,
    className,
    overlayClassName,
    contentClassName,
    headerClassName,
    bodyClassName,
    footerClassName,
    width,
    maxWidth,
    zIndex = 9999,
}) => {
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    useEffect(() => {
        if (!isOpen || !lockScroll) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, lockScroll]);

    if (!isOpen) return null;

    const hasBuiltInHeader = title !== undefined || showCloseButton;
    const contentStyle: React.CSSProperties = {
        width: toCssSize(width),
        maxWidth: toCssSize(maxWidth),
    };

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) onClose();
    };

    return createPortal(
        <div
            className={`${styles.overlay} ${centered ? '' : styles.overlayTop} ${overlayClassName ?? ''} ${className ?? ''}`}
            style={{ zIndex }}
            onClick={handleOverlayClick}
            role="presentation"
        >
            <div
                className={`${styles.content} ${contentClassName ?? ''}`}
                style={contentStyle}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === 'string' ? title : undefined}
                onClick={(event) => event.stopPropagation()}
            >
                {hasBuiltInHeader && (
                    <div className={`${styles.header} ${headerClassName ?? ''}`}>
                        {title !== undefined ? (
                            <h3 className={styles.title}>{title}</h3>
                        ) : (
                            <span />
                        )}
                        {showCloseButton && (
                            <button
                                type="button"
                                className={styles.closeBtn}
                                onClick={onClose}
                                aria-label="关闭"
                            >
                                <Close size={18} />
                            </button>
                        )}
                    </div>
                )}

                {bodyClassName ? (
                    <div className={bodyClassName}>{children}</div>
                ) : (
                    children
                )}

                {footer !== undefined && (
                    <div className={`${styles.footer} ${footerClassName ?? ''}`}>{footer}</div>
                )}
            </div>
        </div>,
        document.body,
    );
};

interface ModalSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const ModalHeader: React.FC<ModalSectionProps> = ({ className, children, ...rest }) => (
    <div className={`${styles.header} ${className ?? ''}`} {...rest}>
        {children}
    </div>
);

const ModalBody: React.FC<ModalSectionProps> = ({ className, children, ...rest }) => (
    <div className={`${styles.body} ${className ?? ''}`} {...rest}>
        {children}
    </div>
);

const ModalFooter: React.FC<ModalSectionProps> = ({ className, children, ...rest }) => (
    <div className={`${styles.footer} ${className ?? ''}`} {...rest}>
        {children}
    </div>
);

export const Modal = Object.assign(ModalRoot, {
    Header: ModalHeader,
    Body: ModalBody,
    Footer: ModalFooter,
});
