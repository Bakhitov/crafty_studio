import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/lib/auth';
import Link from 'next/link';

export const Header = async () => {
  const user = await currentUser();

  return (
    <header className="flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-medium text-xl tracking-tight">
            Crafty <span className="italic text-2xl font-serif">studio</span>
          </span>
        </Link>
        <span className="hidden sm:inline-flex items-center rounded-full border bg-card/80 px-2 py-1 text-muted-foreground text-xs">
          🇰🇿 made in Kazakhstan
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="link" asChild className="text-muted-foreground">
          <Link href="/pricing">Тарифы</Link>
        </Button>
        {user ? (
          <Button variant="outline" asChild>
            <Link href="/">Перейти в приложение</Link>
          </Button>
        ) : (
          <>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Регистрация</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
