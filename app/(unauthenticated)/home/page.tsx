import { GatewayProvider } from '@/providers/gateway';
import type { Metadata } from 'next';
import { Demo } from './components/demo';
import { Features } from './components/features';
import { Hero } from './components/hero';
import { Providers } from './components/providers';
import { Hero as PricingHero } from '../pricing/components/hero';

export const metadata: Metadata = {
  title: 'Визуальная AI площадка | Crafty',
  description:
    'Crafty Studio — платформа генерации контента для вашего бизнеса в Казахстане. Создавайте тексты, изображения, видео и озвучку без кода.',
};

const buttons = [
  {
    title: 'Начать бесплатно',
    link: '/auth/sign-up',
  },
  {
    title: 'Войти',
    link: '/auth/login',
  },
];

const Home = () => (
  <GatewayProvider>
    <Hero
      buttons={buttons}
    />
    <Demo />
    <Providers />
    <Features />
    <PricingHero authenticated={false} />
  </GatewayProvider>
);

export default Home;
