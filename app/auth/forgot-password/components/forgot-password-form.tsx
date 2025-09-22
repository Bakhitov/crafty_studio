'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleError } from '@/lib/error/handle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

export const ForgotPasswordForm = () => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-password-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
      });

      const data = await res.json();

      if (res.ok && data.sent) {
        toast.success('Код для сброса пароля отправлен в WhatsApp.');
        router.push(`/auth/update-password?phone=${phone.replace(/\D/g, '')}`);
      } else if (data.error === 'user_not_found') {
        toast.error('Пользователь с таким номером телефона не найден.');
      } else {
        throw new Error(data.error || 'Не удалось отправить код.');
      }
    } catch (error: unknown) {
      handleError('Ошибка при отправке кода сброса пароля', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden bg-secondary p-0">
      <CardHeader className="bg-background py-8">
        <CardTitle>Сбросить пароль</CardTitle>
        <CardDescription>
          Введите ваш номер телефона, и мы отправим вам код для сброса пароля в WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="rounded-b-xl border-b bg-background pb-8">
        <form onSubmit={handleForgotPassword}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <div className="flex items-center gap-2">
                <span>+7</span>
                <Input
                  id="phone"
                  type="text"
                  placeholder="7066318623"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !phone}>
              {isLoading ? 'Отправка...' : 'Отправить код для сброса'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="grid divide-y p-0">
        <div className="p-4 text-center text-xs">
          Вспомнили пароль?{' '}
          <Link
            href="/auth/login"
            className="text-primary underline underline-offset-4"
          >
            Войти
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};