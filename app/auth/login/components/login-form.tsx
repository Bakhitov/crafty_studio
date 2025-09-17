'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleError } from '@/lib/error/handle';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEventHandler, useState } from 'react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const disabled = isLoading || !email || !password;

  const handleEmailLogin: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const next = search.get('next') ?? '/';
      router.push(next);
    } catch (error: unknown) {
      handleError('Ошибка при входе с электронной почтой', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleEmailLogin}>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Почта</Label>
            <Input
              id="email"
              type="email"
              placeholder="@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Пароль</Label>
              <Link
                href="/auth/forgot-password"
                className="ml-auto inline-block text-muted-foreground text-xs underline-offset-4 hover:underline"
              >
                Забыли ваш пароль?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={disabled}>
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </div>
      </form>
    </>
  );
};
