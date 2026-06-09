import React from 'react';
import { SvgIcon, type SvgIconProps } from '../SvgIcon';

export const Close: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M18 6L6 18M6 6l12 12" />
    </SvgIcon>
);
