'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import NumberFlow from '@number-flow/react';
import {
  BrainIcon,
  CoinsIcon,
  Flower2Icon,
  FlowerIcon,
  LeafIcon,
  LifeBuoyIcon,
  type LucideIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { type ComponentProps, type ReactNode, type ComponentType, useMemo, useState } from 'react';
import { HiOutlineCode } from "react-icons/hi";

type HeroProps = {
  currentPlan?: 'hobby' | 'pro' | undefined;
  authenticated: boolean;
  manualBilling?: boolean;
};

type IconLike = ComponentType<{ size?: number; className?: string }>;

type Plan = {
  icon: IconLike;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: {
    label: ReactNode;
    icon: IconLike;
  }[];
  ctaLink: string;
  ctaText: string;
  variant: ComponentProps<typeof Button>['variant'];
};

export const Hero = ({ currentPlan, authenticated, manualBilling }: HeroProps) => {
  const [yearly, setYearly] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const tokenPacks = [
    { credits: 500, price: 3990 },
    { credits: 1000, price: 5990 },
    { credits: 1500, price: 7990 },
    { credits: 2000, price: 9990 },
  ];

  const plans = useMemo(() => {
    const free: Plan = {
      icon: LeafIcon,
      name: 'Хобби',
      description: 'Для личного использования и тестирования.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        {
          label: '50 кредитов / месяц',
          icon: CoinsIcon,
        },
        {
          label: 'Базовые AI модели',
          icon: BrainIcon,
        },
        {
          label: 'Общая поддержка',
          icon: LifeBuoyIcon,
        },
        {
          label: 'Один пользователь',
          icon: UserIcon,
        },
      ],
      ctaLink: '/auth/sign-up',
      ctaText: 'Начать',
      variant: 'outline',
    };

    const pro: Plan = {
      icon: FlowerIcon,
      name: 'Про',
      description: 'Для профессионального использования или небольших команд.',
      monthlyPrice: 9990,
      yearlyPrice: 7990,
      features: [
        {
          label: '2000 кредитов / месяц',
          icon: CoinsIcon,
        },
        {
          label: 'Все AI модели',
          icon: BrainIcon,
        },
        {
          label: 'Приоритетная тех.поддержка',
          icon: LifeBuoyIcon,
        },
        {
          label: (
            <>
              Выделенный менеджер <Badge variant="secondary">консультация</Badge>
            </>
          ),
          icon: UsersIcon,
        },
      ],
      variant: 'outline',
      ctaLink: '#pro',
      ctaText: 'Связаться',
    };

    const enterprise: Plan = {
      icon: Flower2Icon,
      name: 'Корпоративный',
      description: 'Для больших команд или корпоративного использования.',
      monthlyPrice: -1,
      yearlyPrice: -1,
      features: [
        {
          label: 'Неограниченные кредиты',
          icon: CoinsIcon,
        },
        {
          label: 'Пользовательские AI модели',
          icon: BrainIcon,
        },
        {
          label: 'Персональная тех.поддержка',
          icon: LifeBuoyIcon,
        },
        {
          label: 'Разработка под клиента',
          icon: HiOutlineCode,
        },
      ],
      ctaLink: '#enterprise',
      ctaText: 'Связаться',
      variant: 'outline',
    };

    if (authenticated && !manualBilling) {
      free.ctaLink = `/api/checkout?product=hobby&frequency=${yearly ? 'year' : 'month'}`;
      pro.ctaLink = `/api/checkout?product=pro&frequency=${yearly ? 'year' : 'month'}`;
    }
    if (authenticated && manualBilling) {
      free.ctaLink = `/api/admin/billing?claim=hobby`;
    }
    if (!authenticated) {
      free.ctaLink = '/auth/sign-up?next=/pricing';
    }

    if (currentPlan === 'hobby') {
      free.ctaText = 'Управлять';
      pro.ctaText = 'Обновить';
      pro.variant = 'default';
    } else if (currentPlan === 'pro') {
      pro.ctaText = 'Управлять';
      free.ctaText = 'Понизить';
      enterprise.variant = 'default';
    } else if (currentPlan === 'enterprise') {
      enterprise.ctaText = 'Управлять';
      free.ctaText = 'Понизить';
      pro.ctaText = 'Понизить';
    }

    return [free, pro, enterprise];
  }, [currentPlan, yearly, authenticated, manualBilling]);

  return (
    <div className="relative grid w-full grid-cols-[0.2fr_3fr_0.2fr] md:grid-cols-[0.5fr_3fr_0.5fr]">
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 left-0 h-8 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 h-6 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>
      {/* Top row */}
      <div className="border-b border-dotted" />
      <div className="border-x border-b border-dotted py-6" />
      <div className="border-b border-dotted" />
      {/* Middle row - main content */}
      <div className="border-b border-dotted" />
      <div className="relative flex items-center justify-center border-x border-b border-dotted">
        {/* Corner decorations */}
        <div className="-left-[3px] -top-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>
        <div className="-right-[3px] -top-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>
        <div className="-bottom-[3px] -left-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>
        <div className="-bottom-[3px] -right-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center px-5 py-16">
          <h1 className="mb-5 text-center font-medium text-4xl tracking-[-0.12rem] md:text-6xl">
            Простые,{' '}
            <span className="mr-1 font-semibold font-serif text-5xl italic md:text-7xl">
              прозрачные
            </span>{' '}
            тарифы
          </h1>

          <p className="max-w-3xl text-center text-muted-foreground tracking-[-0.01rem] sm:text-lg">
            Crafty использует модель фиксированной платы с доплатой за превышение. 
            Это означает, что вы платите фиксированную ежемесячную стоимость, 
            которая включает определённое количество кредитов. Если вы превысите 
            лимит кредитов, вы просто доплачиваете за дополнительное использование.
          </p>

          {/* Pricing Toggle */}
          <div className="mt-16 flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm ${yearly ? 'text-muted-foreground' : 'font-medium text-primary'}`}
              >
                Ежемесячно
              </span>
              <Switch
                checked={yearly}
                onCheckedChange={setYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span
                className={`text-sm ${yearly ? 'font-medium text-primary' : 'text-muted-foreground'}`}
              >
                Ежегодно{' '}
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
                  Экономия 20%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-dotted" />
      {/* Bottom row - Plans */}
      <div className="border-b border-dotted" />
      <div className="relative flex items-center justify-center border-x border-b border-dotted">
        {/* Corner decorations */}
        <div className="-bottom-[3px] -left-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>
        <div className="-bottom-[3px] -right-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>

        {/* Pricing Cards */}
        <div className="grid w-full grid-cols-1 divide-x divide-dotted xl:grid-cols-3">
          {plans.map((plan, planIndex) => (
            <div key={plan.name} className="p-12">
              <Card
                key={plan.name}
                className="h-full rounded-none border-none bg-transparent p-0 shadow-none"
              >
                <CardHeader className="p-0">
                  <div className="inline-flex w-fit items-center justify-center rounded bg-primary/10 p-3">
                    <plan.icon size={16} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4 font-medium text-xl">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow p-0">
                  {plan.monthlyPrice === -1 && (
                    <div className="mb-4 h-[45px]">
                      <span className="font-medium text-3xl tracking-tight">
                        Индивидуально
                      </span>
                    </div>
                  )}

                  {plan.monthlyPrice === 0 && (
                    <div className="mb-4 h-[45px]">
                      <span className="font-medium text-3xl tracking-tight">
                        Бесплатно
                      </span>
                    </div>
                  )}

                  {plan.monthlyPrice > 0 && (
                    <div className="mb-4">
                      <span className="font-medium text-3xl tracking-tight">
                        {(yearly ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString('ru-RU')}₸
                      </span>
                      <span className="text-muted-foreground">
                        /мес., оплата {yearly ? 'ежегодно' : 'ежемесячно'}
                      </span>
                    </div>
                  )}

                  {planIndex > 0 && (
                    <p className="mb-2 text-muted-foreground text-sm">
                      Всё из тарифа “{plans[planIndex - 1].name}”, а также:
                    </p>
                  )}

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {feature.icon ? (
                          <feature.icon size={16} className="text-primary" />
                        ) : (
                          <XIcon size={16} className="text-muted-foreground" />
                        )}
                        <span className="text-sm">{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto p-0 flex justify-center">
                  {plan.name === 'Хобби' && manualBilling ? (
                    <Button
                      className="w-full"
                      variant={plan.variant}
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/v1/credits/claim', { method: 'POST' });
                          if (!res.ok) throw new Error(await res.text());
                          location.href = '/welcome';
                        } catch (e) {
                          console.error(e);
                          alert('Не удалось выдать кредиты.');
                        }
                      }}
                    >
                      Получить кредиты
                    </Button>
                  ) : plan.name !== 'Хобби' ? (
                    <Button variant={plan.variant} onClick={() => setContactOpen(true)}>
                      {plan.ctaText}
                    </Button>
                  ) : (
                    <Button className="w-full" variant={plan.variant} asChild>
                      <Link href={plan.ctaLink}>{plan.ctaText}</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
      {/* Right placeholder to complete the row */}
      <div className="border-b border-dotted" />
      {/* Token packs section */}
      <div className="border-b border-dotted" />
      <div className="relative flex items-center justify-center border-x border-b border-dotted">
        {/* Corner decorations */}
        <div className="-bottom-[3px] -left-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>
        <div className="-bottom-[3px] -right-[3px] absolute">
          <div className="relative z-1 h-[5px] w-[5px] transform rounded-full bg-border ring-2 ring-background" />
        </div>

        <div className="w-full px-8 py-12">
          <h2 className="mb-2 text-center font-medium text-2xl tracking-tight md:text-3xl">
            Отдельные пакеты кредитов
          </h2>
          <p className="mx-auto max-w-2xl text-center text-muted-foreground">
            Купите кредиты разово без подписки. Подойдёт, если иногда не хватает включённого лимита.
          </p>

          <div className="mt-8 grid grid-cols-1 divide-x divide-dotted md:grid-cols-2 xl:grid-cols-4">
            {tokenPacks.map((pack) => (
              <div key={pack.credits} className="p-12">
                <Card className="h-full rounded-none border-none bg-transparent p-0 shadow-none">
                  <CardHeader className="p-0">
                    <div className="inline-flex items-center gap-3">
                      <div className="inline-flex w-fit items-center justify-center rounded bg-primary/10 p-3">
                        <CoinsIcon size={16} className="text-primary" />
                      </div>
                      <span className="text-3xl font-semibold tracking-tight">
                        {pack.price.toLocaleString('ru-RU')}₸
                      </span>
                    </div>
                    <CardTitle className="mt-4 font-medium text-xl">
                      {pack.credits} кредитов
                    </CardTitle>
                    <CardDescription>Разовый платёж</CardDescription>
                  </CardHeader>
                  <CardFooter className="p-0 flex ">
                    <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
                      Связаться
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-b border-dotted" />
      <div className="h-16" />
      <div className="border-x border-dotted" />
      <div className="" />

      {/* Contact modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="mb-2 font-medium text-xl">Связаться с менеджером</h3>
            <p className="mb-4 text-muted-foreground">
              Позвоните или напишите нам — поможем подобрать тариф и подключение.
            </p>
            <div className="grid gap-2">
              <a className="underline" href="tel:+77066318623">Позвонить: +7 706 631 8623</a>
              <a className="underline" href="https://wa.me/77066318623" target="_blank" rel="noreferrer">
                WhatsApp: открыть чат
              </a>
              <a className="underline" href="https://t.me/+77066318623" target="_blank" rel="noreferrer">
                Telegram: написать
              </a>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setContactOpen(false)}>Закрыть</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
