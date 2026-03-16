'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '../ui/Avatar';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="h-14 border-b bg-white px-6 flex items-center justify-between">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
            <span className="text-sm text-gray-700">{user.fullName}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
