import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2 } from 'lucide-react';
import { chatWithAssistant, type ChatMessage } from '../lib/claude';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ContentAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm your content assistant. Ask me to:\n\n• Write hooks for any topic\n• Optimize your captions\n• Suggest hashtags\n• Make content more viral\n\nWhat are you working on?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for context (exclude welcome message)
      const history: ChatMessage[] = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await chatWithAssistant(userMessage.content, history);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure your Claude API key is set in Settings.`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Collapsed state - just the floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white hover:scale-110 z-50"
        title="Content Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  // Minimized state - small bar
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-zinc-800 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-zinc-700 transition-colors z-50"
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-zinc-300">Content Assistant</span>
      </div>
    );
  }

  // Expanded chat window
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-700 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Content Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4 text-zinc-400" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-700">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-center">
          Try: "Write a hook for quadratic equations GCSE"
        </p>
      </div>
    </div>
  );
}
