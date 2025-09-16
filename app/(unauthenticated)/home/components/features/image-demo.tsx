import { Canvas } from '@/components/canvas';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

const nodes: Node[] = [
  {
    id: 'primitive-1',
    type: 'text',
    position: { x: 0, y: 0 },
    data: {
      text: 'Девушка (казашка) в летнем вечернем цветочном платье в спокойном городском фоне',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Девушка (казашка) в летнем вечернем цветочном платье в спокойном городском фоне',
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'transform-1',
    type: 'image',
    position: { x: 600, y: 0 },
    data: {
      model: 'seedream-4-0-250828',
      generated: {
        url: '/demo/girl.jpg',
        type: 'image/jpeg',
      },
      instructions: 'Девушкой идет по городу.',
    },
    origin: [0, 0.5],
  },
];

const edges: Edge[] = [
  {
    id: 'edge-1',
    source: 'primitive-1',
    target: 'transform-1',
    type: 'animated',
  },
];

export const ImageDemo = () => (
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
