import prisma from '@/lib/db/prisma';
import { getAIEngine } from '@/lib/ai/engine';

/** Call the configured AI engine (native by default, or control-plane/hybrid). */
async function callLLM(prompt: string, system?: string): Promise<string | null> {
  return getAIEngine().complete(prompt, system);
}

// ─── 2. Next Best Action ────────────────────────────────────────
export async function nextBestAction(brokerageId: string) {
  const leads = await prisma.lead.findMany({
    where: {
      contact: { brokerageId },
      status: { in: ['new', 'active', 'hot', 'cold'] },
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      stage: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { lastContacted: 'asc' }],
    take: 15,
  });

  if (leads.length === 0) return { recommendations: [], summary: 'No active leads yet.' };

  const prompt = `You are a real estate CRM assistant. Given these leads, recommend the single best next action for EACH, prioritized by urgency. Be specific and actionable (e.g., "call today", "send comps", "nudge about pre-approval").\n\nLeads:\n${JSON.stringify(
    leads.map((l) => ({
      name: `${l.contact.firstName} ${l.contact.lastName}`,
      status: l.status,
      stage: l.stage?.name,
      lastContacted: l.lastContacted,
    })),
    null,
    2
  )}\n\nRespond as a JSON array: [{"name":"...","action":"...","urgency":"high|medium|low"}]`;

  const raw = await callLLM(prompt);
  let recommendations: { name: string; action: string; urgency: string }[] = [];
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) recommendations = parsed;
  } catch {
    recommendations = leads.map((l) => ({
      name: `${l.contact.firstName} ${l.contact.lastName}`,
      action: `Follow up (${l.status})`,
      urgency: l.status === 'hot' ? 'high' : 'medium',
    }));
  }

  const summary = `${recommendations.length} leads prioritized. Top: ${recommendations[0]?.name || 'n/a'}.`;
  return { recommendations, summary };
}

// ─── 3. Smart Nudges (reminders) ────────────────────────────────
export async function getNudges(brokerageId: string) {
  const now = new Date();
  const leads = await prisma.lead.findMany({
    where: {
      contact: { brokerageId },
      status: { in: ['new', 'active', 'hot'] },
    },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });

  const nudges: { message: string; urgency: string }[] = [];

  for (const lead of leads) {
    const last = lead.lastContacted || lead.createdAt;
    const days = Math.floor((now.getTime() - last.getTime()) / 86400000);

    if (lead.status === 'hot' && days >= 2) {
      nudges.push({
        message: `${lead.contact.firstName} ${lead.contact.lastName} is HOT but you haven't contacted them in ${days} days.`,
        urgency: 'high',
      });
    } else if (lead.status === 'active' && days >= 5) {
      nudges.push({
        message: `${lead.contact.firstName} ${lead.contact.lastName} has been quiet for ${days} days — re-engage.`,
        urgency: 'medium',
      });
    } else if (lead.status === 'new' && days >= 3) {
      nudges.push({
        message: `New lead ${lead.contact.firstName} ${lead.contact.lastName} hasn't been contacted in ${days} days.`,
        urgency: 'medium',
      });
    }
  }

  nudges.sort((a, b) => (a.urgency === 'high' ? -1 : b.urgency === 'high' ? 1 : 0));
  return nudges.slice(0, 10);
}

