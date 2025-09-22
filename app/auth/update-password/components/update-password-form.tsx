'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { handleError } from '@/lib/error/handle';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEventHandler, useState, useEffect } from 'react';
import { toast } from 'sonner';

export const UpdatePasswordForm = () => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const phoneFromQuery = searchParams.get('phone');
    if (phoneFromQuery) {
      setPhone(phoneFromQuery);
    } else {
        toast.error('Номер телефона не найден. Пожалуйста, начните процесс сброса пароля заново.');
        router.push('/auth/forgot-password');
    }
  }, [searchParams, router]);

  const handleUpdatePassword: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-password-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Пароль успешно обновлен!');
        router.push('/auth/login');
      } else {
        const errorMessage = data.error === 'invalid_otp' ? 'Неверный код' : 'Не удалось обновить пароль.';
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      handleError('Ошибка при обновлении пароля', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2 text-center">
            <Label htmlFor="otp">Введите код из WhatsApp</Label>
            <InputOTP
                value={otp}
                onChange={(value: string) => setOtp(value)}
                maxLength={4}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Новый пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="Новый пароль"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || !password || otp.length !== 4}>
          {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
        </Button>
      </div>
    </form>
  );
};