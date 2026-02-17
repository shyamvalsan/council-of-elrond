'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsBar } from '@/components/layout/StatsBar';
import { CreditsBanner } from '@/components/layout/CreditsBanner';
import { TripleView } from '@/components/chat/TripleView';
import { ChatInput } from '@/components/chat/ChatInput';
import type { Message } from '@/types/chat';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <CreditsBanner />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            currentChatId={chatId}
            onSelectChat={setChatId}
            onNewChat={handleNewChat}
          />
        )}
        <main className="flex flex-1 flex-col overflow-hidden">
          <TripleView messages={messages} />
          <ChatInput onSend={handleSendMessage} />
        </main>
      </div>
      <StatsBar />
    </div>
  );
}
