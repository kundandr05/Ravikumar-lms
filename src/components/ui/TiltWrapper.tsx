'use client';

import React from 'react';
import Tilt from 'react-parallax-tilt';

export function TiltWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <Tilt
      className={className}
      perspective={1000}
      glareEnable={true}
      glareMaxOpacity={0.25}
      glarePosition="all"
      scale={1.05}
      transitionSpeed={400}
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
    >
      {children}
    </Tilt>
  );
}
