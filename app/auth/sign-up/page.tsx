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
import { SignUpForm } from './components/sign-up-form';

const title = 'Регистрация';
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
    <CardContent className="rounded-b-xl border-b bg-background pb-8 items-center justify-center">
      <SignUpForm />
    </CardContent>
    <CardFooter className="flex items-center justify-center gap-1 p-4 text-xs">
      <p>Уже есть аккаунт?</p>
      <Link
        href="/auth/login"
        className="text-primary underline underline-offset-4"
      >
        Войти
      </Link>
    </CardFooter>
  </Card>
);

export default LoginPage;
