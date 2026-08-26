'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { CHAT_SUGGESTIONS } from '@/lib/help';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  steps?: string[];
}

interface HelpChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  onOpenHelp: () => void;
}

export default function HelpChat({ open, onOpenChange, onStartTour, onOpenHelp }: HelpChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(CHAT_SUGGESTIONS);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi, I'm Nexus — your 24/7 AiCRM assistant. Ask me anything, or tap a suggestion below.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput('');
    setLoading(true);
    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: message }]);

    try {
      const res = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.map((h) => ({ role: h.role, content: h.content })),
        }),
      });
      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.reply || 'Sorry, something went wrong. Please try again.',
          steps: data.steps,
        },
      ]);
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);

      if (data.action === 'start-tour') onStartTour();
      if (data.action === 'open-help') onOpenHelp();
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'I could not reach the server. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Open help chat"
        className="fixed bottom-5 right-5 z-[55] flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> 24/7
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[55] w-[calc(100vw-2.5rem)] max-w-sm bg-surface border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Nexus Support</p>
              <p className="text-[11px] text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online · replies instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 text-white/80 hover:text-white"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[380px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                  {m.steps && (
                    <ol className="mt-2 space-y-1">
                      {m.steps.map((s, j) => (
                        <li key={j} className="flex gap-1.5">
                          <span className="font-semibold">{j + 1}.</span> {s}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-gray-100 text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> thinking…
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {!loading && messages.length <= 3 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="px-2.5 py-1 rounded-full text-xs border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 p-3 border-t border-gray-200"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for help…"
              className="flex-1 px-3 py-2 bg-surface text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
