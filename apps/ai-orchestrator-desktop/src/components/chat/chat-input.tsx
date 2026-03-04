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
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
