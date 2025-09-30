import { Canvas } from '@/components/canvas';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

const nodes: Node[] = [
  {
    id: 'primitive-1',
    type: 'text',
    position: { x: 0, y: 0 },
    data: {
      text: 'Девушка делится со своими подписчиками о покупке нового платья',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Девушка делится со своими подписчиками о покупке нового платья',
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'primitive-2',
    type: 'text',
    position: { x: 0, y: 200 },
    data: {
      text: 'Сгенерируй пост для Instagram, оформленный в лайфстайл стиле, в 2 абзацах',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Сгенерируй пост для Instagram, оформленный в лайфстайл стиле, в 2 абзацах',
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'transform-1',
    type: 'text',
    position: { x: 600, y: 100 },
    data: {
      instructions: 'Добавьте тексту изюминку',
      generated: {
        text: 'Я сегодня купила новое платье! 💃🛍️ Зеленый оттенок идеально подходит для вечернего мероприятия в национальном стиле. Не могу дождаться, чтобы одеть его на мероприятие в ресторане Аул гурме! 💕 #новоеплатье #новостилайв',
      },
    },
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

export const TextDemo = () => (
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
