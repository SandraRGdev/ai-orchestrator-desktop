import { sidebarOpenAtom, currentViewAtom } from '../../stores/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { conversationService } from '../../services/conversation-service';
import { conversationsAtom, currentConversationAtom, messagesAtom, loadConversationsAtom } from '../../stores/chat-atom';
import { useEffect } from 'react';

export function Sidebar() {
  const [open, setOpen] = useAtom(sidebarOpenAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const setCurrentConversation = useSetAtom(currentConversationAtom);
  const setMessages = useSetAtom(messagesAtom);
  const loadConversations = useSetAtom(loadConversationsAtom);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'compare', label: 'Comparar', icon: '⚖️' },
    { id: 'agents', label: 'Agentes', icon: '🤖' },
    { id: 'providers', label: 'Proveedores', icon: '🔌' },
  ];

  // Load conversations when chat view is active
  useEffect(() => {
    if (currentView === 'chat' && open) {
      loadConversations();
    }

    // Listen for custom event to refresh conversations
    const handleRefreshConversations = () => {
      if (currentView === 'chat') {
        loadConversations();
      }
    };

    window.addEventListener('refresh-conversations', handleRefreshConversations);
    return () => window.removeEventListener('refresh-conversations', handleRefreshConversations);
  }, [currentView, open, loadConversations]);

  const handleLoadConversation = async (conversationId: string) => {
    try {
      // Load conversation details
      const conversation = await conversationService.getConversation(conversationId);
      setCurrentConversation(conversation);

      // Load messages for this conversation
      const messages = await conversationService.getConversationMessages(conversationId);
      setMessages(messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation when clicking delete
    try {
      await conversationService.deleteConversation(conversationId);
      // Remove from local state
      setConversations(conversations.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };


  return (
    <aside className={`${open ? 'w-64' : 'w-16'} bg-gradient-secondary border-r border-border-subtle text-text-primary transition-all duration-300 flex flex-col relative`}>
      {/* Gradient accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-primary via-accent-secondary to-accent-tertiary"></div>

      <div className="p-4 flex items-center justify-between border-b border-border-subtle">
        {open && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-primary">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">AI Orchestrator</h1>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-surface/50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          aria-label={open ? 'Contraer barra lateral' : 'Expandir barra lateral'}
        >
          <svg className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-gradient-primary text-white font-medium shadow-lg glow-primary'
                    : 'hover:bg-surface/50 text-text-secondary hover:text-text-primary'
                } focus:outline-none focus:ring-2 focus:ring-accent-primary/50`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {currentView === 'chat' && conversations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-4">
                Historial
              </h3>
              <div className="space-y-1 px-2">
                {conversations.slice(0, 10).map((conv) => (
                  <div
                    key={conv.id}
                    className="group flex items-center gap-1 rounded-lg hover:bg-surface/50 transition-all duration-200"
                  >
                    <button
                      onClick={() => handleLoadConversation(conv.id)}
                      className="flex-1 text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-all duration-200 truncate focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                      title={conv.title}
                    >
                      {conv.title}
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 text-text-tertiary hover:bg-red-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      title="Eliminar conversación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}

      {!open && (
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-gradient-primary text-white shadow-lg glow-primary'
                  : 'hover:bg-surface/50 text-text-secondary hover:text-text-primary'
              } focus:outline-none focus:ring-2 focus:ring-accent-primary/50`}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
