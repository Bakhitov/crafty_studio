// import { SiX } from '@icons-pack/react-simple-icons';
import { AudioWaveformIcon, FileIcon, VideoIcon } from 'lucide-react';

import { /* CodeIcon, */ ImageIcon, TextIcon } from 'lucide-react';

export const nodeButtons = [
  {
    id: 'text',
    label: 'Prompt',
    icon: TextIcon,
    data: undefined,
  },
  {
    id: 'image',
    label: 'Image',
    icon: ImageIcon,
    data: undefined,
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: AudioWaveformIcon,
    data: undefined,
  },
  {
    id: 'video',
    label: 'Video',
    icon: VideoIcon,
    data: undefined,
  },
  // скрыто: Code
  // {
  //   id: 'code',
  //   label: 'Code',
  //   icon: CodeIcon,
  //   data: {
  //     content: { language: 'javascript' },
  //   },
  // },
  {
    id: 'file',
    label: 'File',
    icon: FileIcon,
    data: undefined,
  },
  // скрыто: Tweet
  // {
  //   id: 'tweet',
  //   label: 'Tweet',
  //   icon: SiX,
  // },
];
