import type { Edge, Node, Viewport } from '@xyflow/react';

export const sampleNodes: Node[] = [
  {
    id: 'vgWgaLMHG6Y6MMwu_VF1D',
    type: 'text',
    data: {
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
      text: 'Девушка делится со своими подписчиками о покупке нового платья',
    },
    position: { x: -658, y: -100 },
    origin: [0, 0.5],
  },
  {
    id: 'JJzrv-IFLZADn1asQfMOU',
    type: 'text',
    position: { x: 161, y: -440 },
    data: {
      generated: {
        text: 'Я сегодня купила новое платье! 💃🛍️ Цветочный принт идеально подходит для лета. Не могу дождаться, чтобы носить его на свидании на выходных! 💕 #новоеплатье #новостиповсети',
      },
      instructions: 'Сгенерируй пост для Instagram, оформленный в лайфстайл стиле, в 2 абзацах',
    },
    origin: [0, 0.5],
  },
  {
    id: 'wiHfpZJA_mGy1vQOULuOA',
    type: 'image',
    position: { x: -100, y: 200 },
    data: {
      generated: {
        url: '/demo/girl.jpg',
        type: 'image/jpeg',
      },
      instructions: 'Сгенерировать  изображение',
    },
    origin: [0, 0.5],
  },
  {
    id: 'LChjpwMpTwx4CaEypTsAr',
    type: 'audio',
    data: {
      content: {
        url: '/demo/girlinput.mp3',
        type: 'audio/mpeg',
      },
    },
    position: { x: -656, y: 150 },
    origin: [0, 0.5],
  },
  {
    id: 'lMrWEm_K9EbGledg2JzAY',
    type: 'video',
    data: {
      instructions: 'Парень неожиданно целует девушку',
      generated: {
        url: '/demo/boy-girl.mp4',
        type: 'video/mp4',
      },
    },
    position: { x: 1000, y: 400 },
    origin: [0, 0.5],
  },
  {
    id: 'bKrEf7e5GPMu0-uphit6D',
    type: 'text',
    data: {
      generated: {
        text: 'Квадратная цветная фотография молодой девушки, идущей по тихой улице в начале заката. Портрет в полный рост, сцены в центре, с небольшой глубиной резкости и мягким бока; теплая, естественная подсветка создает романтическое, спокойное настроение. На ней плавное платье средней длины с цветочным принтом в ярких розовых и оранжевых тонах; движение юбки добавляет нежный динамизм. Фон: размытые деревья и здания, ровные мягкие тона.',
      },
      instructions: 'Детально опиши изображение',
    },
    position: { x: 700, y: -100 },
    origin: [0, 0.5],
  },
  {
    id: 'bS3iDAT96T6tlUD549HI4',
    type: 'image',
    data: {
      generated: {
        url: '/demo/girl-blue.png',
        type: 'image/png',
      },
      instructions: 'Измени цвет платья на синее',
    },
    position: { x: 500, y: 400 },
    origin: [0, 0.5],
  },
  {
    id: '-UWhefN0_XOKHo7XbN2pY',
    type: 'audio',
    data: {
      generated: {
        url: '/demo/delphiniums-transform.mp3',
        type: 'audio/mpeg',
      },
      instructions: 'Озвучить текст поста в эмоциональном тоне.',
    },
    position: { x: 661, y: -440 },
    origin: [0, 0.5],
  },
];

export const sampleEdges: Edge[] = [
  {
    id: 'YJr0HFcANkUjBhA7Aogl0',
    source: 'vgWgaLMHG6Y6MMwu_VF1D',
    target: 'JJzrv-IFLZADn1asQfMOU',
    type: 'animated',
  },
  {
    id: '23onV03W3MzwvPHg5a5VG',
    source: 'vgWgaLMHG6Y6MMwu_VF1D',
    target: 'wiHfpZJA_mGy1vQOULuOA',
    type: 'animated',
  },
  {
    source: 'wiHfpZJA_mGy1vQOULuOA',
    target: 'bS3iDAT96T6tlUD549HI4',
    type: 'animated',
    id: 'xy-edge__wiHfpZJA_mGy1vQOULuOA-bS3iDAT96T6tlUD549HI4',
  },
  {
    source: 'wiHfpZJA_mGy1vQOULuOA',
    target: 'bKrEf7e5GPMu0-uphit6D',
    type: 'animated',
    id: 'xy-edge__wiHfpZJA_mGy1vQOULuOA-bKrEf7e5GPMu0-uphit6D',
  },
  {
    source: 'bS3iDAT96T6tlUD549HI4',
    target: 'lMrWEm_K9EbGledg2JzAY',
    type: 'animated',
    id: 'xy-edge__bS3iDAT96T6tlUD549HI4-lMrWEm_K9EbGledg2JzAY',
  },
  {
    source: 'JJzrv-IFLZADn1asQfMOU',
    target: '-UWhefN0_XOKHo7XbN2pY',
    type: 'animated',
    id: 'xy-edge__JJzrv-IFLZADn1asQfMOU--UWhefN0_XOKHo7XbN2pY',
  },
  {
    source: 'LChjpwMpTwx4CaEypTsAr',
    target: 'wiHfpZJA_mGy1vQOULuOA',
    type: 'animated',
    id: 'xy-edge__LChjpwMpTwx4CaEypTsAr-wiHfpZJA_mGy1vQOULuOA',
  },
];

export const sampleViewport: Viewport = {
  x: 423.6692594530857,
  y: 411.67031344536565,
  zoom: 0.5,
};
