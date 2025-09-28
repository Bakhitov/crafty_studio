import type { SVGProps } from 'react';

// Utility to create icon components from public assets as primary provider icons
const makeAssetIcon = (src: string, alt: string) =>
  (props: SVGProps<SVGSVGElement>) => (
    <img alt={alt} src={src} {...(props as any)} />
  );

export const AlibabaCloudColorIcon = makeAssetIcon('/demo/logoSVG/alibabacloud-color.svg', 'Alibaba Cloud');
export const AmazonColorIcon = makeAssetIcon('/demo/logoSVG/aws-color.svg', 'Amazon');
export const AzureColorIcon = makeAssetIcon('/demo/logoSVG/azure-color.svg', 'Azure');
export const BedrockColorIcon = makeAssetIcon('/demo/logoSVG/bedrock-color.svg', 'Amazon Bedrock');
export const MinimaxColorIcon = makeAssetIcon('/demo/logoSVG/minimax-color.svg', 'Minimax');
export const LumaColorIcon = makeAssetIcon('/demo/logoSVG/luma-color.svg', 'Luma');
export const RunwayColorIcon = makeAssetIcon('/demo/logoSVG/runway.svg', 'Runway');
export const ReplicateColorIcon = makeAssetIcon('/demo/logoSVG/replicate.svg', 'Replicate');
export const KlingColorIcon = makeAssetIcon('/demo/logoSVG/kling-color.svg', 'Kling');
export const CohereColorIcon = makeAssetIcon('/demo/logoSVG/cohere-color.svg', 'Cohere');
export const DeepseekColorIcon = makeAssetIcon('/demo/logoSVG/deepseek-color.svg', 'DeepSeek');
export const GroqColorIcon = makeAssetIcon('/demo/logoSVG/groq.svg', 'Groq');
export const GoogleColorIcon = makeAssetIcon('/demo/logoSVG/google-color.svg', 'Google');
export const MetaColorIcon = makeAssetIcon('/demo/logoSVG/meta-color.svg', 'Meta');
export const XaiColorIcon = makeAssetIcon('/demo/logoSVG/xai.svg', 'x.ai');
export const TogetherColorIcon = makeAssetIcon('/demo/logoSVG/together-color.svg', 'Together');
export const PerplexityColorIcon = makeAssetIcon('/demo/logoSVG/perplexity-color.svg', 'Perplexity');
export const VertexAiColorIcon = makeAssetIcon('/demo/logoSVG/vertexai-color.svg', 'Vertex AI');
export const ZaiColorIcon = makeAssetIcon('/demo/logoSVG/zai.svg', 'Zai');
export const MistralColorIcon = makeAssetIcon('/demo/logoSVG/mistral-color.svg', 'Mistral');
export const FireworksColorIcon = makeAssetIcon('/demo/logoSVG/fireworks-color.svg', 'Fireworks');

