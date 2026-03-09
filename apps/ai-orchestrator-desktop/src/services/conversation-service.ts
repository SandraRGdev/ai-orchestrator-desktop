import { invoke } from '@tauri-apps/api/core';
import type { Conversation, CreateConversation, Message, SendMessageRequest } from '../types/generated';

export const DEMO_MODE = false;

// Mock responses for demo mode
const DEMO_RESPONSES: Record<string, string[]> = {
  'demo-openai': [
    "Hello! I'm GPT-4o (Demo Mode). I can help you with a wide range of tasks including writing, analysis, coding, and creative projects. How can I assist you today?",
    "That's a great question! In Demo Mode, I'm simulating responses. In production, this would connect to OpenAI's GPT-4o API.",
    "I'd be happy to help with that! Here's what I can do:\n\n1. **Analysis** - Break down complex problems\n2. **Writing** - Create content, edit, and refine\n3. **Coding** - Write and debug code\n4. **Research** - Find and summarize information\n\nWhat would you like to focus on?",
  ],
  'demo-anthropic': [
    "Hello! I'm Claude 3.5 Sonnet (Demo Mode). I'm designed to be helpful, harmless, and honest. How can I help you today?",
    "Thank you for your question! In this Demo Mode, I'm showing a simulated response. When connected to the actual Anthropic API, I would provide thoughtful, nuanced answers.",
    "I'd be glad to assist! Here are some things I'm good at:\n\n- **Complex reasoning** - Working through difficult problems\n- **Creative writing** - Stories, poems, content creation\n- **Analysis** - Deep understanding of text and data\n- **Coding** - Programming and technical tasks\n\nWhat's on your mind?",
  ],
  'demo-local': [
    "Hey! I'm Llama 3.2 (Demo Mode). Running locally means your data stays private! How can I help?",
    "Great question! Since this is Demo Mode, I'm showing a mock response. In production, I'd be running directly on your machine via Ollama.",
    "I'm here to help! Some things I can do:\n\n- **Chat** - Conversational AI assistance\n- **Tasks** - Help with various projects\n- **Privacy** - All processing happens locally\n\nWhat would you like to work on?",
  ],
};

function getDemoResponse(providerId: string): string {
  const responses = DEMO_RESPONSES[providerId] || DEMO_RESPONSES['demo-openai'];
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
}

export class ConversationService {
  async createConversation(req: CreateConversation): Promise<Conversation> {
    console.log('conversationService.createConversation called', req);
    if (DEMO_MODE) {
      console.log('conversationService: Using DEMO_MODE');
      return {
        id: `demo-${Date.now()}`,
        title: req.title,
        model_id: req.model_id,
        provider_id: req.provider_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    console.log('conversationService: Calling Tauri invoke create_conversation');
    const result = await invoke<Conversation>('create_conversation', { req });
    console.log('conversationService: Tauri invoke completed', result);
    return result;
  }

  async getConversation(id: string): Promise<Conversation> {
    if (DEMO_MODE) {
      throw new Error('Demo mode: conversations not persisted');
    }
    return invoke<Conversation>('get_conversation', { id });
  }

  async listConversations(): Promise<Conversation[]> {
    if (DEMO_MODE) {
      return [];
    }
    return invoke<Conversation[]>('list_conversations');
  }

  async deleteConversation(id: string): Promise<void> {
    if (DEMO_MODE) {
      return;
    }
    return invoke('delete_conversation', { id });
  }

  async sendMessage(req: SendMessageRequest): Promise<Message> {
    if (DEMO_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        id: `msg-${Date.now()}`,
        conversation_id: req.conversation_id,
        role: 'Assistant',
        content: getDemoResponse(req.conversation_id.split('-')[0]),
        tokens: 150 + Math.floor(Math.random() * 200),
        latency_ms: 800 + Math.floor(Math.random() * 400),
        created_at: new Date().toISOString(),
      };
    }
    return invoke<Message>('send_message', { req });
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    if (DEMO_MODE) {
      return [];
    }
    return invoke<Message[]>('get_conversation_messages', { conversationId });
  }
}

export const conversationService = new ConversationService();
