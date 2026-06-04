import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Sparkles, Loader2, Minus, Maximize2, 
  Bot, User, Info, AlertCircle, TrendingUp, CreditCard 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.PUBLIC_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const parseMarkdown = (text: string) => {
  // Simple bold and bullet parser for a cleaner UI without heavy deps
  return text
    .split('\n')
    .map((line, i) => {
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-glow">$1</strong>');
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return `<li key=${i} class="list-item">${processedLine.replace(/^[-*]\s/, '')}</li>`;
      }
      return `<p key=${i} class="message-para">${processedLine}</p>`;
    })
    .join('');
};

export default function ChatBot({ fullScreen = false }: { fullScreen?: boolean }) {
  const [isOpen, setIsOpen] = useState(fullScreen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am **FinMate AI**. I have analyzed your recent ledger entries. How can I help you optimize your wealth today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (fullScreen) setIsOpen(true);
    };
    checkUser();
  }, [fullScreen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].slice(-6)
        })
      });

      if (!response.ok) throw new Error('Neural link severed');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "SYSTEM ERROR: Neural link severed. Please re-authenticate." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user && !fullScreen) return null;

  return (
    <div className={`chatbot-root ${fullScreen ? 'fullscreen-mode' : 'floating-mode'}`}>
      <AnimatePresence>
        {!isOpen && !fullScreen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 45 }}
            whileHover={{ scale: 1.1, y: -5 }}
            onClick={() => setIsOpen(true)}
            className="chat-trigger-btn"
          >
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={fullScreen ? { opacity: 0 } : { opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                height: isMinimized ? '70px' : (fullScreen ? '100%' : '600px'),
                width: fullScreen ? '100%' : '420px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`glass-card chat-window ${isMinimized ? 'minimized' : ''} ${fullScreen ? 'fs' : ''}`}
          >
            <div className="chat-header">
              <div className="chat-title-area">
                <div className="status-indicator"></div>
                <Sparkles size={18} className="text-accent" />
                <span className="chat-title">FINMATE <span className="serif">INTEL</span></span>
              </div>
              <div className="chat-controls">
                {!fullScreen && (
                  <button onClick={() => setIsMinimized(!isMinimized)} className="control-btn">
                    {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                  </button>
                )}
                {!fullScreen && (
                  <button onClick={() => setIsOpen(false)} className="control-btn close">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="chat-messages hide-scrollbar">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`message-wrapper ${m.role}`}
                    >
                      <div className="avatar-wrapper">
                        {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div 
                        className={`message-bubble ${m.role}`}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(m.content) }}
                      />
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="message-wrapper assistant">
                      <div className="avatar-wrapper"><Bot size={16} /></div>
                      <div className="message-bubble assistant loading">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="typing-text">SYNTHESIZING...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="chat-input-area">
                  <div className="input-container">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Input financial query..."
                      className="chat-input"
                    />
                    <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .chatbot-root {
          z-index: 1000;
          font-family: 'Inter', sans-serif;
        }
        
        .floating-mode {
          position: fixed;
          bottom: 2.5rem;
          right: 2.5rem;
        }

        .fullscreen-mode {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--mono-0);
        }

        .chat-trigger-btn {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          background: var(--mono-100);
          color: var(--mono-0);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
          transition: var(--transition-smooth);
        }

        .chat-trigger-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-radius: 50%;
        }

        .chat-window {
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8);
          border: 1px solid var(--border-strong);
          overflow: hidden;
          background: rgba(15, 23, 42, 0.8) !important;
          backdrop-filter: blur(30px) !important;
        }

        .chat-window.fs {
          max-width: 1000px;
          height: 80vh !important;
          border-radius: var(--radius-lg);
        }

        .chat-header {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border-subtle);
        }

        .chat-title-area {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          background: var(--accent-emerald);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-emerald);
        }

        .chat-title {
          font-weight: 900;
          font-size: 0.9rem;
          letter-spacing: 0.2em;
          color: var(--mono-100);
        }

        .chat-controls {
          display: flex;
          gap: 0.75rem;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--mono-40);
          cursor: pointer;
          padding: 8px;
          border-radius: 12px;
          transition: var(--transition-smooth);
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--mono-100);
        }

        .chat-messages {
          flex: 1;
          padding: 2.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .message-wrapper {
          display: flex;
          gap: 1.25rem;
          max-width: 90%;
        }

        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
          max-width: 80%;
        }

        .avatar-wrapper {
          width: 36px;
          height: 36px;
          background: var(--mono-10);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--mono-40);
          flex-shrink: 0;
        }

        .user .avatar-wrapper {
          background: var(--accent-primary);
          color: white;
          border: none;
        }

        .message-bubble {
          padding: 1.25rem 1.75rem;
          border-radius: 24px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--mono-90);
          position: relative;
        }

        .assistant .message-bubble {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-top-left-radius: 4px;
        }

        .user .message-bubble {
          background: var(--mono-100);
          color: var(--mono-0);
          border-top-right-radius: 4px;
          font-weight: 600;
        }

        .text-accent-glow {
          color: var(--accent-primary);
          font-weight: 800;
        }

        .message-para {
          margin-bottom: 0.75rem;
        }
        
        .message-para:last-child {
          margin-bottom: 0;
        }

        .list-item {
          margin-left: 1.5rem;
          margin-bottom: 0.5rem;
          list-style: disc;
        }

        .chat-input-area {
          padding: 2rem 2.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid var(--border-subtle);
        }

        .input-container {
          display: flex;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 8px 8px 8px 20px;
          transition: var(--transition-smooth);
        }

        .input-container:focus-within {
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--mono-100);
          font-size: 0.95rem;
          outline: none;
        }

        .send-btn {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: var(--mono-100);
          color: var(--mono-0);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .send-btn:hover:not(:disabled) {
          background: var(--accent-primary);
          color: white;
          transform: rotate(-10deg) scale(1.1);
        }

        .typing-text {
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.2em;
          color: var(--accent-primary);
        }

        @media (max-width: 1024px) {
           .chat-window:not(.fs) {
             width: calc(100vw - 4rem);
             height: 500px;
           }
        }

        @media (max-width: 640px) {
          .chatbot-root.floating-mode {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            display: flex;
            justify-content: flex-end;
          }
          .floating-mode .chat-window {
            width: 100%;
            max-width: 350px;
            height: 450px !important;
            bottom: 80px;
            right: 0;
            position: absolute;
          }
          .chat-trigger-btn {
            width: 60px;
            height: 60px;
          }
          .chat-messages {
            padding: 1.25rem;
          }
          .chat-window.fs {
            height: 90vh !important;
            max-height: 800px;
            width: 95vw;
            border-radius: var(--radius-md);
          }
          .message-wrapper {
            max-width: 95%;
          }
          .message-bubble {
            padding: 1rem;
            font-size: 0.85rem;
          }
        }

      `}</style>
    </div>
  );
}
