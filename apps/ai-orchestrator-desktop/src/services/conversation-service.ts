import { invoke } from '@tauri-apps/api/core';
import type { Conversation, CreateConversation, Message, SendMessageRequest } from '../types/generated';

export class ConversationService {
  async createConversation(req: CreateConversation): Promise<Conversation> {
    return invoke('create_conversation', { req });
  }

  async getConversation(id: string): Promise<Conversation> {
    return invoke('get_conversation', { id });
  }

  async listConversations(): Promise<Conversation[]> {
    return invoke('list_conversations');
  }

  async deleteConversation(id: string): Promise<void> {
    return invoke('delete_conversation', { id });
  }

  async sendMessage(req: SendMessageRequest): Promise<Message> {
    return invoke('send_message', { req });
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return invoke('get_conversation_messages', { conversationId });
  }
}

export const conversationService = new ConversationService();