// ─── 8. Lead Going-Cold Detector ────────────────────────────────
export async function leadHealth(brokerageId: string) {
  const leads = await prisma.lead.findMany({
    where: {
      contact: { brokerageId },
      status: { in: ['hot', 'active'] },
    },
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          communications: { orderBy: { sentAt: 'desc' }, take: 3 },
        },
      },
    },
  });

  const now = new Date();
  const atRisk: { name: string; reason: string }[] = [];

  for (const lead of leads) {
    const last = lead.lastContacted || lead.createdAt;
    const days = Math.floor((now.getTime() - last.getTime()) / 86400000);
    const lastComms = lead.contact.communications;
    const lastDirection = lastComms[0]?.direction;

    if (lead.status === 'hot' && days >= 3) {
      atRisk.push({
        name: `${lead.contact.firstName} ${lead.contact.lastName}`,
        reason: `Was hot but no contact in ${days} days — cooling risk.`,
      });
    } else if (days >= 7) {
      atRisk.push({
        name: `${lead.contact.firstName} ${lead.contact.lastName}`,
        reason: `${days} days since last touch — likely going cold.`,
      });
    } else if (lastDirection === 'outbound' && days >= 3) {
      atRisk.push({
        name: `${lead.contact.firstName} ${lead.contact.lastName}`,
        reason: 'Last message was from you with no reply yet.',
      });
    }
  }

  return atRisk;
}

// ─── 6. Property ↔ Lead Matching ────────────────────────────────
export async function matchProperties(brokerageId: string) {
  const [leads, properties] = await Promise.all([
    prisma.lead.findMany({
      where: {
        contact: { brokerageId },
        status: { in: ['new', 'active', 'hot'] },
      },
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
    prisma.property.findMany({
      where: { brokerageId, status: 'active' },
      take: 50,
    }),
  ]);

  const matches: { lead: string; property: string; score: number; reason: string }[] = [];

  for (const lead of leads) {
    for (const prop of properties) {
      let score = 0;
      const reasons: string[] = [];
      if (lead.propertyType && lead.propertyType === prop.propertyType) {
        score += 3;
        reasons.push('property type');
      }
      if (lead.budgetMax && prop.listPrice && prop.listPrice <= lead.budgetMax) {
        score += 2;
        reasons.push('within budget');
      }
      if (score >= 4) {
        matches.push({
          lead: `${lead.contact.firstName} ${lead.contact.lastName}`,
          property: `${prop.address}, ${prop.city}`,
          score,
          reason: reasons.join(', '),
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 20);
}

// ─── 7. CMA Generator ───────────────────────────────────────────
export async function generateCMA(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return null;

  const prompt = `Generate a Comparative Market Analysis (CMA) for this property:\n${JSON.stringify(property, null, 2)}\n\nInclude: estimated market value, suggested list price, comparable reasoning, and a short marketing summary. Be professional and realistic.`;
  const cma = await callLLM(prompt);
  return { property: property.address, cma };
}

// ─── 5. AI Lead Enrichment ──────────────────────────────────────
export async function enrichLead(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { lead: true },
  });
  if (!contact) return null;

  const prompt = `Based on this partial lead profile, infer likely details and provide enrichment suggestions (budget range, likely property type, timeline, ideal next steps). Be honest that these are estimates.\n\n${JSON.stringify({ name: `${contact.firstName} ${contact.lastName}`, source: contact.source, city: contact.city, state: contact.state, notes: contact.notes, lead: contact.lead }, null, 2)}`;

  const enrichment = await callLLM(prompt);
  return { contactId, name: `${contact.firstName} ${contact.lastName}`, enrichment };
}

// ─── 11. Daily Digest ───────────────────────────────────────────
export async function dailyDigest(brokerageId: string) {
  const [contactCount, leadCount, hotLeads, pendingTasks, atRisk, nudges] =
    await Promise.all([
      prisma.contact.count({ where: { brokerageId } }),
      prisma.lead.count({ where: { contact: { brokerageId } } }),
      prisma.lead.count({ where: { contact: { brokerageId }, status: 'hot' } }),
      prisma.task.count({ where: { agent: { brokerageId }, status: 'pending' } }),
      leadHealth(brokerageId),
      getNudges(brokerageId),
    ]);

  return {
    date: new Date().toISOString().split('T')[0],
    stats: { contactCount, leadCount, hotLeads, pendingTasks },
    atRisk: atRisk.slice(0, 5),
    nudges: nudges.slice(0, 5),
    headline: `${hotLeads} hot leads · ${pendingTasks} pending tasks · ${atRisk.length} at-risk leads need attention today.`,
  };
}
