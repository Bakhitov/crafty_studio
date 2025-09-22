// Соц-авторизация скрыта
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from './components/login-form';

const title = 'Вход';
const description = 'в Crafty studio';

export const metadata = {
  title,
  description,
};

const LoginPage = () => (
  <Card className="gap-0 overflow-hidden bg-secondary p-0">
    <CardHeader className="bg-background py-8">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="rounded-b-xl border-b bg-background pb-8">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </CardContent>
    <CardFooter className="flex items-center justify-center gap-1 p-4 text-xs">
      <p>Нет аккаунта?</p>
      <Link
        href="/auth/sign-up"
        className="text-primary underline underline-offset-4"
      >
        Регистрация
      </Link>
    </CardFooter>
  </Card>
);

export default LoginPage;
