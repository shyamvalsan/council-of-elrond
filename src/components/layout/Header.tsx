'use client';

import { Menu, Settings, Key } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onOpenSettings?: () => void;
}

export function Header({ onToggleSidebar, sidebarOpen, onOpenSettings }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-2 hover:bg-muted"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">The Council of Elrond</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="rounded-md p-2 hover:bg-muted"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          className="rounded-md p-2 hover:bg-muted"
          aria-label="API Keys"
        >
          <Key className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
