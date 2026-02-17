'use client';

import { useState } from 'react';
import { Search, Plus, MessageSquare } from 'lucide-react';

interface SidebarProps {
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

interface ChatItem {
  id: string;
  title: string;
  updatedAt: Date;
}

export function Sidebar({ currentChatId, onSelectChat, onNewChat }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats] = useState<ChatItem[]>([]);

  const filteredChats = chats.filter(
    (chat) =>
      !searchQuery ||
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredChats.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No chats found' : 'No chat history yet'}
          </p>
        ) : (
          <ul className="space-y-1">
            {filteredChats.map((chat) => (
              <li key={chat.id}>
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-muted font-medium'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{chat.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
