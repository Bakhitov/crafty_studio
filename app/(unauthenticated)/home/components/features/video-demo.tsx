import { Canvas } from '@/components/canvas';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

const nodes: Node[] = [
  {
    id: 'primitive-1',
    type: 'text',
    position: { x: 0, y: 0 },
    data: {
      text: 'Мбаппе фотографируется с девушкой в синем платье',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Мбаппе фотографируется с девушкой в синем платье',
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'primitive-2',
    type: 'image',
    position: { x: 0, y: 300 },
    data: {
      content: {
        url: '/demo/boy-girl.png',
        type: 'image/png',
      },
    },
    origin: [0, 0.5],
  },
  {
    id: 'transform-1',
    type: 'video',
    position: { x: 600, y: 200 },
    data: {
      generated: {
        url: '/demo/boy-girl.mp4',
        type: 'video/mp4',
      },
      instructions: 'Позируют вместе на фоне ресторана Аул гурме',
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
  {
    id: 'edge-2',
    source: 'primitive-2',
    target: 'transform-1',
    type: 'animated',
  },
];

export const VideoDemo = () => (
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
