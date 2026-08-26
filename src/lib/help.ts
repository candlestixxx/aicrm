export interface HelpTopic {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  steps?: string[];
}

export interface VideoGuide {
  id: string;
  title: string;
  description: string;
  /** YouTube embed URL (without params). Replace with your own videos. */
  embedUrl?: string;
  duration: string;
}

/**
 * The AiCRM help knowledge base. Used by both the Help Center UI and the
 * `/api/help` chatbot (rule-based matching before falling back to the LLM).
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    question: 'How do I get started with AiCRM?',
    keywords: ['get started', 'start', 'begin', 'first', 'onboard', 'welcome'],
    answer:
      'Start by adding your contacts (manually or via CSV import), connect an AI provider in the AI Models tab, then explore HyperNexus to run commands and build automations in plain English.',
    steps: [
      'Open the Contacts tab and click "Add Contact" (or Import CSV).',
      'Go to AI Models and connect at least one provider key.',
      'Open the HyperNexus tab and try a command like "summarize my brokerage".',
      'Build your first workflow: e.g. "When a lead replies yes → mark Hot".',
      'Personalize your look with the theme switcher (top-right).',
    ],
  },
  {
    id: 'add-contact',
    question: 'How do I add or import contacts?',
    keywords: ['add contact', 'import', 'csv', 'new contact', 'upload contacts'],
    answer:
      'Use the Contacts tab. You can add a single contact with the "Add Contact" button, or bulk-import via "Import CSV" with header mapping and error reporting.',
    steps: [
      'Open the Contacts tab.',
      'Click "Add Contact" for a single entry, or "Import CSV" for a bulk upload.',
      'Map your CSV columns to CRM fields and review any errors.',
    ],
  },
  {
    id: 'hypernexus',
    question: 'What is HyperNexus and how do I use it?',
    keywords: ['hypernexus', 'command', 'natural language', 'nl', 'console', 'automation'],
    answer:
      'HyperNexus is the AI orchestration layer. Type plain-English commands in the HyperNexus console (e.g. "list contacts", "update lead X to hot") and it translates your intent into real database actions.',
    steps: [
      'Open the HyperNexus tab → Assistant & Workflows.',
      'Type a command in the console and press Run.',
      'Example commands: "list contacts", "create a task to call John", "summarize my brokerage".',
    ],
  },
  {
    id: 'workflows',
    question: 'How do workflows (automations) work?',
    keywords: ['workflow', 'automation', 'if then', 'trigger', 'action', 'drip'],
    answer:
      'Workflows are "if this, then that" automations. Pick a trigger (e.g. communication received), a condition (e.g. reply contains "yes"), and one or more actions (update stage, create task, send message, AI draft).',
    steps: [
      'Open the HyperNexus tab → Assistant & Workflows.',
      'Scroll to the Workflow Builder.',
      'Choose a trigger, add a condition, then stack actions (steps).',
      'Save and it runs automatically when the trigger fires.',
    ],
  },
  {
    id: 'ai-assistant',
    question: 'What does the AI Assistant do?',
    keywords: ['assistant', 'ai assistant', 'digest', 'nudge', 'cma', 'enrich', 'next best'],
    answer:
      'The AI Assistant is your proactive intelligence layer: a daily digest, next-best-action recommendations, smart nudges for overdue follow-ups, lead-going-cold alerts, lead↔property matching, CMA generation, and AI lead enrichment.',
  },
  {
    id: 'theme',
    question: 'How do I change the theme or accent color?',
    keywords: ['theme', 'dark', 'light', 'color', 'palette', 'accent', 'customize', 'wheel'],
    answer:
      'Click the theme button in the top-right corner. Switch between light/dark/system, hover a palette to preview it, click to apply — or pick "Custom" to use the color wheel and dial in your own accent color.',
    steps: [
      'Click the sun/moon button in the top-right of the dashboard.',
      'Choose Light, Dark, or System.',
      'Hover a palette to preview, click to apply.',
      'Choose "Custom" and use the color wheel + sliders for any color.',
    ],
  },
  {
    id: 'models',
    question: 'How do I connect AI models / API keys?',
    keywords: ['model', 'api key', 'openai', 'gemini', 'deepseek', 'provider', 'vault', 'router'],
    answer:
      'Go to AI Models to add provider keys (stored encrypted in the Vault), or use the Vault tab directly. The router tiers tasks across models to balance cost and capability.',
  },
  {
    id: 'pipeline',
    question: 'How does the pipeline / kanban work?',
    keywords: ['pipeline', 'kanban', 'stage', 'drag', 'lead stage', 'board'],
    answer:
      'The Pipeline tab shows your leads as a drag-and-drop kanban board. Drag a lead card between stages to update it instantly; budgets and timelines are shown on each card.',
  },
  {
    id: 'mcp',
    question: 'Can external AI agents connect to my CRM?',
    keywords: ['mcp', 'claude desktop', 'cursor', 'external', 'agent', 'api', 'tools'],
    answer:
      'Yes. AiCRM exposes a Model Context Protocol (MCP) endpoint at POST /api/mcp (Authorization: Bearer MCP_TOKEN). Any MCP client (Claude Desktop, Cursor, custom agents) can call CRM tools like list_contacts, create_task, and update_lead_stage.',
  },
  {
    id: 'campaigns',
    question: 'How do drip campaigns work?',
    keywords: ['campaign', 'drip', 'sms', 'email', 'marketing', 'steps'],
    answer:
      'Campaigns let you sequence SMS/email steps to nurture leads over time. Create a campaign, add steps, then activate or pause it. Delivery uses Twilio (SMS) and Resend (email) when configured.',
  },
];

export const VIDEO_GUIDES: VideoGuide[] = [
  {
    id: 'tour',
    title: 'Quick tour of AiCRM',
    description: 'A 2-minute walkthrough of the dashboard, contacts, and pipeline.',
    duration: '2:04',
  },
  {
    id: 'hypernexus',
    title: 'HyperNexus commands & workflows',
    description: 'How to automate your CRM with plain-English commands and if/then workflows.',
    duration: '3:41',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant & lead intelligence',
    description: 'Daily digest, nudges, CMA, and enrichment explained.',
    duration: '4:12',
  },
];

export const CHAT_SUGGESTIONS = [
  'How do I add a contact?',
  'What is HyperNexus?',
  'How do workflows work?',
  'Change my theme',
  'Connect an AI model',
];

/** Simple keyword-based matcher for the help chatbot (no LLM cost for common Qs). */
export function findHelpAnswer(query: string): HelpTopic | null {
  const q = query.toLowerCase();
  let best: HelpTopic | null = null;
  let bestScore = 0;
  for (const topic of HELP_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  return bestScore > 0 ? best : null;
}
