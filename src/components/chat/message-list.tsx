import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { MessageBubble } from './message-bubble';
import { messagesAtom, messagesLoadingAtom } from '../../stores/chat-atom';
import type { Message } from '../../types/generated';

interface MessageListProps {
  messages?: Message[];
}

export function MessageList({ messages: propMessages }: MessageListProps) {
  const [atomMessages] = useAtom(messagesAtom);
  const [loading] = useAtom(messagesLoadingAtom);
  const messages = propMessages ?? atomMessages;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary">
        <div className="animate-pulse">Cargando mensajes...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary">
        <div className="text-center">
          <p className="text-lg mb-2">Aún no hay mensajes</p>
          <p className="text-sm">Empieza una conversación escribiendo un mensaje abajo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
