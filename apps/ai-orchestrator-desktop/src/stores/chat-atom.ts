import { atom } from 'jotai';
import type { Conversation, Message } from '../types/generated';

// Current conversation state
export const currentConversationAtom = atom<Conversation | null>(null);

// Messages in current conversation
export const messagesAtom = atom<Message[]>([]);

// Loading states
export const messagesLoadingAtom = atom(false);
export const sendingMessageAtom = atom(false);

// Input state
export const chatInputAtom = atom('');

// Conversations list
export const conversationsAtom = atom<Conversation[]>([]);
export const conversationsLoadingAtom = atom(false);

// Derived atom for getting messages by conversation ID
export const loadMessagesAtom = atom(
  null,
  async (_get, set, conversationId: string) => {
    set(messagesLoadingAtom, true);
    try {
      const { conversationService } = await import('../services/conversation-service');
      const messages = await conversationService.getConversationMessages(conversationId);
      set(messagesAtom, messages);
    } finally {
      set(messagesLoadingAtom, false);
    }
  }
);

// Derived atom for sending a message
export const sendMessageAtom = atom(
  null,
  async (_get, set, { conversationId, content }: { conversationId: string; content: string }) => {
    set(sendingMessageAtom, true);
    try {
      const { conversationService } = await import('../services/conversation-service');
      const message = await conversationService.sendMessage({
        conversation_id: conversationId,
        content,
      });

      // Add the assistant's message to the list
      set(messagesAtom, (prev) => [...prev, message]);
    } finally {
      set(sendingMessageAtom, false);
    }
  }
);

// Derived atom for loading conversations list
export const loadConversationsAtom = atom(
  null,
  async (_get, set) => {
    set(conversationsLoadingAtom, true);
    try {
      const { conversationService } = await import('../services/conversation-service');
      const conversations = await conversationService.listConversations();
      set(conversationsAtom, conversations);
    } finally {
      set(conversationsLoadingAtom, false);
    }
  }
);

// Derived atom for creating a new conversation
export const createConversationAtom = atom(
  null,
  async (_get, set, { title, modelId, providerId }: { title: string; modelId: string; providerId: string }) => {
    const { conversationService } = await import('../services/conversation-service');
    const conversation = await conversationService.createConversation({
      title,
      model_id: modelId,
      provider_id: providerId,
    });
    set(currentConversationAtom, conversation);
    set(messagesAtom, []);
    return conversation;
  }
);
