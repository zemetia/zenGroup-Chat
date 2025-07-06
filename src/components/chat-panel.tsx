"use client";

import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatPanel() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
        <ChatMessages />
        <ChatInput />
    </div>
  );
}
