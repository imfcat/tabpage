import React from 'react';
import { SvgIcon, type SvgIconProps } from '../SvgIcon';

export const Search: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </SvgIcon>
);