import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { backendApi } from '../../services/backendApi';
import { KidzyRobot } from './KidzyRobot';

const TOKEN_KEY = 'navjyoti_access_token';
const HISTORY_KEY = 'kidzy_ai_history';
const GREETING_SHOWN_KEY = 'kidzy_greeting_shown';
const GREETING_DISMISSED_KEY = 'kidzy_greeting_dismissed';
const WAVE_SHOWN_KEY = 'kidzy_wave_shown';
const GREETING = "Namaste! 👋 I'm Kidzy AI, your friendly child-health companion! I'm here to help you understand vaccinations, nutrition, growth milestones, and healthcare appointments. How can I help you today?";
const DISCLAIMER = 'Kidzy AI provides general child-health education and app guidance. It does not replace professional medical advice. Do not share private health information.';
const HELLO_BUBBLE = "Hi! 👋 I'm Kidzy. Need some help?";

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.slice(-12) : [];
  } catch {
    return [];
  }
}

export function KidzyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHello, setShowHello] = useState(false);
  const [waveOnFirstDisplay, setWaveOnFirstDisplay] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(WAVE_SHOWN_KEY)) return;
    sessionStorage.setItem(WAVE_SHOWN_KEY, 'true');
    setWaveOnFirstDisplay(true);
    const timer = window.setTimeout(() => setWaveOnFirstDisplay(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      open
      || sessionStorage.getItem(GREETING_SHOWN_KEY)
      || sessionStorage.getItem(GREETING_DISMISSED_KEY)
    ) return undefined;

    const showTimer = window.setTimeout(() => {
      sessionStorage.setItem(GREETING_SHOWN_KEY, 'true');
      setShowHello(true);
    }, 1800);
    const hideTimer = window.setTimeout(() => setShowHello(false), 10000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [open]);

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const clearConversation = () => {
    setMessages([]);
    setError('');
    sessionStorage.removeItem(HISTORY_KEY);
  };

  const dismissHello = (event) => {
    event.stopPropagation();
    sessionStorage.setItem(GREETING_DISMISSED_KEY, 'true');
    setShowHello(false);
  };

  const openChat = () => {
    setShowHello(false);
    setOpen(true);
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError('Kidzy AI is available with a real account login. Please sign in with your NavJyoti account.');
      return;
    }

    setInput('');
    setError('');
    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const data = await backendApi.chat(token, message);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (requestError) {
      const text = requestError instanceof Error
        ? requestError.message
        : 'Kidzy AI could not connect.';
      if (/429|rate|limit|busy/i.test(text)) {
        setError('Kidzy AI is receiving too many requests or reached a provider limit. Please wait and try again.');
      } else if (/network|fetch|failed/i.test(text)) {
        setError('Connection issue. Please check your internet connection and try again.');
      } else {
        setError(text);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <div className="fixed bottom-20 right-3 z-40 flex flex-col items-end gap-1 sm:bottom-5 sm:right-5">
          {showHello && (
            <div className="kidzy-greeting relative mb-1 flex items-center gap-2 rounded-2xl border border-[#D8E6DA] bg-[#FBF8F2] px-3 py-2 pr-8 text-xs font-semibold text-[#103342] shadow-lg">
              <span>{HELLO_BUBBLE}</span>
              <button
                type="button"
                onClick={dismissHello}
                aria-label="Dismiss Kidzy greeting"
                className="absolute right-1 top-1 rounded-full p-1 text-[#294B57]/70 hover:bg-[#DDF0E3] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
              <span className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-[#D8E6DA] bg-[#FBF8F2]" aria-hidden="true" />
            </div>
          )}
          <button
            type="button"
            onClick={openChat}
            aria-label="Open Kidzy AI chat"
            title="Chat with Kidzy AI"
            className="kidzy-character-button group flex h-[92px] w-[84px] items-center justify-center rounded-[28px] bg-transparent p-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#A8D5B5]"
          >
            <KidzyRobot waving={waveOnFirstDisplay} />
          </button>
        </div>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Kidzy AI chat"
          className="fixed bottom-3 right-3 z-50 flex h-[min(620px,calc(100vh-24px))] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#D8E6DA] bg-[#FBF8F2] shadow-[0_18px_48px_rgba(16,51,66,0.28)] sm:bottom-5 sm:right-5"
        >
          <header className="flex items-center justify-between bg-[#103342] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <KidzyRobot compact responding={loading} />
              <div>
                <h2 className="font-heading text-sm font-bold text-white">KIDZY AI</h2>
                <p className="text-[10px] text-[#DDF0E3]">Little Steps, Brighter Futures.</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearConversation}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="rounded-full p-2 text-[#DDF0E3] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#DDF0E3]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize Kidzy AI chat"
                title="Minimize chat"
                className="rounded-full p-2 text-[#DDF0E3] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#DDF0E3]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="mb-3 max-w-[88%] rounded-2xl rounded-bl-md bg-[#DDF0E3] px-3 py-2.5 text-sm leading-relaxed text-[#294B57]">
                {GREETING}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`mb-3 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'whitespace-pre-wrap rounded-br-md bg-[#007F68] text-white'
                      : 'rounded-bl-md bg-[#DDF0E3] text-[#294B57]'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="mb-2 mt-3 text-base font-bold first:mt-0" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="mb-2 mt-3 text-sm font-bold first:mt-0" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="mb-1 mt-2 text-sm font-bold first:mt-0" {...props} />
                        ),
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => (
                          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
                        table: ({ node, ...props }) => (
                          <div className="mb-2 overflow-x-auto last:mb-0">
                            <table className="min-w-full border-collapse text-left text-xs" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th className="border border-[#A8D5B5] bg-white/70 px-2 py-1 font-bold" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border border-[#A8D5B5] px-2 py-1 align-top" {...props} />
                        ),
                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="mb-2 border-l-2 border-[#007F68] pl-3 italic last:mb-0" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code className="rounded bg-white/70 px-1 py-0.5 text-[0.9em]" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="mb-3 flex justify-start" aria-label="Kidzy AI is typing">
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-[#DDF0E3] px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#007F68]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#007F68] [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#007F68] [animation-delay:240ms]" />
                </div>
              </div>
            )}
            {error && (
              <div className="mb-3 rounded-lg border border-[#E57373]/30 bg-[#FDECEC] px-3 py-2 text-xs text-[#8A3434]" role="alert">
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#D8E6DA] bg-[#FBF8F2] p-3">
            <p className="mb-2 text-[10px] leading-snug text-[#294B57]/75">{DISCLAIMER}</p>
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <label htmlFor="kidzy-message" className="sr-only">Message Kidzy AI</label>
              <input
                id="kidzy-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={2000}
                placeholder="Ask about child health..."
                className="h-10 min-w-0 flex-1 rounded-full border border-[#D8E6DA] bg-white px-4 text-sm text-[#294B57] outline-none placeholder:text-[#294B57]/50 focus:border-[#007F68] focus:ring-2 focus:ring-[#DDF0E3]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007F68] text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#005F52] focus:outline-none focus:ring-4 focus:ring-[#DDF0E3]"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
