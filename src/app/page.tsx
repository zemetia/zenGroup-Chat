import ChatLayout from '@/components/chat-layout';
import { ChatProvider } from '@/lib/hooks/use-chat';

export default function Home() {
  return (
    <main>
      <ChatProvider>
        <ChatLayout />
      </ChatProvider>
    </main>
  );
}
