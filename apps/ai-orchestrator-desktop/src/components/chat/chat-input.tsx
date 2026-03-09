import { useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { chatInputAtom, sendingMessageAtom } from '../../stores/chat-atom';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useAtom(chatInputAtom);
  const [sending] = useAtom(sendingMessageAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled && !sending) {
        onSend(input.trim());
        setInput('');
        // Reset height after clearing
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  return (
    <div className="border-t border-border-subtle p-4 bg-elevated">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 bg-surface border border-border-subtle text-text-primary rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary disabled:opacity-50 placeholder:text-text-secondary transition-all"
          rows={1}
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />
        <button
          onClick={() => {
            if (input.trim() && !disabled && !sending) {
              onSend(input.trim());
              setInput('');
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
              }
            }
          }}
          disabled={!input.trim() || disabled || sending}
          className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover disabled:bg-tertiary disabled:cursor-not-allowed disabled:text-text-tertiary text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 shadow-lg shadow-accent-primary/25 disabled:shadow-none whitespace-nowrap"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Sending
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}
