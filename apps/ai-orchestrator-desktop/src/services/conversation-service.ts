import { invoke } from '@tauri-apps/api/core';
import type { Conversation, CreateConversation, Message, SendMessageRequest, UpdateConversationTitle } from '../types/generated';

export const DEMO_MODE = false;

// Mock responses for demo mode
const DEMO_RESPONSES: Record<string, string[]> = {
  'demo-openai': [
    "Hola, soy GPT-4o (modo demo). Puedo ayudarte con redacción, análisis, programación y tareas creativas. ¿Qué necesitas hoy?",
    "Buena pregunta. En modo demo estoy simulando respuestas. En producción esto se conectaría a la API de OpenAI.",
    "Encantado de ayudarte. Esto es lo que puedo hacer:\n\n1. **Análisis** - Descomponer problemas complejos\n2. **Redacción** - Crear, editar y mejorar contenido\n3. **Programación** - Escribir y depurar código\n4. **Investigación** - Buscar y resumir información\n\n¿En qué quieres enfocarte?",
  ],
  'demo-anthropic': [
    "Hola, soy Claude 3.5 Sonnet (modo demo). Estoy diseñado para ser útil, seguro y honesto. ¿En qué te ayudo?",
    "Gracias por tu pregunta. En modo demo esta respuesta es simulada. Con la API real de Anthropic te daría respuestas más profundas y matizadas.",
    "Claro, te ayudo. Se me da bien:\n\n- **Razonamiento complejo** - Resolver problemas difíciles\n- **Escritura creativa** - Historias, textos y contenido\n- **Análisis** - Comprensión profunda de texto y datos\n- **Programación** - Tareas técnicas y de código\n\n¿Qué tienes en mente?",
  ],
  'demo-local': [
    "Hola, soy Llama 3.2 (modo demo). Al ejecutarse en local, tus datos se mantienen privados. ¿Cómo te ayudo?",
    "Buena pregunta. Como esto es modo demo, la respuesta es de ejemplo. En producción correría directamente en tu equipo con Ollama.",
    "Estoy aquí para ayudarte. Puedo hacer:\n\n- **Chat** - Asistencia conversacional\n- **Tareas** - Ayuda en distintos proyectos\n- **Privacidad** - Todo el procesamiento ocurre en local\n\n¿En qué quieres trabajar?",
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
      throw new Error('Modo demo: las conversaciones no se guardan');
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

  async updateConversationTitle(id: string, req: UpdateConversationTitle): Promise<Conversation> {
    if (DEMO_MODE) {
      return {
        id,
        title: req.title,
        model_id: 'demo-model',
        provider_id: 'demo-provider',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return invoke<Conversation>('update_conversation_title', { id, req });
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
