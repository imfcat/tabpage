import React, { useState } from 'react';
import { SvgIcon, type SvgIconProps } from '../SvgIcon';

export const Settings: React.FC<SvgIconProps> = (props) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    props.onMouseEnter?.(event);
    setIsHovered(true);
  };

  const handleMouseLeave = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    props.onMouseLeave?.(event);
    setIsHovered(false);
  };

  return (
    <SvgIcon
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <g
        style={{
          transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)',
          transformOrigin: 'center',
          transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </g>
    </SvgIcon>
  );
};