import type { SVGProps } from 'react';

// These components render colored logos from public assets.
// They intentionally accept SVGProps for compatibility with existing icon typing.

export const MinimaxColorIcon = (props: SVGProps<SVGSVGElement>) => (
  <img alt="Minimax" src="/demo/logoSVG/minimax-color.svg" {...(props as any)} />
);

export const LumaColorIcon = (props: SVGProps<SVGSVGElement>) => (
  <img alt="Luma" src="/demo/logoSVG/luma-color.svg" {...(props as any)} />
);

export const RunwayColorIcon = (props: SVGProps<SVGSVGElement>) => (
  <img alt="Runway" src="/demo/logoSVG/runway.svg" {...(props as any)} />
);

export const ReplicateColorIcon = (props: SVGProps<SVGSVGElement>) => (
  <img alt="Replicate" src="/demo/logoSVG/replicate.svg" {...(props as any)} />
);

export const KlingColorIcon = (props: SVGProps<SVGSVGElement>) => (
  <img alt="Kling" src="/demo/logoSVG/kling-color.svg" {...(props as any)} />
);

