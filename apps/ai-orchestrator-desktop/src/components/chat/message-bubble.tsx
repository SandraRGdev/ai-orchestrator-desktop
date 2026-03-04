import type { Message } from '../../types/generated';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'User';
  const isSystem = message.role === 'System';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.tokens && (
          <div className="text-xs opacity-70 mt-1">
            {message.tokens} tokens
            {message.latency_ms && ` • ${message.latency_ms}ms`}
          </div>
        )}
      </div>
    </div>
  );
}
