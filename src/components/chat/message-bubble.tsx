import type { Message } from '../../types/generated';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'User';
  const isSystem = message.role === 'System';
  const tokens = message.tokens ?? 0;
  const latency = message.latency_ms ?? 0;
  const hasMetrics = tokens > 0 || latency > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="inline-flex items-center gap-2 bg-tertiary text-text-secondary text-xs px-4 py-2 rounded-full border border-border-subtle">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-accent-primary to-accent-primary-hover text-white rounded-br-sm'
            : 'bg-elevated border border-border-subtle text-text-primary rounded-bl-sm'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</div>
        {hasMetrics && (
          <div className={`text-xs mt-2 flex items-center gap-2 ${isUser ? 'opacity-70' : 'text-text-tertiary'}`}>
            {tokens > 0 && <span>{tokens} tokens</span>}
            {tokens > 0 && latency > 0 && (
              <>
                <span className="text-border-default">•</span>
                <span>{latency}ms</span>
              </>
            )}
            {tokens === 0 && latency > 0 && <span>{latency}ms</span>}
          </div>
        )}
      </div>
    </div>
  );
}
