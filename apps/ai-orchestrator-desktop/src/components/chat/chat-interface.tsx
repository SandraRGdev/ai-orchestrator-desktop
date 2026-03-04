import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import {
  currentConversationAtom,
  messagesAtom,
  loadMessagesAtom,
  sendMessageAtom,
  createConversationAtom,
  messagesLoadingAtom,
} from '../../stores/chat-atom';
import type { Message } from '../../types/generated';

interface ChatInterfaceProps {
  modelId: string;
  providerId: string;
  defaultTitle?: string;
}

export function ChatInterface({ modelId, providerId, defaultTitle = 'New Chat' }: ChatInterfaceProps) {
  const [currentConversation] = useAtom(currentConversationAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [loading] = useAtom(messagesLoadingAtom);
  const loadMessages = useSetAtom(loadMessagesAtom);
  const sendMessage = useSetAtom(sendMessageAtom);
  const createConversation = useSetAtom(createConversationAtom);
  const [initialized, setInitialized] = useState(false);

  // Initialize conversation
  useEffect(() => {
    if (!initialized) {
      const initConversation = async () => {
        if (!currentConversation) {
          await createConversation({
            title: defaultTitle,
            modelId,
            providerId,
          });
        }
        setInitialized(true);
      };
      initConversation();
    }
  }, [initialized, currentConversation, createConversation, defaultTitle, modelId, providerId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation && initialized) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation?.id, initialized, loadMessages]);

  const handleSend = async (content: string) => {
    if (!currentConversation) return;

    // Add user message immediately to UI
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: 'User',
      content,
      tokens: null,
      latency_ms: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Send message and get response
    await sendMessage({ conversationId: currentConversation.id, content });
  };

  if (!initialized || !currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="animate-pulse">Setting up chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="border-b border-gray-700 px-4 py-3 bg-gray-800">
        <h2 className="font-semibold text-white">{currentConversation.title}</h2>
        <p className="text-xs text-gray-400">
          {providerId} • {modelId}
        </p>
      </div>

      <MessageList messages={messages} />

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
