import prisma from '@/lib/db/prisma';
import { getAIEngine } from '@/lib/ai/engine';

/** Call the configured AI engine (native by default, or control-plane/hybrid). */
async function callLLM(prompt: string, system?: string): Promise<string | null> {
  return getAIEngine().complete(prompt, system);
}

/**
 * HyperNexus Workflow Engine
 *
 * Translates natural-language commands into executable CRM actions.
 * v1 uses rule-based intent detection with optional LLM interpretation
 * for ambiguous commands. Each action operates within the caller's
 * brokerage scope.
 */

export interface HyperNexusContext {
  brokerageId: string;
  agentId?: string;
}

export interface HyperNexusResult {
  success: boolean;
  intent?: string;
  action?: string;
  message: string;
  data?: unknown;
  usedLLM?: boolean;
}

type ActionExecutor = (
  ctx: HyperNexusContext,
  params: Record<string, string>
) => Promise<HyperNexusResult>;

interface IntentRule {
  intent: string;
  patterns: RegExp[];
  execute: ActionExecutor;
}

// ─── Intent Handlers ────────────────────────────────────────────

const updateLeadStage: ActionExecutor = async (ctx, params) => {
  const statusMap: Record<string, string> = {
    new: 'new', active: 'active', hot: 'hot', cold: 'cold',
    'closed won': 'closed_won', won: 'closed_won',
    'closed lost': 'closed_lost', lost: 'closed_lost',
    contacted: 'active',
  };

  const rawStatus = params['stage'] || params['status'] || '';
  const status = statusMap[rawStatus.toLowerCase()];

  if (!status) {
    return { success: false, message: `Unknown lead status: "${rawStatus}"` };
  }

  const leadId = params['lead'];
  if (!leadId) {
    return {
      success: false,
      message: 'Specify which lead to update (e.g., "update lead [name] to hot")',
    };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      contact: { brokerageId: ctx.brokerageId },
    },
  });

  if (!lead) {
    return { success: false, message: `Lead "${leadId}" not found` };
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status, lastContacted: new Date() },
  });

  await prisma.activity.create({
    data: {
      contactId: lead.contactId,
      type: 'status_change',
      description: `HyperNexus: stage updated to "${status}"`,
    },
  });

  return {
    success: true,
    message: `Lead "${leadId}" updated to "${status}"`,
  };
};

const createTask: ActionExecutor = async (ctx, params) => {
  const title = params['title'] || params['task'];
  if (!title) {
    return { success: false, message: 'Specify the task title' };
  }

  const task = await prisma.task.create({
    data: {
      agentId: ctx.agentId!,
      title,
      type: params['type'] || 'follow_up',
      priority: params['priority'] || 'medium',
      dueDate: params['when'] ? new Date(params['when']) : null,
    },
  });

  return {
    success: true,
    message: `Task "${title}" created`,
    data: task,
  };
};

const listContacts: ActionExecutor = async (ctx) => {
  const contacts = await prisma.contact.findMany({
    where: { brokerageId: ctx.brokerageId },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isLead: true,
    },
  });

  return {
    success: true,
    message: `Found ${contacts.length} recent contacts`,
    data: contacts,
  };
};

const summarizeBrokerage: ActionExecutor = async (ctx) => {
  const [contactCount, leadCount, propertyCount, taskCount, hotLeads] =
    await Promise.all([
      prisma.contact.count({ where: { brokerageId: ctx.brokerageId } }),
      prisma.lead.count({
        where: { contact: { brokerageId: ctx.brokerageId } },
      }),
      prisma.property.count({ where: { brokerageId: ctx.brokerageId } }),
      prisma.task.count({
        where: { agent: { brokerageId: ctx.brokerageId }, status: 'pending' },
      }),
      prisma.lead.count({
        where: {
          contact: { brokerageId: ctx.brokerageId },
          status: 'hot',
        },
      }),
    ]);

  return {
    success: true,
    message: `Your brokerage has ${contactCount} contacts, ${leadCount} leads (${hotLeads} hot), ${propertyCount} properties, and ${taskCount} pending tasks.`,
    data: { contactCount, leadCount, propertyCount, taskCount, hotLeads },
  };
};

const listProperties: ActionExecutor = async (ctx, params) => {
  const where: Record<string, unknown> = { brokerageId: ctx.brokerageId };
  if (params['status']) where.status = params['status'];
  if (params['city']) where.city = { contains: params['city'] };

  const properties = await prisma.property.findMany({
    where,
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, address: true, city: true, state: true,
      listPrice: true, bedrooms: true, bathrooms: true, status: true,
    },
  });

  return {
    success: true,
    message: `Found ${properties.length} properties`,
    data: properties,
  };
};

