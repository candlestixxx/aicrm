'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Palette,
  Sparkles,
  Users,
  Workflow,
  X,
} from 'lucide-react';

interface TourStep {
  title: string;
  icon: React.ReactNode;
  description: string;
  bullets?: string[];
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to AiCRM',
    icon: <Building2 className="w-7 h-7" />,
    description:
      'An agentic real-estate CRM that combines a full lead database with an AI brain (HyperNexus) — so you can run your brokerage with plain-English commands and smart automations.',
    bullets: ['Multi-tenant brokerage workspace', 'AI-powered, not just AI-badged'],
  },
  {
    title: 'Contacts & Pipeline',
    icon: <Users className="w-7 h-7" />,
    description: 'Your leads live in Contacts, with CSV import/export and smart filters. The Pipeline is a drag-and-drop kanban of your deals.',
    bullets: ['Add contacts manually or via CSV', 'Drag leads between stages'],
  },
  {
    title: 'HyperNexus commands',
    icon: <Sparkles className="w-7 h-7" />,
    description: 'The HyperNexus console turns natural language into real actions. Just type what you want done.',
    bullets: ['"summarize my brokerage"', '"create a task to call John"', '"update lead Jane to hot"'],
  },
  {
    title: 'Workflow automations',
    icon: <Workflow className="w-7 h-7" />,
    description: 'Build "if this, then that" automations — no node graphs. When a lead replies "yes", mark them Hot and notify your team automatically.',
    bullets: ['5 triggers · 5+ actions', 'Multi-step action chains'],
  },
  {
    title: 'AI Assistant',
    icon: <BarChart3 className="w-7 h-7" />,
    description: 'A proactive intelligence layer: daily digest, next-best actions, nudges, lead-going-cold alerts, CMA generation, and enrichment.',
    bullets: ['Know what to do next, every day'],
  },
  {
    title: 'Make it yours',
    icon: <Palette className="w-7 h-7" />,
    description: 'Switch light/dark, pick from 6 palettes, or dial in your own brand color with the custom color wheel.',
    bullets: ['Theme button in the top-right corner'],
  },
  {
    title: 'Help is always on',
    icon: <HelpCircle className="w-7 h-7" />,
    description: 'The Help Center has searchable FAQs and video guides, and the 24/7 Nexus chat bot is one click away (bottom-right).',
    bullets: ['Chat for instant answers', 'Videos for guided walkthroughs'],
  },
];

export default function OnboardingTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);

  // Reset to the first step whenever the tour is closed, so the next
  // open always starts from the beginning.
  const close = () => {
    setStep(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStep(0);
        onClose();
      }
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative w-full max-w-lg bg-surface border border-gray-200 rounded-2xl shadow-2xl p-8">
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600">
            {current.icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="text-xl font-bold text-gray-900">{current.title}</h3>
          </div>
        </div>

        <p className="text-sm text-gray-600">{current.description}</p>

        {current.bullets && (
          <ul className="mt-4 space-y-2">
            {current.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={close}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Get started
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
