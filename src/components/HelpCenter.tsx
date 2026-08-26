'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  MessageCircle,
  Play,
  PlayCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { HELP_TOPICS, VIDEO_GUIDES, type VideoGuide } from '@/lib/help';

interface HelpCenterProps {
  onStartTour: () => void;
  onOpenChat: () => void;
}

export default function HelpCenter({ onStartTour, onOpenChat }: HelpCenterProps) {
  const [query, setQuery] = useState('');
  const [openTopic, setOpenTopic] = useState<string | null>(HELP_TOPICS[0]?.id ?? null);
  const [video, setVideo] = useState<VideoGuide | null>(null);

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_TOPICS;
    return HELP_TOPICS.filter(
      (t) =>
        t.question.toLowerCase().includes(q) ||
        t.answer.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
    );
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Help Center
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Searchable guides, step-by-step instructions, and video walkthroughs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Sparkles className="w-4 h-4" /> Take the tour
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            <MessageCircle className="w-4 h-4" /> Chat with support
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for help — e.g. 'workflows', 'import', 'theme'…"
          className="w-full pl-9 pr-4 py-2.5 bg-surface text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* FAQ */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Frequently asked questions
          </h3>
          {topics.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">
              No matches for “{query}”. Try a different term, or chat with support.
            </p>
          ) : (
            topics.map((topic) => {
              const open = openTopic === topic.id;
              return (
                <div
                  key={topic.id}
                  className="bg-surface border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenTopic(open ? null : topic.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-gray-900">{topic.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600">{topic.answer}</p>
                      {topic.steps && (
                        <ol className="mt-3 space-y-1.5">
                          {topic.steps.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-700">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">
                                {i + 1}
                              </span>
                              {s}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Videos */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Video guides
          </h3>
          {VIDEO_GUIDES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVideo(v)}
              className="w-full bg-surface border border-gray-200 rounded-xl overflow-hidden text-left hover:border-blue-300 transition group"
            >
              <div className="relative h-24 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <PlayCircle className="w-9 h-9 text-white/90 group-hover:scale-110 transition" />
                <span className="absolute bottom-1.5 right-1.5 text-[10px] font-medium text-white/90 bg-black/40 px-1.5 py-0.5 rounded">
                  {v.duration}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900">{v.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Video modal */}
      {video && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setVideo(null)} />
          <div className="relative w-full max-w-2xl bg-surface border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">{video.title}</h4>
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {video.embedUrl ? (
                <iframe
                  src={`${video.embedUrl}?rel=0&autoplay=1`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                  <Play className="w-10 h-10 text-white/40 mb-2" />
                  <p className="text-white/80 text-sm font-medium">Video coming soon</p>
                  <p className="text-white/50 text-xs mt-1 max-w-xs">
                    Paste your YouTube URL into <code className="text-white/70">src/lib/help.ts</code>{' '}
                    to enable this video guide.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
