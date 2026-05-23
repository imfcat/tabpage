import React from 'react';

export interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({
    size = 24,
    fill = 'none',
    stroke = 'currentColor',
    strokeWidth = 2,
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    children,
    ...props
}) => {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap={strokeLinecap}
            strokeLinejoin={strokeLinejoin}
            {...props}>
            {children}
        </svg>
    );
};
