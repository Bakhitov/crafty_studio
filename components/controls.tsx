'use client';

import { Controls as FlowControls } from '@xyflow/react';
import { memo } from 'react';
import { ThemeSwitcher } from './theme-switcher';

export const ControlsInner = () => (
  <FlowControls
    position="bottom-right"
    orientation="horizontal"
    className="mr-20 pr-10 mb-2 flex-col! rounded-full border bg-card/90 shadow-none! drop-shadow-xs backdrop-blur-sm sm:flex-row!"
    showInteractive={false}
  >
    <ThemeSwitcher />
  </FlowControls>
);

export const Controls = memo(ControlsInner);