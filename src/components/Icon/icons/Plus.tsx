import React from 'react';
import { SvgIcon, type SvgIconProps } from '../SvgIcon';

export const Plus: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);