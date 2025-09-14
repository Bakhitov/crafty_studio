import { currentUser, currentUserProfile } from '@/lib/auth';
import { env } from '@/lib/env';
import { isManualBilling } from '@/lib/billing';
import type { Metadata } from 'next';
import { Hero } from './components/hero';

export const metadata: Metadata = {
  title: 'Crafty studio | Тарифы',
  description: 'Выберите план для доступа ко всем функциям.',
};

const PricingPage = async () => {
  const user = await currentUser();
  let currentPlan: 'hobby' | 'pro' | undefined;

  if (user) {
    const profile = await currentUserProfile();

    if (profile) {
      if (profile.productId === env.STRIPE_HOBBY_PRODUCT_ID) {
        currentPlan = 'hobby';
      } else if (profile.productId === env.STRIPE_PRO_PRODUCT_ID) {
        currentPlan = 'pro';
      }
    }
  }

  const manualBilling = isManualBilling();
  return (
    <Hero
      currentPlan={currentPlan}
      authenticated={Boolean(user)}
      manualBilling={manualBilling}
    />
  );
};

export default PricingPage;
