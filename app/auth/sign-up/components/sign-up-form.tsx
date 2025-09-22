'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { handleError } from '@/lib/error/handle';
import { useRouter } from 'next/navigation';
import { type FormEventHandler, useState } from 'react';
import { useEffect } from 'react';

import { toast } from 'sonner';

export const SignUpForm = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState<'form' | 'otp' | 'done'>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState<number>(0)

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => {
      setResendTimer((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendTimer])
  const router = useRouter()

  const disabledSend = isLoading || !phone || !password
  const disabledVerify = isLoading || otp.length !== 4

  const normalize = (p: string) => p.replace(/\D/g, '')

  const handleSendOtp: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalize(phone) }),
      })
      const data = await res.json()
      if (data?.sent) {
        setStage('otp')
        toast.success('Код отправлен в WhatsApp')
        setResendTimer(60) // 60 секунд до повторной отправки
      } else if (data?.error === 'rate_limited') {
        toast.error('Превышен лимит отправок. Попробуйте позже.')
      } else {
        toast.error('Не удалось отправить код')
      }
    } catch (err) {
      handleError('send-otp', err)
      toast.error('Ошибка отправки')
    } finally {
      setIsLoading(false)
    }
  }

  // resend handler
  async function handleResend() {
    if (resendTimer > 0) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalize(phone) }),
      })
      const data = await res.json()
      if (data?.sent) {
        toast.success('Код отправлен повторно')
        setResendTimer(60)
      } else if (data?.error === 'rate_limited') {
        toast.error('Превышен лимит отправок. Попробуйте позже.')
      } else {
        toast.error('Не удалось отправить код')
      }
    } catch (err) {
      handleError('resend-otp', err)
      toast.error('Ошибка отправки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAndRegister: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalize(phone), code: otp, password }),
      })
      const data = await res.json()
      if (data?.verified) {
        setStage('done')
        toast.success('Регистрация успешна')
        router.push('/auth/login')
      } else {
        toast.error(data?.error === 'invalid_code' ? 'Неверный код' : 'Ошибка регистрации')
      }
    } catch (err) {
      handleError('verify-register', err)
      toast.error('Ошибка проверки кода')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {stage === 'form' && (
        <form onSubmit={handleSendOtp}>
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

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Пароль</Label>
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

            <Button type="submit" className="w-full" disabled={disabledSend}>
              {isLoading ? 'Отправка кода...' : 'Отправить код в WhatsApp'}
            </Button>
          </div>
        </form>
      )}

      {stage === 'otp' && (
        <form onSubmit={handleVerifyAndRegister}>
          <div className="flex flex-col items-center gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Введите код с Whatsapp</Label>
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

            <Button type="submit" className="w-full" disabled={disabledVerify}>
              {isLoading ? 'Проверка...' : 'Подтвердить код и зарегистрироваться'}
            </Button>
            <div className="flex items-center gap-2 justify-between">
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={handleResend}
                disabled={resendTimer > 0 || isLoading}
              >
                Отправить снова
              </button>
              <div className="text-xs text-muted-foreground">
                {resendTimer > 0 ? `Повторно через ${resendTimer}s` : ''}
              </div>
            </div>
          </div>
        </form>
      )}

      {stage === 'done' && <div>Регистрация завершена. Выполните вход.</div>}

      
    </>
  )
}
