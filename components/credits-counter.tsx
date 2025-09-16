'use client';

import { getCredits } from '@/app/actions/credits/get';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/providers/subscription';
import NumberFlow from '@number-flow/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CoinsIcon, Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const creditsFetcher = async () => {
  const response = await getCredits();

  if ('error' in response) {
    throw new Error(response.error);
  }

  return response;
};

const pluralize = (count: number) => (count === 1 ? 'кредит' : 'кредитов');

export const CreditCounter = () => {
  const subscription = useSubscription();
  const { data, error } = useSWR('кредитов', creditsFetcher, {
    revalidateOnMount: true,
  });

  if (error) {
    return null;
  }

  if (!data) {
    return <Loader2Icon size={16} className="size-4 animate-spin" />;
  }

  const valueInt = Math.trunc(Math.abs(data.credits));
  const label = pluralize(valueInt);

  const precise = Math.abs(data.credits);
  return (
    <div className="flex shrink-0 items-center gap-2 px-2 text-muted-foreground">
      <CoinsIcon size={16} />
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <NumberFlow
              className="text-nowrap text-sm"
              value={valueInt}
              suffix={
                data.credits < 0 ? ` ${label} в перерасходе` : ` ${label} `
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          {precise.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} кредитов
        </TooltipContent>
      </Tooltip>
      {data.credits <= 0 && subscription.plan === 'hobby' && (
        <Button size="sm" className="-my-2 -mr-3 ml-1 rounded-full" asChild>
          <Link href="/pricing">Оплатить</Link>
        </Button>
      )}
    </div>
  );
};
