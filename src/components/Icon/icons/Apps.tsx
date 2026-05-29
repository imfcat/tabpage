import React, { useState } from 'react';
import { SvgIcon, type SvgIconProps } from '../SvgIcon';

export const Apps: React.FC<SvgIconProps> = (props) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    props.onMouseEnter?.(event);
    setIsHovered(true);
  };

  const handleMouseLeave = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    props.onMouseLeave?.(event);
    setIsHovered(false);
  };

  const compactCoords = [5, 12, 19];
  const spreadCoords = [3, 12, 21];

  const coords = isHovered ? spreadCoords : compactCoords;

  return (
    <SvgIcon
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <g
        style={{
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <circle cx={coords[0]} cy={coords[0]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
        <circle cx={coords[1]} cy={coords[0]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
        <circle cx={coords[2]} cy={coords[0]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />

        <circle cx={coords[0]} cy={coords[1]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
        <circle cx={coords[1]} cy={coords[1]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
        <circle cx={coords[2]} cy={coords[1]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />

        <circle cx={coords[0]} cy={coords[2]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
        <circle cx={coords[1]} cy={coords[2]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
        <circle cx={coords[2]} cy={coords[2]} r="1" style={{ transition: 'cx 0.3s, cy 0.3s' }} />
      </g>
    </SvgIcon>
  );
};