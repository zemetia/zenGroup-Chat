"use client";

import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatPanel() {
  return (
    <div className="flex flex-col flex-1 h-full max-h-[calc(100vh-theme(spacing.24))]">
        <ChatMessages />
        <ChatInput />
    </div>
  );
}
