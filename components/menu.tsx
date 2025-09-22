'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/providers/subscription';
import { ArrowUpRight, ArrowUpRightIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Profile } from './profile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

// Function to normalize the email into a 10-digit phone number
const formatEmailToPhone = (email: string) => {
  if (!email || !email.includes('@crafty.com')) {
    return email; // Return original if not in expected format
  }
  return email.replace('@crafty.com', '').substring(1);
};

export const Menu = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const user = useUser();
  const { isSubscribed } = useSubscription();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleOpenProfile = (event: Event) => {
    event.preventDefault();
    setDropdownOpen(false);
    setProfileOpen(true);
  };

  if (!user) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <Loader2 className="animate-spin" size={16} />
      </Button>
    );
  }

  const displayPhone = user.email ? `+7${formatEmailToPhone(user.email)}` : user.id;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.user_metadata.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground uppercase">
                {(user.user_metadata.name ?? user.email ?? user.id)
                  ?.split(' ')
                  .map((name: string) => name.at(0))
                  .join('')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          collisionPadding={8}
          sideOffset={16}
          className="w-52"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel>
            <Avatar>
              <AvatarImage src={user.user_metadata.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground uppercase">
                {(user.user_metadata.name ?? user.email ?? user.id)
                  ?.split(' ')
                  .map((name: string) => name.at(0))
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 truncate">
              {user.user_metadata.name ?? displayPhone}
            </p>
            {user.user_metadata.name && user.email && (
              <p className="truncate font-normal text-muted-foreground text-xs">
                {displayPhone}
              </p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleOpenProfile}>
            Профиль
          </DropdownMenuItem>
          {isSubscribed && (
            <DropdownMenuItem asChild className="justify-between">
              <a href="/api/portal" target="_blank" rel="noopener noreferrer">
                Биллинг{' '}
                <ArrowUpRightIcon size={16} className="text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/pricing" className="flex items-center justify-between">
              <span>Обновить</span>
              <ArrowUpRight size={16} className="text-muted-foreground" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href="tg://resolve?phone=77066318623"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between"
            >
              <span>Техподдержка</span>
              <ArrowUpRight size={16} className="text-muted-foreground" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>Выйти</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Profile open={profileOpen} setOpen={setProfileOpen} />
    </>
  );
};