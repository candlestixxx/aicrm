import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/mailer';
import { hypernexusMemoryAdd } from '@/lib/hypernexus/client';

/**
 * HyperNexus Workflow Engine
 *
 * Conditional "if this, then that" automation. A workflow has:
 *   - triggerEvent: which CRM event activates it
 *   - triggerCondition: an optional filter (field/operator/value)
 *   - actions: a list of CRM operations to perform
 *
 * Example (from README):
 *   "If a lead replies 'Yes', update their stage to 'Hot' and email the broker"
 *   → triggerEvent: communication_received
 *   → condition: { field: "body", operator: "contains", value: "yes" }
 *   → actions: [ { type: "update_lead_stage", ... }, { type: "notify", ... } ]
 */

export type TriggerEvent =
  | 'communication_received'
  | 'lead_created'
  | 'lead_updated'
  | 'contact_created'
  | 'task_completed';

export interface TriggerCondition {
  field: string;
  operator: 'contains' | 'equals' | 'not_contains' | 'exists';
  value?: string;
}

export interface WorkflowAction {
  type:
    | 'update_lead_stage'
    | 'create_communication'
    | 'create_task'
    | 'add_activity'
    | 'notify';
  // update_lead_stage
  status?: string;
  stageId?: string;
  // create_communication / notify
  channel?: string;
  body?: string;
  subject?: string;
  // create_task
  title?: string;
  priority?: string;
  // add_activity
  note?: string;
  // notify (email to agent)
  email?: string;
}

interface WorkflowRecord {
  id: string;
  brokerageId: string;
  name: string;
  triggerEvent: string;
  triggerCondition: string | null;
  actions: string;
}

export interface WorkflowEventPayload {
  event: TriggerEvent;
  brokerageId: string;
  contactId?: string;
  leadId?: string;
  data?: Record<string, unknown>;
}

function evaluateCondition(
  condition: TriggerCondition | null,
  payload: WorkflowEventPayload
): boolean {
  if (!condition) return true; // no condition = always fire

  // Look up the field value from the payload data
  const value = payload.data?.[condition.field] ?? '';

  switch (condition.operator) {
    case 'contains':
      return String(value).toLowerCase().includes((condition.value ?? '').toLowerCase());
    case 'not_contains':
      return !String(value).toLowerCase().includes((condition.value ?? '').toLowerCase());
    case 'equals':
      return String(value).toLowerCase() === (condition.value ?? '').toLowerCase();
    case 'exists':
      return value !== undefined && value !== null && value !== '';
    default:
      return true;
  }
}

async function executeAction(
  action: WorkflowAction,
  payload: WorkflowEventPayload
): Promise<string> {
  switch (action.type) {
    case 'update_lead_stage': {
      const leadId = payload.leadId;
      if (!leadId || !action.status) {
        return 'skipped: missing leadId or status';
      }
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          ...(action.status && { status: action.status }),
          ...(action.stageId && { stageId: action.stageId }),
          lastContacted: new Date(),
        },
      });
      return `lead ${leadId} → ${action.status}`;
    }

    case 'create_communication': {
      if (!payload.contactId || !action.body) {
        return 'skipped: missing contactId or body';
      }
      await prisma.communication.create({
        data: {
          contactId: payload.contactId,
          direction: 'outbound',
          channel: action.channel || 'email',
          body: action.body,
          status: 'queued',
        },
      });
      return `communication queued via ${action.channel || 'email'}`;
    }

    case 'create_task': {
      if (!action.title) return 'skipped: missing title';
      const agent = await prisma.agent.findFirst({
        where: { brokerageId: payload.brokerageId },
        select: { id: true },
      });
      if (!agent) return 'skipped: no agent found';
      await prisma.task.create({
        data: {
          agentId: agent.id,
          title: action.title,
          priority: action.priority || 'medium',
          contactId: payload.contactId || null,
        },
      });
      return `task created: ${action.title}`;
    }

    case 'add_activity': {
      if (!payload.contactId || !action.note) {
        return 'skipped: missing contactId or note';
      }
      await prisma.activity.create({
        data: {
          contactId: payload.contactId,
          type: 'note',
          description: action.note,
        },
      });
      return 'activity logged';
    }

    case 'notify': {
      if (!action.email) return 'skipped: missing email';
      await sendEmail({
        to: action.email,
        subject: action.subject || `HyperNexus workflow triggered`,
        text: action.body || `A workflow was triggered in your CRM.`,
      });
      return `notification sent to ${action.email}`;
    }

    default:
      return `unknown action type: ${(action as { type: string }).type}`;
  }
}

/**
 * Run all active workflows matching the given event.
 * Returns a summary of what executed.
 */
export async function triggerWorkflows(
  payload: WorkflowEventPayload
): Promise<{ triggered: number; results: string[] }> {
  const workflows = (await prisma.workflow.findMany({
    where: {
      brokerageId: payload.brokerageId,
      status: 'active',
      triggerEvent: payload.event,
    },
  })) as WorkflowRecord[];

  const results: string[] = [];
  let triggered = 0;

  for (const workflow of workflows) {
    let condition: TriggerCondition | null = null;
    try {
      condition = workflow.triggerCondition
        ? (JSON.parse(workflow.triggerCondition) as TriggerCondition)
        : null;
    } catch {
      condition = null;
    }

    if (!evaluateCondition(condition, payload)) continue;

    let actions: WorkflowAction[] = [];
    try {
      actions = JSON.parse(workflow.actions) as WorkflowAction[];
    } catch {
      continue;
    }

    const actionResults: string[] = [];
    for (const action of actions) {
      try {
        actionResults.push(await executeAction(action, payload));
      } catch (err) {
        actionResults.push(
          `error: ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    }

    triggered++;
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { runCount: { increment: 1 }, lastRunAt: new Date() },
    });

    // Mirror the execution into HyperNexus persistent memory (best-effort)
    hypernexusMemoryAdd({
      namespace: 'aicrm',
      type: 'episodic',
      content: `Workflow "${workflow.name}" triggered by ${payload.event}: ${actionResults.join('; ')}`,
      tags: ['workflow', workflow.triggerEvent],
    }).catch(() => {
      /* HyperNexus offline — ignore */
    });

    results.push(`[${workflow.name}] ${actionResults.join('; ')}`);
  }

  return { triggered, results };
}

export const TRIGGER_EVENTS: { value: TriggerEvent; label: string; description: string }[] = [
  {
    value: 'communication_received',
    label: 'Communication Received',
    description: 'Fires when a contact replies or a communication comes in',
  },
  {
    value: 'lead_created',
    label: 'Lead Created',
    description: 'Fires when a new lead is added',
  },
  {
    value: 'lead_updated',
    label: 'Lead Updated',
    description: 'Fires when a lead status or stage changes',
  },
  {
    value: 'contact_created',
    label: 'Contact Created',
    description: 'Fires when any contact is added',
  },
  {
    value: 'task_completed',
    label: 'Task Completed',
    description: 'Fires when a task is marked complete',
  },
];
