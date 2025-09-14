import { Canvas } from '@/components/canvas';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

const nodes: Node[] = [
  {
    id: 'image-input-1',
    type: 'image',
    position: { x: 0, y: 20 },
    data: {
      content: {
        url: '/demo/delphiniums-anime.jpg',
        type: 'image/jpeg',
      },
      description: 'Пример исходной фотографии',
    },
    origin: [0, 0.5],
  },
  {
    id: 'image-transform-1',
    type: 'image',
    position: { x: 600, y: 20 },
    data: {
      model: 'seedream-4-0-250828',
      instructions: 'Сгенерировать вариации по исходной фотографии',
      generated: {
        url: '/demo/delphiniums-fantasy.jpg',
        type: 'image/jpeg',
      },
      size: '1024x1024',
    },
    origin: [0, 0.5],
  },
];

const edges: Edge[] = [
  {
    id: 'edge-image-1',
    source: 'image-input-1',
    target: 'image-transform-1',
    type: 'animated',
  },
];

export const ImageFromPhotoDemo = () => (
  <ReactFlowProvider>
    <Canvas
      nodes={nodes}
      edges={edges}
      panOnScroll={false}
      zoomOnScroll={false}
      preventScrolling={false}
      fitViewOptions={{
        minZoom: 0,
      }}
    />
  </ReactFlowProvider>
);


