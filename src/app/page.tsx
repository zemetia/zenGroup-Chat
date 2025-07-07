import ChatLayout from '@/components/chat-layout';
import { ChatProvider } from '@/lib/hooks/use-chat';

export default function Home() {
  return (
    <main className="h-full">
      <ChatProvider>
        <ChatLayout />
      </ChatProvider>
    </main>
  );
}
