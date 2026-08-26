import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { getAIEngine } from '@/lib/ai/engine';
import { CHAT_SUGGESTIONS, findHelpAnswer, HELP_TOPICS } from '@/lib/help';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are "Nexus", the friendly 24/7 support assistant for AiCRM — an agentic real-estate CRM.
Be concise, warm, and genuinely helpful. When a user asks how to do something, give clear step-by-step instructions.
Use ONLY the knowledge below; if you don't know, say so and suggest contacting the team.
Never invent features. Keep answers under ~120 words unless steps are needed.

AI CRM KNOWLEDGE:
${HELP_TOPICS.map(
  (t) =>
    `Q: ${t.question}\nA: ${t.answer}${t.steps ? `\nSteps: ${t.steps.join(' → ')}` : ''}`
).join('\n\n')}`;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const message: string = typeof body.message === 'string' ? body.message.trim() : '';
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history.filter(
        (m: ChatMessage) => typeof m?.content === 'string' && typeof m?.role === 'string'
      )
    : [];

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  // 1) Rule-based match against the knowledge base (instant, no LLM cost).
  const topic = findHelpAnswer(message);
  if (topic) {
    return NextResponse.json({
      reply: topic.answer,
      topicId: topic.id,
      steps: topic.steps || [],
      suggestions: CHAT_SUGGESTIONS,
    });
  }

  // 2) Special UI actions.
  const lower = message.toLowerCase();
  if (/(show me around|guided tour|walkthrough|take.*tour|start.*tour|onboard)/.test(lower)) {
    return NextResponse.json({
      reply:
        'Absolutely — let me open the guided tour for you. It walks through contacts, HyperNexus, workflows, the AI Assistant, and personalization in a few quick popups.',
      action: 'start-tour',
      suggestions: CHAT_SUGGESTIONS,
    });
  }
  if (/(help center|videos|faq|documentation|docs|watch.*video)/.test(lower)) {
    return NextResponse.json({
      reply:
        'I can open the Help Center, which has searchable FAQs and video guides. Opening it now…',
      action: 'open-help',
      suggestions: CHAT_SUGGESTIONS,
    });
  }

  // 3) Fall back to the configured AI engine (native / control-plane / hybrid).
  try {
    const recent = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n');
    const prompt = recent
      ? `Conversation so far:\n${recent}\n\nUser's latest question: ${message}`
      : `User's question: ${message}`;

    const ai = await getAIEngine().complete(prompt, SYSTEM_PROMPT);
    if (ai) {
      return NextResponse.json({
        reply: ai.trim(),
        suggestions: CHAT_SUGGESTIONS,
      });
    }
  } catch (error) {
    console.error('Help chat AI error:', error);
  }

  return NextResponse.json({
    reply:
      'I could not reach an AI provider right now. Please try again in a moment, or open the Help Center for FAQs and video guides.',
    action: 'open-help',
    suggestions: CHAT_SUGGESTIONS,
  });
}
