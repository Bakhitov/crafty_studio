import { Canvas } from '@/components/canvas';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

const nodes: Node[] = [
  {
    id: 'image-input-a',
    type: 'image',
    position: { x: 0, y: 0 },
    data: {
      content: {
        url: '/demo/girl-blue.png',
        type: 'image/png',
      },
      description: 'Фото A',
    },
    origin: [0, 0.5],
  },
  {
    id: 'image-input-b',
    type: 'image',
    position: { x: 0, y: 220 },
    data: {
      content: {
        url: '/demo/boy.jpeg',
        type: 'image/jpeg',
      },
      description: 'Фото B',
    },
    origin: [0, 0.5],
  },
  {
    id: 'image-transform-combine',
    type: 'image',
    position: { x: 600, y: 110 },
    data: {
      model: 'seedream-4-0-250828',
      instructions: 'Парень и девушка идут вместе',
      generated: {
        url: '/demo/boy-girl.png',
        type: 'image/png',
      },
      size: '1024x1024',
    },
    origin: [0, 0.5],
  },
];

const edges: Edge[] = [
  { id: 'edge-combine-1', source: 'image-input-a', target: 'image-transform-combine', type: 'animated' },
  { id: 'edge-combine-2', source: 'image-input-b', target: 'image-transform-combine', type: 'animated' },
];

export const ImageCombineDemo = () => (
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


