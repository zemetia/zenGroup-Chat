"use client";

import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatPanel() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
        <ChatMessages />
        <ChatInput />
    </div>
  );
}
