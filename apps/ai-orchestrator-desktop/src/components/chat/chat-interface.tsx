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
        console.log('Chat: Initializing conversation', { modelId, providerId, defaultTitle });
        try {
          if (!currentConversation) {
            console.log('Chat: Creating new conversation...');
            const conversation = await createConversation({
              title: defaultTitle,
              modelId,
              providerId,
            });
            console.log('Chat: Conversation created', conversation);
          } else {
            console.log('Chat: Using existing conversation', currentConversation);
          }
          setInitialized(true);
        } catch (error) {
          console.error('Chat: Failed to initialize conversation', error);
        }
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
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
          <p className="text-sm">Setting up chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-primary">
      <div className="border-b border-border-subtle px-6 py-4 bg-elevated">
        <h2 className="font-semibold text-lg text-text-primary">{currentConversation.title}</h2>
        <p className="text-xs text-text-secondary mt-1 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-tertiary text-xs font-medium">
            {providerId}
          </span>
          <span className="text-text-tertiary">•</span>
          <span className="font-mono text-xs">{modelId}</span>
        </p>
      </div>

      <MessageList messages={messages} />

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