const listTasks: ActionExecutor = async (ctx, params) => {
  const where: Record<string, unknown> = { agentId: ctx.agentId };
  if (params['status']) where.status = params['status'];

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    select: { id: true, title: true, priority: true, status: true, dueDate: true },
  });

  const pending = tasks.filter((t) => t.status !== 'completed').length;
  return {
    success: true,
    message: `Found ${tasks.length} tasks (${pending} pending)`,
    data: tasks,
  };
};

const getContact: ActionExecutor = async (ctx, params) => {
  const id = params['id'] || params['contact'];
  if (!id) {
    return { success: false, message: 'Specify a contact ID (e.g., "get contact [id]")' };
  }

  const contact = await prisma.contact.findFirst({
    where: { id, brokerageId: ctx.brokerageId },
    include: {
      lead: { include: { stage: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!contact) {
    return { success: false, message: `Contact "${id}" not found` };
  }

  return {
    success: true,
    message: `${contact.firstName} ${contact.lastName}${contact.lead ? ` — lead (${contact.lead.status})` : ''}`,
    data: contact,
  };
};

const negotiate: ActionExecutor = async (ctx, params) => {
  const topic = params['topic'] || params['about'] || 'this offer';
  const advice = await callLLM(
    `Act as an expert real estate negotiation advisor. Give concrete, actionable advice on: ${topic}. Keep it under 200 words.`
  );
  if (!advice) {
    return { success: false, message: 'No AI key configured. Add one in AI Models to use the negotiation advisor.' };
  }
  if (ctx.agentId) {
    // store as a task note for the agent
    await prisma.task.create({
      data: { agentId: ctx.agentId, title: `Negotiation advice: ${topic.slice(0, 50)}`, type: 'other', description: advice },
    });
  }
  return { success: true, message: advice };
};

const draftContent: ActionExecutor = async (ctx, params) => {
  const kind = params['kind'] || params['channel'] || 'email';
  const topic = params['topic'] || params['about'] || 'follow up';
  const draft = await callLLM(
    `Draft a professional ${kind} for a real estate client about: ${topic}. Keep it concise and warm.`
  );
  if (!draft) {
    return { success: false, message: 'No AI key configured. Add one in AI Models to use drafting.' };
  }
  return { success: true, message: draft };
};

const sendCommunication: ActionExecutor = async (ctx, params) => {
  const contactId = params['contact'];
  const body = params['body'] || params['message'];
  const channel = params['channel'] || 'email';

  if (!contactId || !body) {
    return {
      success: false,
      message: 'Specify the contact and message content',
    };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, brokerageId: ctx.brokerageId },
  });

  if (!contact) {
    return { success: false, message: `Contact "${contactId}" not found` };
  }

  const comm = await prisma.communication.create({
    data: {
      contactId: contact.id,
      direction: 'outbound',
      channel,
      body,
      status: 'queued',
    },
  });

  return {
    success: true,
    message: `Communication queued for ${contact.firstName} ${contact.lastName} via ${channel}`,
    data: comm,
  };
};

// ─── Intent Rules ───────────────────────────────────────────────

export const INTENT_RULES: IntentRule[] = [
  {
    intent: 'update_lead_stage',
    patterns: [
      /update\s+(?:lead\s+)?(?<lead>\S+)\s+to\s+(?<stage>hot|cold|active|new|closed won|closed lost|won|lost|contacted)/i,
      /set\s+(?:lead\s+)?(?<lead>\S+)\s+(?:stage|status)\s+to\s+(?<stage>hot|cold|active|new|closed won|closed lost|won|lost|contacted)/i,
      /mark\s+(?:lead\s+)?(?<lead>\S+)\s+as\s+(?<stage>hot|cold|active|new|closed won|closed lost|won|lost|contacted)/i,
    ],
    execute: updateLeadStage,
  },
  {
    intent: 'create_task',
    patterns: [
      /(?:create|add|schedule)\s+(?:a\s+)?task\s+(?:to\s+)?(?<title>.+?)(?:\s+(?:for|due|when|at)\s+(?<when>.+))?$/i,
      /remind\s+me\s+to\s+(?<title>.+)/i,
    ],
    execute: createTask,
  },
  {
    intent: 'list_contacts',
    patterns: [
      /(?:list|show|get|display)\s+(?:all\s+)?(?:my\s+)?contacts/i,
      /who\s+are\s+my\s+(?:recent\s+)?contacts/i,
    ],
    execute: listContacts,
  },
  {
    intent: 'summarize_brokerage',
    patterns: [
      /(?:summarize|summary|overview|dashboard|stats|status)\s+(?:of\s+)?(?:my\s+)?(?:brokerage|business|crm|pipeline|account)/i,
    ],
    execute: summarizeBrokerage,
  },
  {
    intent: 'send_communication',
    patterns: [
      /(?:send|draft)\s+(?:an?\s+)?(?<channel>email|sms|text)\s+to\s+(?<contact>\S+)\s*(?::|saying|with\s+message)?\s*(?<body>.+)?/i,
    ],
    execute: sendCommunication,
  },
  {
    intent: 'list_properties',
    patterns: [
      /(?:list|show|get|display)\s+(?:all\s+)?(?:my\s+)?(?:properties|listings)/i,
      /(?:what|which)\s+(?:properties|listings)\s+(?:do\s+I\s+have|are\s+active)/i,
    ],
    execute: listProperties,
  },
  {
    intent: 'list_tasks',
    patterns: [
      /(?:list|show|get|display)\s+(?:all\s+)?(?:my\s+)?tasks/i,
      /what\s+are\s+my\s+(?:pending\s+)?tasks/i,
    ],
    execute: listTasks,
  },
  {
    intent: 'get_contact',
    patterns: [
      /(?:get|show|display)\s+(?:contact\s+)?(?<id>\S+)\s+(?:details|info|profile)?/i,
      /lookup\s+(?:contact\s+)?(?<id>\S+)/i,
    ],
    execute: getContact,
  },
  {
    intent: 'negotiate',
    patterns: [
      /(?:advise|negotiate|should\s+i\s+counter|what\s+should\s+i\s+offer)(?:\s+on)?\s+(?<topic>.+)/i,
      /negotiation\s+(?:advice|advisor)\s+(?:for|on)\s+(?<topic>.+)/i,
    ],
    execute: negotiate,
  },
  {
    intent: 'draft',
    patterns: [
      /(?:draft|write|compose)\s+(?:an?\s+)?(?<kind>email|sms|text|message|letter)\s+(?:to\s+\S+\s+)?(?:about|for|saying)\s+(?<topic>.+)/i,
    ],
    execute: draftContent,
  },
];

export function detectIntent(
  command: string
): { intent: string; params: Record<string, string> } | null {
  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      const match = command.match(pattern);
      if (match) {
        const params: Record<string, string> = {};
        if (match.groups) {
          for (const [key, value] of Object.entries(match.groups)) {
            if (value) params[key] = value.trim();
          }
        }
        return { intent: rule.intent, params };
      }
    }
  }
  return null;
}

