import type { PriceBracket } from '@/providers/gateway/client';
import { BlackForestLabsIcon, HumeIcon, LmntIcon, MoonshotAiIcon, MorphIcon, InceptionIcon, OpenAiIcon, UnknownIcon, ArkIcon } from './icons';
import { BasetenIcon, CerebrasIcon, DeepinfraIcon, FalIcon, NovitaIcon } from './icons';
import {
  AlibabaCloudColorIcon,
  AmazonColorIcon,
  AzureColorIcon,
  BedrockColorIcon,
  AnthropicColorIcon,
  MinimaxColorIcon,
  LumaColorIcon,
  RunwayColorIcon,
  ReplicateColorIcon,
  KlingColorIcon,
  CohereColorIcon,
  DeepseekColorIcon,
  GroqColorIcon,
  GeminiColorIcon,
  MetaColorIcon,
  XaiColorIcon,
  TogetherColorIcon,
  PerplexityColorIcon,
  VertexAiColorIcon,
  ZaiColorIcon,
  MistralColorIcon,
  FireworksColorIcon,
  VercelColorIcon,
  BytedanceColorIcon,
} from './icons-vendors';
import { MinimaxColorIcon, LumaColorIcon, RunwayColorIcon, ReplicateColorIcon, KlingColorIcon } from './icons-vendors';

export type CraftyProvider = {
  id: string;
  name: string;
  icon: typeof OpenAiIcon;
};

export const providers = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: OpenAiIcon,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    icon: AnthropicColorIcon as unknown as typeof OpenAiIcon,
  },
  google: {
    id: 'google',
    name: 'Google',
    icon: GeminiColorIcon as unknown as typeof OpenAiIcon,
  },
  vertex: {
    id: 'vertex',
    name: 'Vertex',
    icon: VertexAiColorIcon as unknown as typeof OpenAiIcon,
  },
  meta: {
    id: 'meta',
    name: 'Meta',
    icon: MetaColorIcon as unknown as typeof OpenAiIcon,
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    icon: XaiColorIcon as unknown as typeof OpenAiIcon,
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    icon: VercelColorIcon as unknown as typeof OpenAiIcon,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    icon: GroqColorIcon as unknown as typeof OpenAiIcon,
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    icon: MistralColorIcon as unknown as typeof OpenAiIcon,
  },
  luma: {
    id: 'luma',
    name: 'Luma',
    icon: LumaColorIcon as unknown as typeof OpenAiIcon,
  },
  minimax: {
    id: 'minimax',
    name: 'Minimax',
    icon: MinimaxColorIcon as unknown as typeof OpenAiIcon,
  },
  hume: {
    id: 'hume',
    name: 'Hume',
    icon: HumeIcon,
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    icon: CohereColorIcon as unknown as typeof OpenAiIcon,
  },
  lmnt: {
    id: 'lmnt',
    name: 'LMNT',
    icon: LmntIcon,
  },
  'black-forest-labs': {
    id: 'black-forest-labs',
    name: 'Black Forest Labs',
    icon: BlackForestLabsIcon,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: DeepseekColorIcon as unknown as typeof OpenAiIcon,
  },
  runway: {
    id: 'runway',
    name: 'Runway',
    icon: RunwayColorIcon as unknown as typeof OpenAiIcon,
  },
  together: {
    id: 'together',
    name: 'Together',
    icon: TogetherColorIcon as unknown as typeof OpenAiIcon,
  },
  alibaba: {
    id: 'alibaba',
    name: 'Alibaba Cloud',
    icon: AlibabaCloudColorIcon as unknown as typeof OpenAiIcon,
  },
  bedrock: {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    icon: BedrockColorIcon as unknown as typeof OpenAiIcon,
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    icon: AmazonColorIcon as unknown as typeof OpenAiIcon,
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    icon: CerebrasIcon,
  },
  deepinfra: {
    id: 'deepinfra',
    name: 'Deepinfra',
    icon: DeepinfraIcon,
  },
  fal: {
    id: 'fal',
    name: 'Fal',
    icon: FalIcon,
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks',
    icon: FireworksColorIcon as unknown as typeof OpenAiIcon,
  },
  kling: {
    id: 'kling',
    name: 'Kling',
    icon: KlingColorIcon as unknown as typeof OpenAiIcon,
  },
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    icon: ReplicateColorIcon as unknown as typeof OpenAiIcon,
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    icon: PerplexityIcon,
  },
  baseten: {
    id: 'baseten',
    name: 'Baseten',
    icon: BasetenIcon,
  },
  azure: {
    id: 'azure',
    name: 'Azure',
    icon: AzureIcon,
  },
  moonshotai: {
    id: 'moonshotai',
    name: 'Moonshot AI',
    icon: MoonshotAiIcon,
  },
  morph: {
    id: 'morph',
    name: 'Morph',
    icon: MorphIcon,
  },
  inception: {
    id: 'inception',
    name: 'Inception',
    icon: InceptionIcon,
  },
  zai: {
    id: 'zai',
    name: 'Zai',
    icon: ZaiIcon,
  },
  novita: {
    id: 'novita',
    name: 'Novita',
    icon: NovitaIcon,
  },
  aiml: {
    id: 'aiml',
    name: 'AIML API',
    icon: UnknownIcon,
  },
  ark: {
    id: 'ark',
    name: 'Ark',
    icon: BytedanceColorIcon as unknown as typeof OpenAiIcon,
  },
  unknown: {
    id: 'unknown',
    name: 'Other',
    icon: UnknownIcon,
  },
};

export type CraftyModel = {
  // Inherits from chef if not provided
  icon?: typeof OpenAiIcon;
  label: string;
  chef: CraftyProvider;
  providers: CraftyProvider[];
  legacy?: boolean;
  priceIndicator?: PriceBracket;
  disabled?: boolean;
  default?: boolean;
};

export const developerIcons: Record<string, typeof OpenAiIcon> = {
  google: GoogleIcon,
  openai: OpenAiIcon,
  anthropic: AnthropicIcon,
  meta: MetaIcon,
  cohere: CohereIcon,
  mistral: MistralIcon,
  flux: BlackForestLabsIcon,
  bytedance: ArkIcon,
  stabilityai: UnknownIcon,
  recraftai: UnknownIcon,
  tripoai: UnknownIcon,
  alibabacloud: AlibabaCloudIcon,
};