// ─── Public API ─────────────────────────────────────────────────

export async function executeCommand(
  command: string,
  ctx: HyperNexusContext,
  opts: { useLLMFallback?: boolean } = {}
): Promise<HyperNexusResult> {
  // Try rule-based matching first
  const detected = detectIntent(command);
  if (detected) {
    const rule = INTENT_RULES.find((r) => r.intent === detected.intent);
    if (rule) {
      const result = await rule.execute(ctx, detected.params);
      return { ...result, intent: rule.intent, action: rule.intent };
    }
  }

  // No rule matched — optionally use LLM to interpret
  if (opts.useLLMFallback) {
    const llmResult = await interpretWithLLM(command);
    if (llmResult) return llmResult;
  }

  return {
    success: false,
    intent: 'unknown',
    message:
      'I did not understand that command. Try things like:\n' +
      '• "update lead [name] to hot"\n' +
      '• "create a task to call John tomorrow"\n' +
      '• "list contacts"\n' +
      '• "summarize my brokerage"',
  };
}

async function interpretWithLLM(
  command: string
): Promise<HyperNexusResult | null> {
  try {
    const completion = await callLLM(
      command,
      'You are interpreting a natural-language CRM command. Respond with ONLY a JSON object: {"intent":"...","message":"..."} describing what action to take. If unclear, use intent "unknown".'
    );
    if (!completion) return null;

    // Best-effort: treat LLM output as guidance, not execution
    return {
      success: true,
      intent: 'llm_interpreted',
      message: completion,
      usedLLM: true,
    };
  } catch {
    return null;
  }
}
